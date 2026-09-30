import { getLessonChallenges, lessons } from '../data/lessons'
import { legacyLessons } from '../data/legacyProgress'
import { supportedModes, type ChallengeMode } from './pickMode'
import { allChallenges, challengeById, createRun, currentMode, evaluateAnswer, freshProgress, lessonFor,
  matchingPairs, unlockedIndex, type LessonRun, type Progress, type SessionItem } from './learningSession'
import { conceptKeys, concepts, isDay, type ReviewMetric } from './dailyLearning'

export const progressKey = 'r-lingo-progress-v3'
export const legacyKey = 'r-lingo-progress-v2'
const maxXp = (allChallenges.length + lessons.length) * 20
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function number(value: unknown, fallback: number, max = 1000000) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback
}
function strings(value: unknown, allowed: Set<string>) {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && allowed.has(id)))] : []
}
const questionIds = new Set(allChallenges.map((challenge) => challenge.id))
const lessonIds = new Set(lessons.map((lesson) => lesson.id))

function sanitizeRun(value: unknown, lessonId: string, completed: string[], finished: string[], scheduled = false): LessonRun {
  const raw = record(value)
  const allowed = new Set(getLessonChallenges(lessonFor(lessonId)).map((challenge) => challenge.id))
  const review = scheduled || raw.kind === 'review' && finished.includes(lessonId)
  const reviewIds = review ? strings(raw.reviewIds, allowed) : []
  const fallback = createRun(lessonId, completed, finished, review, scheduled ? reviewIds.slice(0, 5) : undefined)
  const queueAllowed = scheduled ? new Set(reviewIds.slice(0, 5)) : allowed
  const reviewedCorrect = review ? strings(raw.reviewedCorrect, allowed) : []
  fallback.queue = fallback.queue.filter((item) => !reviewedCorrect.includes(item.challengeId))
  const queue: SessionItem[] = []
  if (Array.isArray(raw.queue)) {
    for (const value of raw.queue) {
      const item = record(value)
      if (typeof item.challengeId !== 'string' || !queueAllowed.has(item.challengeId) || queue.some((entry) => entry.challengeId === item.challengeId)) continue
      const challenge = challengeById.get(item.challengeId)!
      const modes = supportedModes(challenge)
      const failedModes = Array.isArray(item.failedModes) ? item.failedModes.filter((mode): mode is ChallengeMode => modes.includes(mode as ChallengeMode)).slice(-20) : []
      queue.push({ challengeId: item.challengeId, attempts: number(item.attempts, 0), failedModes })
    }
  }
  const selected = typeof raw.selected === 'string' ? raw.selected.slice(0, 10000) : ''
  // A checked correct head is still present until Continue is pressed.
  const checkedHead = queue[0]?.challengeId
  const savedResult = record(raw.result)
  const answered = review ? reviewedCorrect : completed
  const headWasCorrect = savedResult.correct === true && answered.includes(checkedHead)
  const filtered = queue.filter((item, index) => !answered.includes(item.challengeId) || (index === 0 && headWasCorrect))
  for (const missing of fallback.queue) if (!filtered.some((entry) => entry.challengeId === missing.challengeId)) filtered.push(missing)
  const matchedLefts = strings(raw.matchedLefts, new Set(matchingPairs(lessonId).map((pair) => pair.left)))
  const phase = filtered.length ? 'practice' : (scheduled || matchedLefts.length === matchingPairs(lessonId).length || (!review && finished.includes(lessonId))) ? 'done' : 'match'
  const next: LessonRun = { ...fallback, queue: filtered, phase, selected, matchedLefts, reviewedCorrect,
    showTheory: typeof raw.showTheory === 'boolean' ? raw.showTheory : fallback.showTheory,
    theoryPageIndex: number(raw.theoryPageIndex, 0, 5), tokenIds: [] }
  if (typeof savedResult.correct === 'boolean' && filtered[0]?.challengeId === checkedHead && selected) next.result = evaluateAnswer(next)
  if (next.queue.length && currentMode(next) === 'tokens') {
    const tokens = challengeById.get(next.queue[0].challengeId)!.tokens!
    const pool = [...tokens.parts, ...tokens.distractors]
    next.tokenIds = Array.isArray(raw.tokenIds) ? [...new Set(raw.tokenIds.filter((id): id is number => Number.isInteger(id) && id >= 0 && id < pool.length))] : []
  }
  return next
}

