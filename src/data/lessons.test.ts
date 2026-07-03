import { describe, expect, it } from 'vitest'
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
})
