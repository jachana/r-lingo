import { getLessonChallenges, lessons, type Challenge } from '../data/lessons'
import { checkTypedAnswer, type CheckResult } from './checkAnswer'
import { pickMode, type ChallengeMode } from './pickMode'
import { seededShuffle } from './shuffle'
import { dueReview, isDay, recordAttempt, type ReviewMetric, concepts } from './dailyLearning'

export type SessionItem = { challengeId: string; attempts: number; failedModes: ChallengeMode[] }
export type LessonRun = {
  kind: 'learn' | 'review'
  source: 'lesson' | 'scheduled'
  phase: 'practice' | 'match' | 'done'
  queue: SessionItem[]
  selected: string
  result: CheckResult | null
  tokenIds: number[]
  reviewedCorrect: string[]
  reviewIds: string[]
  matchedLefts: string[]
  showTheory: boolean
  theoryPageIndex: number
}
export type Progress = {
  version: 3
  lessonId: string
  completedCorrect: string[]
  completedLessons: string[]
  xp: number
  streak: number
  hearts: number
  sound: boolean
  dailyGoal: number
  dailyHistory: Record<string, string[]>
  reviewMetrics: Record<string, ReviewMetric>
  reviewActive: boolean
  dailyReview: { lessonId: string; run: LessonRun } | null
  sessions: Record<string, LessonRun>
}

export const allChallenges = lessons.flatMap(getLessonChallenges)
export const challengeById = new Map(allChallenges.map((challenge) => [challenge.id, challenge]))
export function lessonFor(id: string) { return lessons.find((lesson) => lesson.id === id)! }
export function matchingPairs(lessonId: string) {
  return seededShuffle(lessonFor(lessonId).matchPairs, `match-${lessonId}`).slice(0, 4)
}
export function unlockedIndex(completed: string[]) {
  const index = lessons.findIndex((lesson) => !completed.includes(lesson.id))
  return index < 0 ? lessons.length - 1 : index
}
export function createRun(lessonId: string, completed: string[], finished: string[], review = false, reviewIds?: string[]): LessonRun {
  const queue = getLessonChallenges(lessonFor(lessonId))
    .filter((challenge) => review ? !reviewIds || reviewIds.includes(challenge.id) : !completed.includes(challenge.id))
    .map((challenge) => ({ challengeId: challenge.id, attempts: 0, failedModes: [] }))
  return {
    kind: review ? 'review' : 'learn', source: reviewIds ? 'scheduled' : 'lesson',
    phase: queue.length ? 'practice' : finished.includes(lessonId) ? 'done' : 'match',
    queue, selected: '', result: null, tokenIds: [], reviewedCorrect: [], reviewIds: review ? queue.map((item) => item.challengeId) : [],
    matchedLefts: [], showTheory: !review, theoryPageIndex: 0,
  }
}
export function freshProgress(): Progress {
  const lessonId = lessons[0].id
  return { version: 3, lessonId, completedCorrect: [], completedLessons: [], xp: 0, streak: 0, hearts: 5, sound: true,
    dailyGoal: 5, dailyHistory: {}, reviewMetrics: {}, reviewActive: false, dailyReview: null,
    sessions: { [lessonId]: createRun(lessonId, [], []) } }
}
export function activeLessonId(state: Progress) { return state.reviewActive && state.dailyReview ? state.dailyReview.lessonId : state.lessonId }
export function activeRun(state: Progress) { return state.reviewActive && state.dailyReview ? state.dailyReview.run : state.sessions[state.lessonId] }
export function currentMode(run: LessonRun): ChallengeMode {
  const item = run.queue[0]
  return item ? pickMode(challengeById.get(item.challengeId)!, `${item.challengeId}-a${item.attempts}`, item.failedModes.at(-1)) : 'choice'
}
export function expectedAnswers(challenge: Challenge, mode: ChallengeMode) {
  return mode === 'gap' && challenge.gap
    ? [challenge.gap.blank, ...(challenge.gap.acceptedBlanks ?? [])]
    : [challenge.answer, ...(challenge.acceptedAnswers ?? [])]
}
export function evaluateAnswer(run: LessonRun): CheckResult {
  const challenge = challengeById.get(run.queue[0]?.challengeId)
  if (!challenge) return { correct: false }
  const mode = currentMode(run)
  return mode === 'choice' ? { correct: run.selected === challenge.answer }
    : checkTypedAnswer(run.selected, expectedAnswers(challenge, mode), mode === 'gap' ? 'exact' : challenge.validation ?? 'exact')
}
export type SessionAction =
  | { type: 'select'; value: string; tokenIds?: number[] }
  | { type: 'check'; day: string } | { type: 'continue' }
  | { type: 'navigate'; lessonId: string }
  | { type: 'theory'; visible: boolean; page?: number }
  | { type: 'theoryPage'; page: number }
  | { type: 'match'; left: string; right: string }
  | { type: 'reset' } | { type: 'replay' } | { type: 'replace'; progress: Progress }
  | { type: 'sound'; enabled: boolean }
  | { type: 'dailyGoal'; target: number } | { type: 'startReview'; day: string } | { type: 'returnToCourse' }

