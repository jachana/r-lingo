// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { getLessonChallenges, lessons } from './data/lessons'
import { freshProgress, matchingPairs } from './lib/learningSession'
import { progressKey } from './lib/progressStorage'
import { addDays, localDay, recordAttempt } from './lib/dailyLearning'

beforeEach(() => { localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('app progress journeys', () => {
  it('keeps answer-specific checker hints out of first-error feedback', async () => {
    const user = userEvent.setup()
    const progress = freshProgress()
    const run = progress.sessions[progress.lessonId]
    run.showTheory = false
    localStorage.setItem(progressKey, JSON.stringify(progress))
    render(<App />)
    await user.type(screen.getByRole('textbox'), 'Tamano_muestra <- 42')
    await user.click(screen.getByRole('button', { name: 'Revisar' }))
    const saved = JSON.parse(localStorage.getItem(progressKey)!)
    const hint = saved.sessions[progress.lessonId].result.hint
    expect(hint).toBeTruthy()
    expect(screen.queryByText(hint)).toBeNull()
    expect(screen.queryByText(lessons[0].challenges[0].explain)).toBeNull()
    expect(screen.getByText(/Piensa si quieres guardar un valor/)).toBeTruthy()
  })
  it('opens a due review and returns to the interrupted course without earning XP', async () => {
    const user = userEvent.setup()
    const progress = freshProgress()
    const id = lessons[0].challenges[1].id
    progress.reviewMetrics = recordAttempt({}, id, false, addDays(localDay(new Date()), -1), false)
    localStorage.setItem(progressKey, JSON.stringify(progress))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Repasar 1 conceptos pendientes' }))
    expect(screen.getByRole('heading', { name: lessons[0].challenges[1].prompt })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: lessons[0].challenges[1].answer }))
    await user.click(screen.getByRole('button', { name: 'Revisar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Repaso completo' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Volver al curso' }))
    const saved = JSON.parse(localStorage.getItem(progressKey)!)
    expect(saved.xp).toBe(0)
    expect(saved.completedCorrect).toEqual([])
    expect(saved.sessions[progress.lessonId].queue).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Practicar' })).toBeTruthy()
  })
  it('hides the explanation and correct option until a later failed attempt', async () => {
    const user = userEvent.setup()
    const progress = freshProgress()
    const question = lessons[0].challenges[1]
    progress.completedCorrect = getLessonChallenges(lessons[0]).filter((item) => item.id !== question.id).map((item) => item.id)
    progress.sessions[progress.lessonId].queue = [{ challengeId: question.id, attempts: 0, failedModes: [] }]
    progress.sessions[progress.lessonId].showTheory = false
    localStorage.setItem(progressKey, JSON.stringify(progress))
    render(<App />)
    await user.click(screen.getByRole('button', { name: '// excluir registros sin edad' }))
    await user.click(screen.getByRole('button', { name: 'Revisar' }))
    expect(screen.getByRole('button', { name: question.answer }).classList.contains('correct')).toBe(false)
    expect(screen.queryByText(question.explain)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: '// excluir registros sin edad' }))
    await user.click(screen.getByRole('button', { name: 'Revisar' }))
    expect(screen.getByRole('button', { name: question.answer }).classList.contains('correct')).toBe(true)
    expect(screen.getByText(question.explain)).toBeTruthy()
  })

  it('does not overwrite a future-format save while practicing in memory', async () => {
    const user = userEvent.setup()
    const future = JSON.stringify({ version: 9, valuable: 'keep' })
    localStorage.setItem(progressKey, future)
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Practicar' }))
    expect(localStorage.getItem(progressKey)).toBe(future)
    expect(screen.getByText(/Este progreso pertenece a otra versión/)).toBeTruthy()
  })
  it('preserves wrong feedback across a real App unmount/remount and continues the retry queue', async () => {
    const user = userEvent.setup()
    const progress = freshProgress()
    // Choose a prose question to exercise selection and feedback deterministically.
    const run = progress.sessions[progress.lessonId]
    const id = lessons[0].challenges[1].id
    run.queue = [run.queue.find((item) => item.challengeId === id)!, ...run.queue.filter((item) => item.challengeId !== id)]
    run.showTheory = false
    localStorage.setItem(progressKey, JSON.stringify(progress))
    const app = render(<App />)
    await user.click(screen.getByRole('button', { name: '// excluir registros sin edad' }))
    await user.click(screen.getByRole('button', { name: 'Revisar' }))
    expect(screen.getByText('Casi, pero no es esta.')).toBeTruthy()
    const saved = JSON.parse(localStorage.getItem(progressKey)!)
    expect(saved.hearts).toBe(4)
    app.unmount()
    render(<App />)
    expect(screen.getByText('Casi, pero no es esta.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    const continued = JSON.parse(localStorage.getItem(progressKey)!)
    expect(continued.sessions[progress.lessonId].queue.at(-1).attempts).toBe(1)
    expect(continued.hearts).toBe(4)
  })
  it('names the completed unit, unlocks the next, and starts replay without duplicate rewards', async () => {
    const user = userEvent.setup()
    const progress = freshProgress()
    progress.completedCorrect = getLessonChallenges(lessons[0]).map((question) => question.id)
    progress.xp = 240
    progress.sessions[progress.lessonId] = { ...progress.sessions[progress.lessonId], queue: [], phase: 'match', showTheory: false }
    localStorage.setItem(progressKey, JSON.stringify(progress))
    render(<App />)
    for (const pair of matchingPairs(progress.lessonId)) {
      await user.click(screen.getByRole('button', { name: pair.left }))
      await user.click(screen.getByRole('button', { name: pair.right }))
    }
    expect(screen.getByText('Primeros pasos en R completada')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Vectores y tipos de datos' }).hasAttribute('disabled')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Practicar de nuevo' }))
    const saved = JSON.parse(localStorage.getItem(progressKey)!)
    expect(saved.sessions[progress.lessonId].queue).toHaveLength(12)
    expect(saved.xp).toBe(260)
  })
  it('handles denied writes and cancels reset without losing earned progress', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    render(<App />)
    expect(screen.getByText(/No se pudo guardar en este navegador/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Reiniciar' }))
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Practicar' })).toBeTruthy()
  })
  it('invalid import leaves the active progress intact', async () => {
    const user = userEvent.setup()
    render(<App />)
    const before = localStorage.getItem(progressKey)
    await user.click(screen.getByText('Guardar o recuperar una copia de progreso'))
    const file = new File(['{'], 'invalid.json', { type: 'application/json' })
    // jsdom's File has no text() method; supply the same platform interface.
    Object.defineProperty(file, 'text', { value: async () => '{' })
    await user.upload(screen.getByLabelText('Recuperar desde un archivo de progreso'), file)
    await user.click(screen.getByRole('button', { name: 'Validar copia' }))
    expect(screen.getByText('Archivo incompatible o inválido. El progreso actual no cambió.')).toBeTruthy()
    expect(localStorage.getItem(progressKey)).toBe(before)
  })
})
