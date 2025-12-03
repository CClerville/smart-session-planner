// =============================================================================
// SUGGESTIONS ROUTER
// =============================================================================
// Smart scheduling algorithm that suggests optimal time slots based on:
// - User availability windows
// - Existing scheduled sessions
// - Session type priority
// - Fatigue/spacing heuristics
// - User-configurable preferences with per-request overrides
// =============================================================================

import { getSuggestionsSchema } from "../lib/schemas.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  score: number;
  reasons: string[];
}

interface DaySchedule {
  date: Date;
  highPriorityCount: number;
  totalMinutes: number;
}

/** Resolved configuration after merging defaults, user prefs, and request overrides */
interface SuggestionConfig {
  maxDailyMinutes: number;
  bufferMinutes: number;
  preferMornings: boolean;
  maxHighPriorityPerDay: number;
  timezone: string;
}

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: SuggestionConfig = {
  maxDailyMinutes: 480, // 8 hours
  bufferMinutes: 30, // 30-min gap between sessions
  preferMornings: true, // Bonus for morning slots
  maxHighPriorityPerDay: 2, // Max priority 4-5 sessions per day
  timezone: "UTC",
};

/** Morning hours considered optimal for high-priority (24h format) */
const MORNING_START = 6;
const MORNING_END = 12;

/** Maximum suggestions to return */
const MAX_SUGGESTIONS = 10;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get start of day for a date in a specific timezone
 */
function startOfDayInTimezone(date: Date, timezone: string): Date {
  try {
    // Format the date in the target timezone to get the local date string
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateStr = formatter.format(date);
    // Parse back as UTC midnight for that date
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0));
  } catch {
    // Fallback to simple approach if timezone is invalid
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

/**
 * Get the hour in a specific timezone
 */
function getHourInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(date), 10);
  } catch {
    return date.getHours();
  }
}

/**
 * Get day of week in a specific timezone (0 = Sunday)
 */
function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const dayStr = formatter.format(date);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.indexOf(dayStr);
  } catch {
    return date.getDay();
  }
}

/**
 * Check if two time ranges overlap
 */
