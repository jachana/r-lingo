type ChoiceListProps = {
  choices: string[]
  selected: string
  answer: string
  checked: boolean
  disabled: boolean
  revealAnswer?: boolean
  onSelect: (choice: string) => void
}

export function ChoiceList({ choices, selected, answer, checked, disabled, revealAnswer = false, onSelect }: ChoiceListProps) {
  return (
    <div className="choice-list">
      {choices.map((choice) => {
        const chosen = selected === choice
        const revealCorrect = checked && choice === answer && (selected === answer || revealAnswer)
        const revealWrong = checked && chosen && choice !== answer
        return (
          <button
            className={`choice ${chosen ? 'chosen' : ''} ${revealCorrect ? 'correct' : ''} ${revealWrong ? 'wrong' : ''}`}
            disabled={disabled}
            aria-pressed={chosen}
            key={choice}
            onClick={() => onSelect(choice)}
            type="button"
          >
            <code>{choice}</code>
          </button>
        )
      })}
    </div>
  )
}