export function transition(state: Progress, action: SessionAction): Progress {
  if (action.type === 'reset') return { ...freshProgress(), sound: state.sound, dailyGoal: state.dailyGoal }
  if (action.type === 'replace') return action.progress
  if (action.type === 'sound') return { ...state, sound: action.enabled }
  if (action.type === 'dailyGoal') return [5, 10, 15].includes(action.target) ? { ...state, dailyGoal: action.target } : state
  if (action.type === 'returnToCourse') return { ...state, reviewActive: false }
  if (action.type === 'startReview') {
    if (!isDay(action.day)) return state
    if (state.dailyReview && state.dailyReview.run.phase !== 'done') return { ...state, reviewActive: true }
    const eligible = dueReview(state.reviewMetrics, action.day, lessons.slice(0, unlockedIndex(state.completedLessons) + 1).map((lesson) => lesson.id))
    if (!eligible.length) return state
    const lessonId = concepts.get(eligible[0][1].challengeId)!.lessonId
    const ids = eligible.filter(([, metric]) => concepts.get(metric.challengeId)!.lessonId === lessonId).slice(0, 5).map(([, metric]) => metric.challengeId)
    return { ...state, reviewActive: true, dailyReview: { lessonId, run: createRun(lessonId, state.completedCorrect, state.completedLessons, true, ids) } }
  }
  const run = activeRun(state)
  const lessonId = activeLessonId(state)
  const update = (nextRun: LessonRun, next: Partial<Progress> = {}): Progress => state.reviewActive
    ? { ...state, ...next, dailyReview: { lessonId, run: nextRun } }
    : { ...state, ...next, sessions: { ...state.sessions, [state.lessonId]: nextRun } }
  switch (action.type) {
    case 'select':
      return run.result || run.phase !== 'practice' ? state : update({ ...run, selected: action.value, tokenIds: action.tokenIds ?? [] })
    case 'check': {
      if (run.result || run.phase !== 'practice' || !run.queue.length || !run.selected.trim() || !isDay(action.day)) return state
      const result = evaluateAnswer(run)
      const id = run.queue[0].challengeId
      const earned = result.correct && run.kind === 'learn' && !state.completedCorrect.includes(id)
      return update({ ...run, result, reviewedCorrect: result.correct && run.kind === 'review'
        ? [...new Set([...run.reviewedCorrect, id])] : run.reviewedCorrect }, {
        completedCorrect: earned ? [...state.completedCorrect, id] : state.completedCorrect,
        xp: state.xp + (earned ? 20 : 0),
        streak: result.correct ? Math.min(state.streak + 1, 1000000) : 0,
        hearts: result.correct ? state.hearts : Math.max(0, state.hearts - 1),
        dailyHistory: result.correct ? { ...state.dailyHistory, [action.day]: [...new Set([...(state.dailyHistory[action.day] ?? []), id])] } : state.dailyHistory,
        reviewMetrics: recordAttempt(state.reviewMetrics, id, result.correct, action.day, run.kind === 'review'),
      })
    }
    case 'continue': {
      if (!run.result || !run.queue.length) return state
      const [head, ...tail] = run.queue
      const queue = run.result.correct ? tail : [...tail, { ...head, attempts: head.attempts + 1,
        failedModes: [...head.failedModes, currentMode(run)].slice(-20) }]
      return update({ ...run, queue, phase: queue.length ? 'practice' : run.source === 'scheduled' ? 'done' : 'match', selected: '', result: null, tokenIds: [] })
    }
    case 'navigate': {
      const index = lessons.findIndex((lesson) => lesson.id === action.lessonId)
      if (index < 0 || index > unlockedIndex(state.completedLessons)) return state
      return { ...state, lessonId: action.lessonId, reviewActive: false, sessions: { ...state.sessions,
        [action.lessonId]: state.sessions[action.lessonId] ?? createRun(action.lessonId, state.completedCorrect, state.completedLessons) } }
    }
    case 'theory': return update({ ...run, showTheory: action.visible, theoryPageIndex: action.page ?? run.theoryPageIndex })
    case 'theoryPage': return update({ ...run, theoryPageIndex: Math.min(5, Math.max(0, action.page)) })
    case 'match': {
      if (run.phase !== 'match' || run.matchedLefts.includes(action.left)) return state
      const pairs = matchingPairs(lessonId)
      if (!pairs.some((pair) => pair.left === action.left && pair.right === action.right)) return state
      const matchedLefts = [...run.matchedLefts, action.left]
      const done = matchedLefts.length === pairs.length
      const earned = done && run.kind === 'learn' && !state.completedLessons.includes(lessonId)
      return update({ ...run, matchedLefts, phase: done ? 'done' : 'match' }, {
        completedLessons: earned ? [...state.completedLessons, lessonId] : state.completedLessons,
        xp: state.xp + (earned ? 20 : 0),
      })
    }
    case 'replay': return !state.reviewActive && state.completedLessons.includes(lessonId)
      ? update(createRun(lessonId, state.completedCorrect, state.completedLessons, true)) : state
  }
}
