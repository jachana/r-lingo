import { describe, expect, it } from 'vitest'
import { activeRun, challengeById, currentMode, freshProgress, transition, type Progress } from './learningSession'
import { addDays, concepts, dayStreak, dueReview, isDay, localDay, recordAttempt } from './dailyLearning'
import { sanitizeProgress } from './progressStorage'

function check(state: Progress, day: string, correct = true) {
  const run = activeRun(state)
  const challenge = challengeById.get(run.queue[0].challengeId)!
  const value = correct ? currentMode(run) === 'gap' ? challenge.gap!.blank : challenge.answer : 'wrong'
  return transition(transition(state, { type: 'select', value }), { type: 'check', day })
}

describe('calendar learning goals', () => {
  it('uses the learner timezone and preserves real calendar boundaries', () => {
    const instant = new Date('2026-09-30T02:30:00Z')
    expect(localDay(instant, 'America/Santiago')).toBe('2026-09-29')
    expect(localDay(instant, 'Europe/Madrid')).toBe('2026-09-30')
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(isDay('2026-02-30')).toBe(false)
  })
  it('keeps yesterday’s streak until today ends, then breaks after a missed day', () => {
    const history = { '2026-09-28': ['a'], '2026-09-29': ['b'] }
    expect(dayStreak(history, '2026-09-30')).toBe(2)
    expect(dayStreak(history, '2026-10-01')).toBe(0)
    expect(dayStreak({ ...history, '2026-09-30': ['c'] }, '2026-09-30')).toBe(3)
  })
  it('counts each correct exercise once per day without changing the course reward rules', () => {
    let state = freshProgress()
    state = check(state, '2026-09-30')
    const id = activeRun(state).queue[0].challengeId
    expect(state.dailyHistory['2026-09-30']).toEqual([id])
    expect(transition(state, { type: 'check', day: '2026-09-30' })).toEqual(state)
    expect(state.xp).toBe(20)
    state = transition(state, { type: 'dailyGoal', target: 10 })
    expect(state.dailyGoal).toBe(10)
    expect(transition(state, { type: 'dailyGoal', target: -1 })).toEqual(state)
    expect(sanitizeProgress(state)).toEqual(state)
    expect(state.dailyHistory['2026-10-01']).toBeUndefined()
  })
})

describe('scheduled concept review', () => {
  it('schedules mistakes for the next day and expands intervals only on later review days', () => {
    const id = [...challengeById.keys()][0]
    const key = concepts.get(id)!.key
    let metrics = recordAttempt({}, id, false, '2026-09-30', false)
    expect(metrics[key].dueDay).toBe('2026-10-01')
    expect(dueReview(metrics, '2026-09-30', ['r-basics'])).toEqual([])
    expect(dueReview(metrics, '2026-10-01', ['r-basics'])).toHaveLength(1)
    metrics = recordAttempt(metrics, id, true, '2026-10-01', true)
    expect(metrics[key].intervalDays).toBe(3)
    expect(metrics[key].dueDay).toBe('2026-10-04')
    metrics = recordAttempt(metrics, id, true, '2026-10-01', true)
    expect(metrics[key].intervalDays).toBe(3)
    metrics = recordAttempt(metrics, id, true, '2026-10-04', true)
    expect(metrics[key].intervalDays).toBe(7)
    metrics = recordAttempt(metrics, id, true, '2026-10-11', true)
    expect(metrics[key].intervalDays).toBe(14)
    metrics = recordAttempt(metrics, id, false, '2026-10-25', true)
    expect(metrics[key].intervalDays).toBe(1)
  })
  it('resumes a scheduled review while preserving the interrupted course and XP', () => {
    let state = check(freshProgress(), '2026-09-30', false)
    const original = state.sessions[state.lessonId]
    state = transition(state, { type: 'startReview', day: '2026-10-01' })
    expect(state.reviewActive).toBe(true)
    expect(activeRun(state).queue).toHaveLength(1)
    state = check(state, '2026-10-01', false)
    state = sanitizeProgress(JSON.parse(JSON.stringify(state)))
    expect(activeRun(state).result?.correct).toBe(false)
    state = transition(state, { type: 'continue' })
    expect(activeRun(state).queue[0].attempts).toBe(1)
    state = check(state, '2026-10-01')
    state = transition(state, { type: 'continue' })
    expect(activeRun(state).phase).toBe('done')
    expect(sanitizeProgress(state)).toEqual(state)
    expect(state.sessions[state.lessonId]).toEqual(original)
    expect(state.xp).toBe(0)
    expect(state.completedCorrect).toEqual([])
    state = transition(state, { type: 'returnToCourse' })
    expect(activeRun(state)).toEqual(original)
  })
  it('caps a session at five concepts and keeps its remaining queue on reload', () => {
    let state = freshProgress()
    for (const id of state.sessions[state.lessonId].queue.map((item) => item.challengeId)) {
      state.reviewMetrics = recordAttempt(state.reviewMetrics, id, false, '2026-09-30', false)
    }
    state = transition(state, { type: 'startReview', day: '2026-10-01' })
    const total = Math.min(5, Object.keys(state.reviewMetrics).length)
    expect(activeRun(state).queue).toHaveLength(total)
    expect(total).toBeLessThanOrEqual(5)
    state = transition(check(state, '2026-10-01'), { type: 'continue' })
    expect(activeRun(sanitizeProgress(state)).queue).toHaveLength(total - 1)
    expect(state.xp).toBe(0)
  })
})