export function sanitizeProgress(value: unknown): Progress {
  const raw = record(value)
  const completedCorrect = strings(raw.completedCorrect, questionIds)
  const requestedFinished = strings(raw.completedLessons, lessonIds)
  // Keep valid historical completions even if lessons are reordered. Unlocks
  // still stop at the first incomplete lesson in the current curriculum.
  const completedLessons: string[] = []
  for (const lesson of lessons) {
    if (requestedFinished.includes(lesson.id) && getLessonChallenges(lesson).every((question) => completedCorrect.includes(question.id))) completedLessons.push(lesson.id)
  }
  const index = typeof raw.lessonId === 'string' ? lessons.findIndex((lesson) => lesson.id === raw.lessonId) : 0
  const lessonId = lessons[Math.max(0, Math.min(index, unlockedIndex(completedLessons)))].id
  const sessions: Record<string, LessonRun> = {}
  const storedSessions = record(raw.sessions)
  for (const lesson of lessons.slice(0, unlockedIndex(completedLessons) + 1)) {
    if (storedSessions[lesson.id] !== undefined || lesson.id === lessonId) sessions[lesson.id] = sanitizeRun(storedSessions[lesson.id], lesson.id, completedCorrect, completedLessons)
  }
  const dailyHistory: Record<string, string[]> = {}
  for (const [day, ids] of Object.entries(record(raw.dailyHistory))) {
    if (isDay(day)) dailyHistory[day] = strings(ids, questionIds)
  }
  const reviewMetrics: Record<string, ReviewMetric> = {}
  for (const [key, value] of Object.entries(record(raw.reviewMetrics))) {
    const metric = record(value)
    if (!conceptKeys.has(key) || typeof metric.challengeId !== 'string' || concepts.get(metric.challengeId)?.key !== key) continue
    reviewMetrics[key] = { challengeId: metric.challengeId, failures: number(metric.failures, 0), successes: number(metric.successes, 0),
      intervalDays: [1, 3, 7, 14].includes(metric.intervalDays as number) ? metric.intervalDays as number : 1,
      dueDay: isDay(metric.dueDay) ? metric.dueDay : '1970-01-01', lastDay: isDay(metric.lastDay) ? metric.lastDay : '1970-01-01' }
  }
  const savedReview = record(raw.dailyReview)
  const reviewLessonId = typeof savedReview.lessonId === 'string' ? savedReview.lessonId : ''
  const reviewLessonIndex = lessons.findIndex((lesson) => lesson.id === reviewLessonId)
  const dailyReview = reviewLessonIndex >= 0 && reviewLessonIndex <= unlockedIndex(completedLessons)
    ? { lessonId: reviewLessonId, run: sanitizeRun(savedReview.run, reviewLessonId, completedCorrect, completedLessons, true) } : null
  return { version: 3, lessonId, completedCorrect, completedLessons, sessions,
    sound: typeof raw.sound === 'boolean' ? raw.sound : true,
    dailyGoal: [5, 10, 15].includes(raw.dailyGoal as number) ? raw.dailyGoal as number : 5,
    dailyHistory, reviewMetrics, dailyReview, reviewActive: raw.reviewActive === true && dailyReview !== null,
    xp: number(raw.xp, (completedCorrect.length + completedLessons.length) * 20, maxXp),
    streak: number(raw.streak, 0), hearts: number(raw.hearts, 5, 5) }
}

