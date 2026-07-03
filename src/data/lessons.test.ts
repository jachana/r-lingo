import { describe, expect, it } from 'vitest'
import { normalizeCode } from '../lib/checkAnswer'
import { extraChallenges, getLessonChallenges, lessons } from './lessons'

const allChallenges = lessons.flatMap((lesson) =>
  getLessonChallenges(lesson).map((challenge, index) => ({
    id: `${lesson.title} #${index}`,
    challenge,
  })),
)

describe('content integrity', () => {
  it('every extraChallenges key matches a lesson title', () => {
    const titles = new Set(lessons.map((lesson) => lesson.title))
    for (const key of Object.keys(extraChallenges)) {
      expect(titles.has(key), `extraChallenges key sin unidad: ${key}`).toBe(true)
    }
  })

  it.each(allChallenges)('$id: answer is one of the choices', ({ challenge }) => {
    expect(challenge.choices).toContain(challenge.answer)
  })

  it.each(allChallenges)('$id: choices are unique and non-empty', ({ challenge }) => {
    expect(new Set(challenge.choices).size).toBe(challenge.choices.length)
    for (const choice of challenge.choices) expect(choice.trim().length).toBeGreaterThan(0)
  })

  it.each(allChallenges)('$id: prompt, explain and concept are non-empty', ({ challenge }) => {
    expect(challenge.prompt.trim().length).toBeGreaterThan(0)
    expect(challenge.explain.trim().length).toBeGreaterThan(0)
    expect(challenge.concept.trim().length).toBeGreaterThan(0)
  })

  it.each(allChallenges)('$id: gap template reconstructs the answer', ({ challenge }) => {
    if (!challenge.gap) return
    expect(challenge.gap.template.split('____').length, 'template debe tener exactamente un ____').toBe(2)
    const rebuilt = challenge.gap.template.replace('____', challenge.gap.blank)
    expect(normalizeCode(rebuilt)).toBe(normalizeCode(challenge.answer))
  })

  it.each(allChallenges)('$id: token parts join to the answer', ({ challenge }) => {
    if (!challenge.tokens) return
    expect(normalizeCode(challenge.tokens.parts.join(' '))).toBe(normalizeCode(challenge.answer))
    expect(challenge.tokens.distractors.length).toBeGreaterThanOrEqual(2)
    for (const distractor of challenge.tokens.distractors) {
      expect(challenge.tokens.parts).not.toContain(distractor)
    }
  })

  it.each(allChallenges)('$id: acceptedAnswers do not duplicate the answer', ({ challenge }) => {
    for (const accepted of challenge.acceptedAnswers ?? []) {
      expect(normalizeCode(accepted)).not.toBe(normalizeCode(challenge.answer))
    }
  })

  it.each(lessons.map((lesson) => ({ id: lesson.title, lesson })))(
    '$id: has at least 6 match pairs without duplicates',
    ({ lesson }) => {
      expect(lesson.matchPairs.length).toBeGreaterThanOrEqual(6)
      expect(new Set(lesson.matchPairs.map((pair) => pair.left)).size).toBe(lesson.matchPairs.length)
      expect(new Set(lesson.matchPairs.map((pair) => pair.right)).size).toBe(lesson.matchPairs.length)
    },
  )

  it.each(lessons.map((lesson) => ({ id: lesson.title, lesson })))(
    '$id: has at least 2 code-snippet questions',
    ({ lesson }) => {
      const withCode = getLessonChallenges(lesson).filter((challenge) => challenge.code)
      expect(withCode.length).toBeGreaterThanOrEqual(2)
    },
  )
})
