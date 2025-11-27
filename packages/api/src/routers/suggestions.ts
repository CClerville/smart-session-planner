// =============================================================================
// SUGGESTIONS ROUTER
// =============================================================================
// Smart scheduling algorithm that suggests optimal time slots based on:
// - User availability windows
// - Existing scheduled sessions
// - Session type priority
// - Fatigue/spacing heuristics
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

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Minimum gap between sessions (minutes) */
const MIN_GAP_MINUTES = 30;

/** Maximum high-priority (4-5) sessions per day */
const MAX_HIGH_PRIORITY_PER_DAY = 2;

/** Morning hours considered optimal for high-priority (24h format) */
const MORNING_START = 6;
const MORNING_END = 12;

/** Maximum suggestions to return */
const MAX_SUGGESTIONS = 10;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Parse HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get start of day for a date
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get day of week (0 = Sunday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
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
 */
function scoreSlot(
  slot: { startTime: Date; endTime: Date },
  priority: number,
  daySchedule: DaySchedule,
  existingSessions: { startTime: Date; endTime: Date }[]
): { score: number; reasons: string[] } {
  let score = 100; // Start with base score
  const reasons: string[] = [];

  const hour = slot.startTime.getHours();

  // ---------------------------------------------------------------------------
  // Priority-based morning preference
  // ---------------------------------------------------------------------------
  // High-priority sessions (4-5) get bonus for morning slots
  if (priority >= 4 && hour >= MORNING_START && hour < MORNING_END) {
    score += 20;
    reasons.push("Morning slot (optimal for high priority)");
  }

  // ---------------------------------------------------------------------------
  // Fatigue heuristic: Penalize clustering high-priority sessions
  // ---------------------------------------------------------------------------
  if (priority >= 4 && daySchedule.highPriorityCount >= MAX_HIGH_PRIORITY_PER_DAY) {
    score -= 40;
    reasons.push("Day already has high-priority sessions");
  }

  // ---------------------------------------------------------------------------
  // Spacing heuristic: Prefer slots with gaps from other sessions
  // ---------------------------------------------------------------------------
  const slotStart = slot.startTime.getTime();
  const slotEnd = slot.endTime.getTime();

  for (const session of existingSessions) {
    const sessionStart = session.startTime.getTime();
    const sessionEnd = session.endTime.getTime();

    // Calculate gap in minutes
    const gapBefore = (slotStart - sessionEnd) / (60 * 1000);
    const gapAfter = (sessionStart - slotEnd) / (60 * 1000);

    // Penalize slots too close to existing sessions
    if (gapBefore > 0 && gapBefore < 60) {
      score -= 10;
      reasons.push("Close to previous session");
    }
    if (gapAfter > 0 && gapAfter < 60) {
      score -= 10;
      reasons.push("Close to next session");
    }
  }

  // ---------------------------------------------------------------------------
  // Balance heuristic: Slightly penalize days with heavy schedules
  // ---------------------------------------------------------------------------
  if (daySchedule.totalMinutes > 240) {
    // More than 4 hours scheduled
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
      // Step 1: Fetch user availability windows
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
      // Step 2: Fetch existing scheduled sessions in range
      // -----------------------------------------------------------------------
      const existingSessions = await ctx.db.session.findMany({
        where: {
          userId: ctx.user.id,
          status: "SCHEDULED",
          startTime: { gte: startDate },
          endTime: { lte: addMinutes(endDate, 24 * 60) }, // Include full end date
        },
        include: {
          sessionType: {
            select: { priority: true },
          },
        },
        orderBy: { startTime: "asc" },
      });

      // -----------------------------------------------------------------------
      // Step 3: Get session type priority (if specified)
      // -----------------------------------------------------------------------
      let priority = 3; // Default priority
      if (sessionTypeId) {
        const sessionType = await ctx.db.sessionType.findFirst({
          where: { id: sessionTypeId, userId: ctx.user.id },
        });
        if (sessionType) {
          priority = sessionType.priority;
        }
      }

      // -----------------------------------------------------------------------
      // Step 4: Build day schedules for fatigue tracking
      // -----------------------------------------------------------------------
      const daySchedules = new Map<string, DaySchedule>();

      for (const session of existingSessions) {
        const dayKey = startOfDay(session.startTime).toISOString();
        const existing = daySchedules.get(dayKey) ?? {
          date: startOfDay(session.startTime),
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
      // Step 5: Generate candidate time slots from availability
      // -----------------------------------------------------------------------
      const candidates: TimeSlot[] = [];
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= endDate) {
        const dayOfWeek = getDayOfWeek(currentDate);

        // Find availability windows for this day of week
        const dayAvailabilities = availabilities.filter(
          (a: typeof availabilities[number]) => a.dayOfWeek === dayOfWeek
        );

        for (const avail of dayAvailabilities) {
          // Convert availability times to actual dates
          const availStart = new Date(currentDate);
          const [startHour, startMin] = avail.startTime.split(":").map(Number);
          availStart.setHours(startHour ?? 0, startMin ?? 0, 0, 0);

          const availEnd = new Date(currentDate);
          const [endHour, endMin] = avail.endTime.split(":").map(Number);
          availEnd.setHours(endHour ?? 0, endMin ?? 0, 0, 0);

          // Skip if availability window is too short for requested duration
          const availMinutes = (availEnd.getTime() - availStart.getTime()) / (60 * 1000);
          if (availMinutes < duration) continue;

          // Generate slots within this availability window
          let slotStart = new Date(availStart);

          while (addMinutes(slotStart, duration) <= availEnd) {
            const slotEnd = addMinutes(slotStart, duration);

            // Skip if slot is in the past
            if (slotStart < new Date()) {
              slotStart = addMinutes(slotStart, 30); // Move in 30-min increments
              continue;
            }

            // Check for conflicts with existing sessions (including buffer)
            const hasConflict = existingSessions.some((session: typeof existingSessions[number]) =>
              overlaps(
                addMinutes(slotStart, -MIN_GAP_MINUTES),
                addMinutes(slotEnd, MIN_GAP_MINUTES),
                session.startTime,
                session.endTime
              )
            );

            if (!hasConflict) {
              // Get day schedule for scoring
              const dayKey = startOfDay(slotStart).toISOString();
              const daySchedule = daySchedules.get(dayKey) ?? {
                date: startOfDay(slotStart),
                highPriorityCount: 0,
                totalMinutes: 0,
              };

              // Score the slot
              const { score, reasons } = scoreSlot(
                { startTime: slotStart, endTime: slotEnd },
                priority,
                daySchedule,
                existingSessions
              );

              candidates.push({
                startTime: new Date(slotStart),
                endTime: new Date(slotEnd),
                score,
                reasons,
              });
            }

            // Move to next potential slot (30-min increments)
            slotStart = addMinutes(slotStart, 30);
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // -----------------------------------------------------------------------
      // Step 6: Sort by score and return top suggestions
      // -----------------------------------------------------------------------
      const suggestions = candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SUGGESTIONS)
        .map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          score: slot.score,
          reasons: slot.reasons.length > 0 ? slot.reasons : ["Available slot"],
        }));

      return {
        suggestions,
        message:
          suggestions.length > 0
            ? `Found ${suggestions.length} suggested time slots`
            : "No available time slots found in the specified range",
      };
    }),
});

