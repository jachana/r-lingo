import { describe, expect, it } from 'vitest'
import type { Challenge } from '../data/lessons'
import { pickMode, supportedModes } from './pickMode'

const base: Challenge = {
  prompt: 'p',
  context: 'c',
  choices: ['a', 'b'],
  answer: 'a',
  explain: 'e',
  concept: 'k',
}

const gap = { template: 'x <- ____', blank: '42' }
const tokens = { parts: ['x', '<-', '42'], distractors: ['=='] }

describe('supportedModes', () => {
  it('prose question: choice only', () => {
    expect(supportedModes(base)).toEqual(['choice'])
  })

  it('gap authored: choice + gap + write', () => {
    expect(supportedModes({ ...base, gap })).toEqual(['choice', 'gap', 'write'])
  })

  it('tokens authored: choice + tokens + write', () => {
    expect(supportedModes({ ...base, tokens })).toEqual(['choice', 'tokens', 'write'])
  })

  it('both authored: all four', () => {
    expect(supportedModes({ ...base, gap, tokens })).toEqual(['choice', 'gap', 'tokens', 'write'])
  })
})

describe('pickMode', () => {
  const full = { ...base, gap, tokens }

  it('is deterministic for the same seed', () => {
    expect(pickMode(full, 'seed-1')).toBe(pickMode(full, 'seed-1'))
  })

  it('returns a supported mode', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(supportedModes(full)).toContain(pickMode(full, seed))
    }
  })

  it('varies across seeds', () => {
    const picks = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].map((seed) => pickMode(full, seed)))
    expect(picks.size).toBeGreaterThan(1)
  })

  it('excludes the failed mode when alternatives exist', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      expect(pickMode(full, seed, 'choice')).not.toBe('choice')
    }
  })

  it('ignores exclusion when it is the only mode', () => {
    expect(pickMode(base, 'any', 'choice')).toBe('choice')
  })
})
