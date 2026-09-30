import { describe, expect, it } from 'vitest'
import { getLessonChallenges, lessons } from '../data/lessons'
import { legacyLessons } from '../data/legacyProgress'
import { currentMode, freshProgress, matchingPairs, transition, type Progress } from './learningSession'
import { importProgress, legacyKey, loadProgress, migrateV2, progressKey, sanitizeProgress, saveProgress } from './progressStorage'

function answer(state: Progress, value?: string) {
  const run = state.sessions[state.lessonId]
  const question = getLessonChallenges(lessons.find((lesson) => lesson.id === state.lessonId)!).find((question) => question.id === run.queue[0].challengeId)!
  const selected = value ?? (currentMode(run) === 'gap' ? question.gap!.blank : question.answer)
  return transition(transition(state, { type: 'select', value: selected }), { type: 'check', day: '2026-09-30' })
}
function completeUnit(state: Progress) {
  let steps = 0
  while (state.sessions[state.lessonId].queue.length) {
    if (++steps > 50) throw new Error('Session did not advance: ' + JSON.stringify(state.sessions[state.lessonId]))
    state = transition(answer(state), { type: 'continue' })
  }
  for (const pair of matchingPairs(state.lessonId)) state = transition(state, { type: 'match', ...pair })
  return state
}
function memoryStorage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

describe('persistent learning sessions', () => {
  it('keeps the same failed head and checked feedback across reload without charging twice', () => {
    const failed = answer(freshProgress(), 'wrong')
    const restored = sanitizeProgress(JSON.parse(JSON.stringify(failed)))
    expect(restored).toEqual(failed)
    expect(transition(restored, { type: 'check', day: '2026-09-30' })).toEqual(restored)
    const next = transition(restored, { type: 'continue' })
    const failedItem = next.sessions[next.lessonId].queue.at(-1)!
    expect(failedItem.attempts).toBe(1)
    expect(failedItem.failedModes).toEqual([currentMode(failed.sessions[failed.lessonId])])
    expect(sanitizeProgress(next)).toEqual(next)
  })
  it('keeps a checked correct head until Continue and never awards duplicate XP', () => {
    const correct = answer(freshProgress())
    expect(correct.xp).toBe(20)
    const restored = sanitizeProgress(correct)
    expect(restored).toEqual(correct)
    expect(transition(restored, { type: 'check', day: '2026-09-30' }).xp).toBe(20)
    expect(transition(restored, { type: 'continue' }).sessions[restored.lessonId].queue).toHaveLength(11)
  })
  it('preserves partial matching then awards exactly one completion reward', () => {
    let state = freshProgress()
    while (state.sessions[state.lessonId].queue.length) state = transition(answer(state), { type: 'continue' })
    const [first, ...rest] = matchingPairs(state.lessonId)
    state = transition(state, { type: 'match', ...first })
    state = sanitizeProgress(state)
    expect(state.sessions[state.lessonId].matchedLefts).toEqual([first.left])
    for (const pair of rest) state = transition(state, { type: 'match', ...pair })
    expect(state.xp).toBe(260)
    expect(state.completedLessons).toEqual([lessons[0].id])
    expect(state.sessions[state.lessonId].phase).toBe('done')
    expect(transition(state, { type: 'match', ...rest.at(-1)! })).toEqual(state)
    expect(sanitizeProgress(state)).toEqual(state)
  })
  it('does not unlock a unit without matching or accept a forged match', () => {
    const state = freshProgress()
    expect(transition(state, { type: 'navigate', lessonId: lessons[1].id })).toEqual(state)
    expect(transition(state, { type: 'match', left: '<-', right: 'wrong' })).toEqual(state)
  })
  it('replays every unit without awarding completion XP or altering history', () => {
    let state = freshProgress()
    for (const lesson of lessons) {
      state = transition(state, { type: 'navigate', lessonId: lesson.id })
      state = completeUnit(state)
    }
    expect(state.xp).toBe(2340)
    const achievements = state.completedCorrect
    for (const lesson of lessons) {
      state = transition(state, { type: 'navigate', lessonId: lesson.id })
      state = transition(state, { type: 'replay' })
      state = transition(answer(state), { type: 'continue' })
      state = sanitizeProgress(state)
      expect(state.sessions[lesson.id].queue).toHaveLength(11)
      state = completeUnit(state)
      expect(sanitizeProgress(state)).toEqual(state)
      expect(state.xp).toBe(2340)
      expect(state.completedCorrect).toEqual(achievements)
      expect(state.completedLessons).toHaveLength(9)
    }
  })
  it('keeps interrupted sessions when navigating away and back', () => {
    let state = completeUnit(freshProgress())
    state = transition(state, { type: 'replay' })
    state = transition(answer(state, 'wrong'), { type: 'continue' })
    const replay = state.sessions[state.lessonId]
    state = transition(state, { type: 'navigate', lessonId: lessons[1].id })
    state = sanitizeProgress(state)
    state = transition(state, { type: 'navigate', lessonId: lessons[0].id })
    expect(state.sessions[state.lessonId]).toEqual(replay)
  })
  it('preserves stable question identity when authored questions are reordered', () => {
    const state = answer(freshProgress(), 'wrong')
    const original = lessons[0].challenges
    try {
      lessons[0].challenges = [...original].reverse()
      const restored = sanitizeProgress(state)
      expect(restored.sessions[state.lessonId].queue[0].challengeId).toBe(state.sessions[state.lessonId].queue[0].challengeId)
      expect(restored.sessions[state.lessonId].result).toEqual(state.sessions[state.lessonId].result)
    } finally { lessons[0].challenges = original }
  })
})

