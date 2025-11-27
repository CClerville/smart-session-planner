// =============================================================================
// STATS ROUTER
// =============================================================================
// Provides analytics and derived metrics for user's session history.
// =============================================================================

import { createTRPCRouter, protectedProcedure } from "../trpc.js";

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Calculate the difference in days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(date2.getTime() - date1.getTime()) / oneDay);
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
 * Calculate current streak of consecutive days with completed sessions
 */
function calculateStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  // Get unique days with completed sessions (sorted descending)
  const uniqueDays = [
    ...new Set(completedDates.map((d) => startOfDay(d).toISOString())),
  ]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDays.length === 0) return 0;

  // Check if today or yesterday has a completion (streak must be active)
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = uniqueDays[0];
  if (!mostRecent) return 0;

  const daysSinceLast = daysBetween(mostRecent, today);

  // Streak broken if more than 1 day since last completion
  if (daysSinceLast > 1) return 0;

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const current = uniqueDays[i];
    const previous = uniqueDays[i - 1];
    if (!current || !previous) break;

    const gap = daysBetween(current, previous);
    if (gap === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// -----------------------------------------------------------------------------
// Router Definition
// -----------------------------------------------------------------------------

export const statsRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Get Stats - Comprehensive session analytics
  // ---------------------------------------------------------------------------
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // -------------------------------------------------------------------------
    // Fetch all sessions for user
    // -------------------------------------------------------------------------
    const sessions = await ctx.db.session.findMany({
      where: { userId: ctx.user.id },
      include: {
        sessionType: {
          select: {
            id: true,
            name: true,
            color: true,
            priority: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // -------------------------------------------------------------------------
    // Basic counts
    // -------------------------------------------------------------------------
    const totalScheduled = sessions.filter((s: typeof sessions[number]) => s.status === "SCHEDULED").length;
    const totalCompleted = sessions.filter((s: typeof sessions[number]) => s.status === "COMPLETED").length;
    const totalCancelled = sessions.filter((s: typeof sessions[number]) => s.status === "CANCELLED").length;

    // -------------------------------------------------------------------------
    // Completion rate
    // -------------------------------------------------------------------------
    const totalFinished = totalCompleted + totalCancelled;
    const completionRate =
      totalFinished > 0 ? Math.round((totalCompleted / totalFinished) * 100) : 0;

    // -------------------------------------------------------------------------
    // Breakdown by session type
    // -------------------------------------------------------------------------
    const typeMap = new Map<
      string,
      {
        typeId: string;
        name: string;
        color: string | null;
        count: number;
        completed: number;
        totalMinutes: number;
      }
    >();

    for (const session of sessions) {
      const existing = typeMap.get(session.sessionTypeId) ?? {
        typeId: session.sessionTypeId,
        name: session.sessionType.name,
        color: session.sessionType.color,
        count: 0,
        completed: 0,
        totalMinutes: 0,
      };

      existing.count++;
      if (session.status === "COMPLETED") {
        existing.completed++;
        existing.totalMinutes += session.duration;
      }

      typeMap.set(session.sessionTypeId, existing);
    }

    const byType = Array.from(typeMap.values());

    // -------------------------------------------------------------------------
    // Current streak (consecutive days with completed sessions)
    // -------------------------------------------------------------------------
    const completedDates = sessions
      .filter((s: typeof sessions[number]) => s.status === "COMPLETED")
      .map((s: typeof sessions[number]) => s.startTime);

    const currentStreak = calculateStreak(completedDates);

    // -------------------------------------------------------------------------
    // Average sessions per week
    // -------------------------------------------------------------------------
    let avgSessionsPerWeek = 0;

    if (sessions.length > 0) {
      const firstSession = sessions[0];
      const lastSession = sessions[sessions.length - 1];

      if (firstSession && lastSession) {
        const daySpan = daysBetween(firstSession.startTime, new Date()) || 1;
        const weeks = Math.max(daySpan / 7, 1);
        avgSessionsPerWeek = Math.round((sessions.length / weeks) * 10) / 10;
      }
    }

    // -------------------------------------------------------------------------
    // Average gap between sessions (spacing metric)
    // -------------------------------------------------------------------------
    let avgGapDays = 0;

    const completedSessions = sessions
      .filter((s: typeof sessions[number]) => s.status === "COMPLETED")
      .sort((a: typeof sessions[number], b: typeof sessions[number]) => a.startTime.getTime() - b.startTime.getTime());

    if (completedSessions.length >= 2) {
      let totalGap = 0;
      let gapCount = 0;

      for (let i = 1; i < completedSessions.length; i++) {
        const current = completedSessions[i];
        const previous = completedSessions[i - 1];

        if (current && previous) {
          const gap = daysBetween(previous.startTime, current.startTime);
          totalGap += gap;
          gapCount++;
        }
      }

      if (gapCount > 0) {
        avgGapDays = Math.round((totalGap / gapCount) * 10) / 10;
      }
    }

    // -------------------------------------------------------------------------
    // Total time tracked (completed sessions only)
    // -------------------------------------------------------------------------
    const totalMinutesCompleted = completedSessions.reduce(
      (sum: number, s: typeof completedSessions[number]) => sum + s.duration,
      0
    );

    const totalHoursCompleted = Math.round((totalMinutesCompleted / 60) * 10) / 10;

    // -------------------------------------------------------------------------
    // This week's summary
    // -------------------------------------------------------------------------
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(
      (s: typeof sessions[number]) => s.startTime >= weekStart && s.startTime <= now
    );
    const thisWeekCompleted = thisWeekSessions.filter(
      (s: typeof sessions[number]) => s.status === "COMPLETED"
    ).length;
    const thisWeekScheduled = thisWeekSessions.filter(
      (s: typeof sessions[number]) => s.status === "SCHEDULED"
    ).length;

    return {
      // Basic counts
      totalScheduled,
      totalCompleted,
      totalCancelled,

      // Rates and averages
      completionRate,
      avgSessionsPerWeek,
      avgGapDays,

      // Time tracking
      totalHoursCompleted,

      // Streaks
      currentStreak,

      // Breakdown by type
      byType,

      // This week
      thisWeek: {
        completed: thisWeekCompleted,
        scheduled: thisWeekScheduled,
        total: thisWeekSessions.length,
      },
    };
  }),
});

