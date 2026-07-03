import type { Challenge } from '../data/lessons'

export type ChallengeMode = 'choice' | 'write' | 'gap' | 'tokens'

export function supportedModes(challenge: Challenge): ChallengeMode[] {
  const modes: ChallengeMode[] = ['choice']
  if (challenge.gap) modes.push('gap')
  if (challenge.tokens) modes.push('tokens')
  if (challenge.gap || challenge.tokens) modes.push('write')
  return modes
}

function hashSeed(seed: string): number {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

export function pickMode(challenge: Challenge, seed: string, excludeMode?: ChallengeMode): ChallengeMode {
  let modes = supportedModes(challenge)
  if (excludeMode && modes.length > 1) modes = modes.filter((mode) => mode !== excludeMode)
  return modes[hashSeed(seed) % modes.length]
}