function overlaps(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Score a time slot based on various heuristics
 * Uses config-driven values instead of hardcoded constants
 */
function scoreSlot(
  slot: { startTime: Date; endTime: Date },
  priority: number,
  daySchedule: DaySchedule,
  existingSessions: { startTime: Date; endTime: Date }[],
  config: SuggestionConfig
): { score: number; reasons: string[] } {
  let score = 100; // Start with base score
  const reasons: string[] = [];

  const hour = getHourInTimezone(slot.startTime, config.timezone);

  // ---------------------------------------------------------------------------
  // Priority-based morning preference (configurable)
  // ---------------------------------------------------------------------------
  if (config.preferMornings && priority >= 4 && hour >= MORNING_START && hour < MORNING_END) {
    score += 20;
    reasons.push("Morning slot (optimal for high priority)");
  }

  // ---------------------------------------------------------------------------
  // Fatigue heuristic: Penalize clustering high-priority sessions
  // ---------------------------------------------------------------------------
  if (priority >= 4 && daySchedule.highPriorityCount >= config.maxHighPriorityPerDay) {
    score -= 40;
    reasons.push("Day already has high-priority sessions");
  }

  // ---------------------------------------------------------------------------
  // Spacing heuristic: Prefer slots with gaps from other sessions
  // ---------------------------------------------------------------------------
  const slotStart = slot.startTime.getTime();
  const slotEnd = slot.endTime.getTime();
  const minGapMs = config.bufferMinutes * 2 * 60 * 1000; // Double buffer as ideal gap

  for (const session of existingSessions) {
    const sessionStart = session.startTime.getTime();
    const sessionEnd = session.endTime.getTime();

    // Calculate gap in milliseconds
    const gapBefore = slotStart - sessionEnd;
    const gapAfter = sessionStart - slotEnd;

    // Penalize slots too close to existing sessions
    if (gapBefore > 0 && gapBefore < minGapMs) {
      score -= 10;
      if (!reasons.includes("Close to previous session")) {
        reasons.push("Close to previous session");
      }
    }
    if (gapAfter > 0 && gapAfter < minGapMs) {
      score -= 10;
      if (!reasons.includes("Close to next session")) {
        reasons.push("Close to next session");
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Balance heuristic: Slightly penalize days with heavy schedules
  // ---------------------------------------------------------------------------
  const busyThreshold = config.maxDailyMinutes * 0.5; // 50% of daily cap
  if (daySchedule.totalMinutes > busyThreshold) {
    score -= 15;
    reasons.push("Day is already busy");
  }

  return { score, reasons };
}

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const suggestionsRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Get Suggestions - Smart scheduling algorithm
  // ---------------------------------------------------------------------------
  getSuggestions: protectedProcedure
    .input(getSuggestionsSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, sessionTypeId, duration } = input;

      // -----------------------------------------------------------------------
      // Step 1: Fetch user preferences and merge with request config
      // -----------------------------------------------------------------------
      const userPrefs = await ctx.db.userPreferences.findUnique({
        where: { userId: ctx.user.id },
      });

      // Merge: defaults → user prefs → request overrides
      const config: SuggestionConfig = {
        maxDailyMinutes:
          input.config?.maxDailyMinutes ??
          userPrefs?.maxDailyMinutes ??
          DEFAULT_CONFIG.maxDailyMinutes,
        bufferMinutes:
          input.config?.bufferMinutes ??
          userPrefs?.bufferMinutes ??
          DEFAULT_CONFIG.bufferMinutes,
        preferMornings:
          input.config?.preferMornings ??
          userPrefs?.preferMornings ??
          DEFAULT_CONFIG.preferMornings,
        maxHighPriorityPerDay:
          input.config?.maxHighPriorityPerDay ??
          userPrefs?.maxHighPriorityPerDay ??
          DEFAULT_CONFIG.maxHighPriorityPerDay,
        timezone: input.config?.timezone ?? DEFAULT_CONFIG.timezone,
      };

      // -----------------------------------------------------------------------
      // Step 2: Normalize dates in user's timezone
      // -----------------------------------------------------------------------
      const normalizedStartDate = startOfDayInTimezone(startDate, config.timezone);
      const normalizedEndDate = startOfDayInTimezone(
        addMinutes(endDate, 24 * 60 - 1), // End of endDate
        config.timezone
      );

      // -----------------------------------------------------------------------
      // Step 3: Fetch user availability windows
      // -----------------------------------------------------------------------
      const availabilities = await ctx.db.availability.findMany({
        where: { userId: ctx.user.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });

      if (availabilities.length === 0) {
        return {
          suggestions: [],
          message: "No availability windows set. Please configure your availability.",
        };
      }

      // -----------------------------------------------------------------------
      // Step 4: Fetch existing scheduled sessions in range
      // -----------------------------------------------------------------------
      const existingSessions = await ctx.db.session.findMany({
        where: {
          userId: ctx.user.id,
          status: "SCHEDULED",
          startTime: { gte: normalizedStartDate },
          endTime: { lte: addMinutes(normalizedEndDate, 24 * 60) },
        },
        include: {
          sessionType: {
            select: { priority: true },
          },
        },
        orderBy: { startTime: "asc" },
      });

      // -----------------------------------------------------------------------
      // Step 5: Get session type priority and metadata (if specified)
      // -----------------------------------------------------------------------
      let priority = 3; // Default priority
      let sessionTypeMetadata: {
        id: string;
        name: string;
        priority: number;
        color: string | null;
        icon: string | null;
      } | null = null;

      if (sessionTypeId) {
        const sessionType = await ctx.db.sessionType.findFirst({
          where: { id: sessionTypeId, userId: ctx.user.id },
        });
        if (sessionType) {
          priority = sessionType.priority;
          sessionTypeMetadata = {
            id: sessionType.id,
            name: sessionType.name,
            priority: sessionType.priority,
            color: sessionType.color,
            icon: sessionType.icon,
          };
        }
      }

      // -----------------------------------------------------------------------
      // Step 6: Build day schedules for fatigue tracking
      // -----------------------------------------------------------------------
      const daySchedules = new Map<string, DaySchedule>();

      for (const session of existingSessions) {
        const dayKey = startOfDayInTimezone(session.startTime, config.timezone).toISOString();
        const existing = daySchedules.get(dayKey) ?? {
          date: startOfDayInTimezone(session.startTime, config.timezone),
          highPriorityCount: 0,
          totalMinutes: 0,
        };

        if (session.sessionType.priority >= 4) {
          existing.highPriorityCount++;
        }
        existing.totalMinutes += session.duration;
        daySchedules.set(dayKey, existing);
      }

      // -----------------------------------------------------------------------
      // Step 7: Generate candidate time slots from availability
      // -----------------------------------------------------------------------
      const candidates: TimeSlot[] = [];
      const currentDate = new Date(normalizedStartDate);

      while (currentDate <= normalizedEndDate) {
        const dayOfWeek = getDayOfWeekInTimezone(currentDate, config.timezone);

        // Find availability windows for this day of week
        const dayAvailabilities = availabilities.filter(
          (a: (typeof availabilities)[number]) => a.dayOfWeek === dayOfWeek
        );

        for (const avail of dayAvailabilities) {
          // Convert availability times to actual dates
          const availStart = new Date(currentDate);
          const [startHour, startMin] = avail.startTime.split(":").map(Number);
          availStart.setUTCHours(startHour ?? 0, startMin ?? 0, 0, 0);

          const availEnd = new Date(currentDate);
          const [endHour, endMin] = avail.endTime.split(":").map(Number);
          availEnd.setUTCHours(endHour ?? 0, endMin ?? 0, 0, 0);

          // Skip if availability window is too short for requested duration
          const availMinutes = (availEnd.getTime() - availStart.getTime()) / (60 * 1000);
          if (availMinutes < duration) continue;

          // Generate slots within this availability window
          let slotStart = new Date(availStart);

          while (addMinutes(slotStart, duration) <= availEnd) {
            const slotEnd = addMinutes(slotStart, duration);
            const now = new Date();

            // HARD FILTER: Skip if slot is in the past
            if (slotStart < now) {
              slotStart = addMinutes(slotStart, 30);
              continue;
            }

            // HARD FILTER: Check for conflicts with existing sessions (including buffer)
            const hasConflict = existingSessions.some(
              (session: (typeof existingSessions)[number]) =>
                overlaps(
                  addMinutes(slotStart, -config.bufferMinutes),
                  addMinutes(slotEnd, config.bufferMinutes),
                  session.startTime,
                  session.endTime
                )
            );

            if (hasConflict) {
              slotStart = addMinutes(slotStart, 30);
              continue;
            }

            // Get day schedule for scoring
            const dayKey = startOfDayInTimezone(slotStart, config.timezone).toISOString();
            const daySchedule = daySchedules.get(dayKey) ?? {
              date: startOfDayInTimezone(slotStart, config.timezone),
              highPriorityCount: 0,
              totalMinutes: 0,
            };

            // Score the slot using config-driven values
            const { score, reasons } = scoreSlot(
              { startTime: slotStart, endTime: slotEnd },
              priority,
              daySchedule,
              existingSessions,
              config
            );

            candidates.push({
              startTime: new Date(slotStart),
              endTime: new Date(slotEnd),
              score,
              reasons,
            });

            // Move to next potential slot (30-min increments)
            slotStart = addMinutes(slotStart, 30);
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // -----------------------------------------------------------------------
      // Step 8: Check if any feasible slots exist
      // -----------------------------------------------------------------------
      if (candidates.length === 0) {
        return {
          suggestions: [],
          message: "No available time slots found in the specified range.",
        };
      }

      // -----------------------------------------------------------------------
      // Step 9: Sort by score and return top suggestions
      // -----------------------------------------------------------------------
      const suggestions = candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SUGGESTIONS)
        .map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          score: slot.score,
          reasons: slot.reasons.length > 0 ? slot.reasons : ["Available slot"],
          sessionType: sessionTypeMetadata,
        }));

      return {
        suggestions,
        message: `Found ${suggestions.length} suggested time slots`,
      };
    }),
});
