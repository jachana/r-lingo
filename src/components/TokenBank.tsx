import { useMemo, useState } from 'react'
import { seededShuffle } from '../lib/shuffle'

type TokenBankProps = {
  parts: string[]
  distractors: string[]
  seed: string
  checked: boolean
  correct: boolean
  disabled: boolean
  onChange: (built: string) => void
}

type Chip = { id: number; label: string }

export function TokenBank({ parts, distractors, seed, checked, correct, disabled, onChange }: TokenBankProps) {
  const pool = useMemo<Chip[]>(
    () => seededShuffle([...parts, ...distractors], seed).map((label, id) => ({ id, label })),
    [parts, distractors, seed],
  )
  const [placedIds, setPlacedIds] = useState<number[]>([])

  function emit(nextPlaced: number[]) {
    setPlacedIds(nextPlaced)
    onChange(nextPlaced.map((id) => pool.find((chip) => chip.id === id)!.label).join(' '))
  }

  const placedChips = placedIds.map((id) => pool.find((chip) => chip.id === id)!)

  return (
    <div className={`token-bank ${checked ? (correct ? 'correct' : 'wrong') : ''}`}>
      <span className="token-label">Arma el comando tocando los bloques</span>
      <div className="token-line" aria-live="polite">
        {placedChips.length === 0 && <span className="token-placeholder">Toca bloques para armar tu respuesta</span>}
        {placedChips.map((chip) => (
          <button
            className="token-chip placed"
            disabled={disabled}
            key={chip.id}
            onClick={() => emit(placedIds.filter((id) => id !== chip.id))}
            type="button"
          >
            <code>{chip.label}</code>
          </button>
        ))}
      </div>
      <div className="token-pool">
        {pool.map((chip) => {
          const used = placedIds.includes(chip.id)
          return (
            <button
              className={`token-chip ${used ? 'used' : ''}`}
              disabled={disabled || used}
              key={chip.id}
              onClick={() => emit([...placedIds, chip.id])}
              type="button"
            >
              <code>{chip.label}</code>
            </button>
          )
        })}
      </div>
    </div>
  )
}
