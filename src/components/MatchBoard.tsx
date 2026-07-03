import { useMemo, useState } from 'react'
import type { MatchPair } from '../data/lessons'
import { seededShuffle } from '../lib/shuffle'

type MatchBoardProps = {
  pairs: MatchPair[]
  seed: string
  onComplete: () => void
}

export function MatchBoard({ pairs, seed, onComplete }: MatchBoardProps) {
  const rights = useMemo(() => seededShuffle(pairs.map((pair) => pair.right), `${seed}-rights`), [pairs, seed])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matchedLefts, setMatchedLefts] = useState<string[]>([])
  const [shaking, setShaking] = useState<string | null>(null)

  const matchedRights = matchedLefts.map((left) => pairs.find((pair) => pair.left === left)!.right)

  function tryMatch(right: string) {
    if (!selectedLeft) return
    const pair = pairs.find((candidate) => candidate.left === selectedLeft)!
    if (pair.right === right) {
      const nextMatched = [...matchedLefts, selectedLeft]
      setMatchedLefts(nextMatched)
      setSelectedLeft(null)
      if (nextMatched.length === pairs.length) onComplete()
    } else {
      setShaking(right)
      window.setTimeout(() => setShaking(null), 450)
    }
  }

  return (
    <div className="match-board">
      <span className="token-label">Une cada comando con lo que hace</span>
      <div className="match-grid">
        <div className="match-column">
          {pairs.map((pair) => (
            <button
              className={`match-option ${selectedLeft === pair.left ? 'selected' : ''} ${matchedLefts.includes(pair.left) ? 'matched' : ''}`}
              disabled={matchedLefts.includes(pair.left)}
              key={pair.left}
              onClick={() => setSelectedLeft(pair.left)}
              type="button"
            >
              <code>{pair.left}</code>
            </button>
          ))}
        </div>
        <div className="match-column">
          {rights.map((right) => (
            <button
              className={`match-option ${matchedRights.includes(right) ? 'matched' : ''} ${shaking === right ? 'shake' : ''}`}
              disabled={matchedRights.includes(right) || !selectedLeft}
              key={right}
              onClick={() => tryMatch(right)}
              type="button"
            >
              {right}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