export function migrateV2(value: unknown): Progress {
  const raw = record(value)
  const completedCorrect = Array.isArray(raw.completedCorrect) ? raw.completedCorrect.flatMap((key) => {
    if (typeof key !== 'string' || !/^\d+-\d+$/.test(key)) return []
    const [lesson, question] = key.split('-').map(Number)
    const id = legacyLessons[lesson]?.ids[question]
    return id ? [id] : []
  }) : []
  const completedLessons = Array.isArray(raw.completedLessons)
    ? raw.completedLessons.flatMap((index) => typeof index === 'number' && Number.isInteger(index) && legacyLessons[index] ? [legacyLessons[index].id] : [])
    : legacyLessons.filter((lesson) => lesson.ids.every((id) => completedCorrect.includes(id))).map((lesson) => lesson.id)
  const progress = sanitizeProgress({ ...raw, completedCorrect, completedLessons,
    lessonId: legacyLessons[number(raw.lessonIndex, 0, legacyLessons.length - 1)]?.id })
  const run = progress.sessions[progress.lessonId]
  const legacyLesson = legacyLessons.find((lesson) => lesson.id === progress.lessonId)!
  const resumeId = legacyLesson.ids[number(raw.challengeIndex, 0, legacyLesson.ids.length - 1)]
  const resume = run.queue.find((item) => item.challengeId === resumeId)
  if (resume) run.queue = [resume, ...run.queue.filter((item) => item !== resume)]
  return progress
}

export function loadProgress(storage: () => StorageAccess): { progress: Progress; warning: string | null } {
  try {
    const access = storage()
    const current = access.getItem(progressKey)
    if (current) {
      const parsed = JSON.parse(current)
      if (record(parsed).version !== 3) return { progress: freshProgress(), warning: 'Este progreso pertenece a otra versión. Conserva una copia antes de guardar.' }
      return { progress: sanitizeProgress(parsed), warning: null }
    }
    const legacy = access.getItem(legacyKey)
    return { progress: legacy ? migrateV2(JSON.parse(legacy)) : freshProgress(), warning: null }
  } catch {
    return { progress: freshProgress(), warning: 'No se pudo leer el progreso guardado. Puedes practicar y exportar una copia de esta sesión.' }
  }
}
export function saveProgress(progress: Progress, storage: () => StorageAccess): string | null {
  try { storage().setItem(progressKey, JSON.stringify(progress)); return null }
  catch { return 'No se pudo guardar en este navegador. Puedes seguir practicando; exporta tu progreso antes de cerrar.' }
}
export function importProgress(text: string): Progress {
  const raw = record(JSON.parse(text))
  if (raw.version !== 3 || !lessonIds.has(raw.lessonId as string) || !Array.isArray(raw.completedCorrect)
    || !Array.isArray(raw.completedLessons) || !raw.sessions || typeof raw.sessions !== 'object' || Array.isArray(raw.sessions)
    || raw.completedCorrect.some((id) => !questionIds.has(id)) || raw.completedLessons.some((id) => !lessonIds.has(id))
    || typeof raw.xp !== 'number' || !Number.isInteger(raw.xp) || raw.xp < 0 || raw.xp > maxXp
    || typeof raw.hearts !== 'number' || !Number.isInteger(raw.hearts) || raw.hearts < 0 || raw.hearts > 5
    || typeof raw.streak !== 'number' || !Number.isInteger(raw.streak) || raw.streak < 0 || raw.streak > 1000000) {
    throw new Error('Archivo incompatible o inválido. El progreso actual no cambió.')
  }
  const next = sanitizeProgress(raw)
  if (next.completedLessons.length !== new Set(raw.completedLessons as string[]).size) throw new Error('Logros incompatibles. El progreso actual no cambió.')
  for (const [id, value] of Object.entries(record(raw.sessions))) {
    const run = record(value)
    if (!lessonIds.has(id) || !Array.isArray(run.queue) || !['learn', 'review'].includes(run.kind as string)
      || !['practice', 'match', 'done'].includes(run.phase as string) || typeof run.selected !== 'string'
      || run.queue.some((item) => {
        const entry = record(item)
        return !getLessonChallenges(lessonFor(id)).some((question) => question.id === entry.challengeId)
          || typeof entry.attempts !== 'number' || !Number.isInteger(entry.attempts) || entry.attempts < 0 || !Array.isArray(entry.failedModes)
      })) throw new Error('Sesión inválida. El progreso actual no cambió.')
  }
  return next
}
