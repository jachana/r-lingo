type ChoiceListProps = {
  choices: string[]
  selected: string
  answer: string
  checked: boolean
  disabled: boolean
  onSelect: (choice: string) => void
}

export function ChoiceList({ choices, selected, answer, checked, disabled, onSelect }: ChoiceListProps) {
  return (
    <div className="choice-list">
      {choices.map((choice) => {
        const chosen = selected === choice
        const revealCorrect = checked && choice === answer
        const revealWrong = checked && chosen && choice !== answer
        return (
          <button
            className={`choice ${chosen ? 'chosen' : ''} ${revealCorrect ? 'correct' : ''} ${revealWrong ? 'wrong' : ''}`}
            disabled={disabled}
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