describe('progress storage and migration', () => {
  it('migrates frozen positional completions and resumes the requested legacy question', () => {
    const completedCorrect = legacyLessons[0].ids.map((_, index) => `0-${index}`)
    const migrated = migrateV2({ lessonIndex: 1, challengeIndex: 3, completedCorrect: [...completedCorrect, '0-0', 'unknown'],
      completedLessons: [0, 0], xp: 260, hearts: 4, streak: 2 })
    expect(migrated.completedCorrect).toEqual([...legacyLessons[0].ids])
    expect(migrated.completedLessons).toEqual([lessons[0].id])
    expect(migrated.lessonId).toBe(lessons[1].id)
    expect(migrated.sessions[migrated.lessonId].queue[0].challengeId).toBe(legacyLessons[1].ids[3])
    expect(migrated.xp).toBe(260)
    expect(sanitizeProgress(migrated)).toEqual(migrated)
  })
  it('leaves legacy data intact and loads the new snapshot on repeated migration', () => {
    const storage = memoryStorage()
    const old = JSON.stringify({ completedCorrect: ['0-0'], xp: 20 })
    storage.setItem(legacyKey, old)
    const first = loadProgress(() => storage).progress
    expect(saveProgress(first, () => storage)).toBeNull()
    expect(storage.getItem(legacyKey)).toBe(old)
    expect(loadProgress(() => storage).progress).toEqual(first)
    expect(storage.getItem(progressKey)).not.toBeNull()
  })
  it('bounds invalid numbers, filters invalid and duplicate IDs, and rejects impossible unlocks', () => {
    const restored = sanitizeProgress({ lessonId: lessons[8].id, xp: Infinity, hearts: -10, streak: 'bad',
      completedCorrect: [lessons[0].challenges[0].id, lessons[0].challenges[0].id, 'unknown', 12],
      completedLessons: [lessons[0].id, lessons[8].id], sessions: { 'r-basics': { queue: [null, { challengeId: 'bad' }] } } })
    expect(restored.completedCorrect).toHaveLength(1)
    expect(restored.completedLessons).toEqual([])
    expect(restored.lessonId).toBe(lessons[0].id)
    expect(restored.hearts).toBe(0)
    expect(restored.streak).toBe(0)
    expect(restored.xp).toBe(20)
    expect(restored.sessions[restored.lessonId].queue).toHaveLength(11)
  })
  it.each(['null', '[1,2]', '{', '"text"'])('recovers from malformed saves: %s', (stored) => {
    const storage = memoryStorage()
    storage.setItem(progressKey, stored)
    const loaded = loadProgress(() => storage)
    expect(loaded.progress).toEqual(freshProgress())
    expect(loaded.warning).not.toBeNull()
  })
  it('continues in memory when storage access or writes are denied', () => {
    const denied = () => { throw new Error('denied') }
    const loaded = loadProgress(denied)
    expect(loaded.warning).not.toBeNull()
    const state = answer(loaded.progress)
    expect(state.xp).toBe(20)
    expect(saveProgress(state, denied)).toContain('No se pudo guardar')
  })
  it('round-trips exports and rejects malformed/incompatible imports', () => {
    const state = answer(freshProgress(), 'wrong')
    expect(importProgress(JSON.stringify(state))).toEqual(state)
    for (const text of ['{', '{}', JSON.stringify({ ...state, version: 7 }), JSON.stringify({ ...state, completedCorrect: ['unknown'] })]) {
      expect(() => importProgress(text)).toThrow()
    }
  })
})
