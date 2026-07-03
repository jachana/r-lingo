type WriteCardProps = {
  mode: 'write' | 'gap'
  gapTemplate?: string
  value: string
  checked: boolean
  correct: boolean
  hint?: string
  revealedAnswer?: string
  disabled: boolean
  onChange: (value: string) => void
}

export function WriteCard({ mode, gapTemplate, value, checked, correct, hint, revealedAnswer, disabled, onChange }: WriteCardProps) {
  return (
    <div className={`write-card ${checked ? (correct ? 'correct' : 'wrong') : ''}`}>
      <label htmlFor="written-answer">{mode === 'gap' ? 'Rellena el espacio' : 'Escribe la respuesta'}</label>
      {mode === 'gap' && gapTemplate && (
        <div className="gap-line" aria-hidden="true">
          <code>{gapTemplate}</code>
        </div>
      )}
      <input
        autoComplete="off"
        disabled={disabled}
        id="written-answer"
        onChange={(event) => onChange(event.target.value)}
        placeholder={mode === 'gap' ? 'Completa solo el espacio ____' : 'Escribe tu respuesta aquí'}
        type="text"
        value={value}
      />
      {!checked && <small>Tip: R distingue mayúsculas. El espaciado no importa.</small>}
      {checked && !correct && hint && <small>{hint}</small>}
      {checked && !correct && revealedAnswer && (
        <small>
          Respuesta esperada: <code>{revealedAnswer}</code>
        </small>
      )}
    </div>
  )
}
