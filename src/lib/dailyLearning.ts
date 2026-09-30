import { getLessonChallenges, lessons } from '../data/lessons'

export type ReviewMetric = { challengeId: string; failures: number; successes: number; intervalDays: number; dueDay: string; lastDay: string }
export const concepts = new Map(lessons.flatMap((lesson) => getLessonChallenges(lesson).map((challenge) =>
  [challenge.id, { key: `${lesson.id}:${challenge.concept}`, lessonId: lesson.id, label: challenge.concept }] as const)))
export const conceptKeys: Set<string> = new Set([...concepts.values()].map((concept) => concept.key))

export function localDay(now: Date, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)!.value).join('-')
}
export function isDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function addDays(day: string, count: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}
export function dayStreak(history: Record<string, string[]>, today: string) {
  let day = history[today]?.length ? today : addDays(today, -1)
  let streak = 0
  while (history[day]?.length) { streak += 1; day = addDays(day, -1) }
  return streak
}
export function recordAttempt(metrics: Record<string, ReviewMetric>, challengeId: string, correct: boolean, day: string, reviewing: boolean) {
  const key = concepts.get(challengeId)!.key
  const previous = metrics[key]
  const intervalDays = !correct ? 1 : reviewing && previous?.lastDay !== day
    ? Math.min(14, previous?.intervalDays === 1 ? 3 : previous?.intervalDays === 3 ? 7 : 14) : previous?.intervalDays ?? 1
  return { ...metrics, [key]: { challengeId: !correct || !previous ? challengeId : previous.challengeId,
    failures: (previous?.failures ?? 0) + (correct ? 0 : 1), successes: (previous?.successes ?? 0) + (correct ? 1 : 0),
    intervalDays, dueDay: addDays(day, intervalDays), lastDay: day } }
}
export function dueReview(metrics: Record<string, ReviewMetric>, day: string, unlockedLessonIds: string[]) {
  return Object.entries(metrics).filter(([, metric]) => metric.dueDay <= day && unlockedLessonIds.includes(concepts.get(metric.challengeId)!.lessonId))
    .sort(([, a], [, b]) => a.dueDay.localeCompare(b.dueDay) || b.failures - a.failures)
}
