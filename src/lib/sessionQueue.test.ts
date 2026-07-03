import { describe, expect, it } from 'vitest'
import { getChallengeKey } from '../data/lessons'
import { advanceQueue, buildQueue, requeueFailed, shouldReveal } from './sessionQueue'

describe('buildQueue', () => {
  it('contains all challenges when nothing is complete', () => {
    expect(buildQueue(0, 3, []).map((item) => item.challengeIndex)).toEqual([0, 1, 2])
  })

  it('skips completed challenges', () => {
    const completed = [getChallengeKey(0, 1)]
    expect(buildQueue(0, 3, completed).map((item) => item.challengeIndex)).toEqual([0, 2])
  })

  it('only skips completions of the same lesson', () => {
    const completed = [getChallengeKey(1, 0)]
    expect(buildQueue(0, 2, completed).map((item) => item.challengeIndex)).toEqual([0, 1])
  })

  it('items start with zero attempts and no failed modes', () => {
    expect(buildQueue(0, 1, [])[0]).toEqual({ challengeIndex: 0, attempts: 0, failedModes: [] })
  })
})

describe('advanceQueue / requeueFailed', () => {
  it('advance drops the head', () => {
    const queue = buildQueue(0, 3, [])
    expect(advanceQueue(queue).map((item) => item.challengeIndex)).toEqual([1, 2])
  })

  it('requeue moves the head to the back with attempt + failed mode recorded', () => {
    const queue = buildQueue(0, 3, [])
    const next = requeueFailed(queue, 'choice')
    expect(next.map((item) => item.challengeIndex)).toEqual([1, 2, 0])
    expect(next[2]).toEqual({ challengeIndex: 0, attempts: 1, failedModes: ['choice'] })
  })

  it('requeue on a single-item queue keeps the item as head', () => {
    const queue = buildQueue(0, 1, [])
    const next = requeueFailed(queue, 'write')
    expect(next).toHaveLength(1)
    expect(next[0].attempts).toBe(1)
  })

  it('does not mutate the input queue', () => {
    const queue = buildQueue(0, 2, [])
    requeueFailed(queue, 'choice')
    advanceQueue(queue)
    expect(queue[0]).toEqual({ challengeIndex: 0, attempts: 0, failedModes: [] })
    expect(queue).toHaveLength(2)
  })
})

describe('shouldReveal', () => {
  it('false on first attempt, true once the item was failed before', () => {
    const queue = buildQueue(0, 1, [])
    expect(shouldReveal(queue[0])).toBe(false)
    const retried = requeueFailed(queue, 'choice')
    expect(shouldReveal(retried[0])).toBe(true)
  })
})
