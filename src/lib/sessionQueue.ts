import { getChallengeKey } from '../data/lessons'
import type { ChallengeMode } from './pickMode'

export type QueueItem = {
  challengeIndex: number
  attempts: number
  failedModes: ChallengeMode[]
}

export function buildQueue(lessonIndex: number, challengeCount: number, completedCorrect: string[]): QueueItem[] {
  return Array.from({ length: challengeCount }, (_, index) => index)
    .filter((index) => !completedCorrect.includes(getChallengeKey(lessonIndex, index)))
    .map((challengeIndex) => ({ challengeIndex, attempts: 0, failedModes: [] }))
}

export function advanceQueue(queue: QueueItem[]): QueueItem[] {
  return queue.slice(1)
}

export function requeueFailed(queue: QueueItem[], failedMode: ChallengeMode): QueueItem[] {
  const [head, ...rest] = queue
  return [...rest, { ...head, attempts: head.attempts + 1, failedModes: [...head.failedModes, failedMode] }]
}

export function shouldReveal(item: QueueItem): boolean {
  return item.attempts >= 1
}
