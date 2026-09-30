import { useEffect, useMemo, useRef, useState } from 'react'
import type { MatchPair } from '../data/lessons'
import { seededShuffle } from '../lib/shuffle'

type MatchBoardProps = {
  pairs: MatchPair[]
  seed: string
  matchedLefts: string[]
  onMatch: (left: string, right: string) => void
}

export function MatchBoard({ pairs, seed, matchedLefts, onMatch }: MatchBoardProps) {
  const rights = useMemo(() => seededShuffle(pairs.map((pair) => pair.right), `${seed}-rights`), [pairs, seed])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [shaking, setShaking] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('Elige un comando y después su significado.')
  const shakeTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(shakeTimer.current), [])

  const matchedRights = matchedLefts.map((left) => pairs.find((pair) => pair.left === left)!.right)

  function tryMatch(right: string) {
    if (!selectedLeft) return
    const pair = pairs.find((candidate) => candidate.left === selectedLeft)!
    if (pair.right === right) {
      onMatch(selectedLeft, right)
      setAnnouncement(`Correcto: ${selectedLeft} — ${right}.`)
      setSelectedLeft(null)
    } else {
      setShaking(right)
      setAnnouncement('Estas piezas no corresponden. Prueba otro significado.')
      window.clearTimeout(shakeTimer.current)
      shakeTimer.current = window.setTimeout(() => setShaking(null), 450)
    }
  }

  return (
    <div className="match-board">
      <span className="token-label">Une cada comando con lo que hace</span>
      <p role="status">{announcement} {matchedLefts.length} de {pairs.length} parejas listas.</p>
      <div className="match-grid">
        <div className="match-column">
          {pairs.map((pair) => (
            <button
              className={`match-option ${selectedLeft === pair.left ? 'selected' : ''} ${matchedLefts.includes(pair.left) ? 'matched' : ''}`}
              disabled={matchedLefts.includes(pair.left)}
              aria-pressed={selectedLeft === pair.left || matchedLefts.includes(pair.left)}
              aria-label={`${pair.left}${matchedLefts.includes(pair.left) ? ', completado' : ''}`}
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
              aria-label={`${right}${matchedRights.includes(right) ? ', completado' : ''}`}
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
