import { BookOpen } from 'lucide-react'

type FeedbackCardProps = {
  correct: boolean
  explain: string
  hint?: string
  revealedAnswer?: string
  concept: string
  onReviewConcept: () => void
}

export function FeedbackCard({ correct, explain, hint, revealedAnswer, concept, onReviewConcept }: FeedbackCardProps) {
  return (
    <div className={`feedback ${correct ? 'good' : 'try-again'}`}>
      <strong>{correct ? 'Bien ahí. Tu racha de análisis sigue viva.' : 'Casi, pero no es esta.'}</strong>
      {hint && !correct && <span className="feedback-hint">{hint}</span>}
      <span>{explain}</span>
      {revealedAnswer && !correct && (
        <span>
          Respuesta esperada: <code>{revealedAnswer}</code>
        </span>
      )}
      <button className="concept-link" onClick={onReviewConcept} type="button">
        <BookOpen size={16} aria-hidden="true" />
        Repasar {concept} en esta unidad
      </button>
    </div>
  )
}
