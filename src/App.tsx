import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  FlaskConical,
  Heart,
  Lock,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react'
import './App.css'

import {
  type Challenge,
  getChallengeKey,
  getLessonChallenges,
  lessons,
  lessonSupport,
} from './data/lessons'
import { ChoiceList } from './components/ChoiceList'
import { FeedbackCard } from './components/FeedbackCard'
import { MatchBoard } from './components/MatchBoard'
import { TokenBank } from './components/TokenBank'
import { WriteCard } from './components/WriteCard'
import { checkTypedAnswer, type CheckResult } from './lib/checkAnswer'
import { pickMode, type ChallengeMode } from './lib/pickMode'
import { advanceQueue, buildQueue, requeueFailed, shouldReveal, type QueueItem } from './lib/sessionQueue'
import { seededShuffle } from './lib/shuffle'

const iconMap = {
  play: Play,
  flask: FlaskConical,
  chart: BarChart3,
}

function getExpectedAnswers(target: Challenge, mode: ChallengeMode): string[] {
  if (mode === 'gap' && target.gap) return [target.gap.blank, ...(target.gap.acceptedBlanks ?? [])]
  return [target.answer, ...(target.acceptedAnswers ?? [])]
}

function playFeedbackSound(kind: 'correct' | 'wrong' | 'unit') {
  try {
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext
    if (!AudioContextClass) return
    const audioContext = new AudioContextClass()
    const gain = audioContext.createGain()
    gain.connect(audioContext.destination)
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.55)

    const notes = kind === 'unit' ? [523, 659, 784, 1046] : kind === 'correct' ? [523, 659, 784] : [220, 165]
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator()
      oscillator.type = kind === 'wrong' ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.09)
      oscillator.connect(gain)
      oscillator.start(audioContext.currentTime + index * 0.09)
      oscillator.stop(audioContext.currentTime + index * 0.09 + 0.12)
    })
  } catch {
    // Audio feedback is a bonus; browsers can block it without affecting learning.
  }
}

type StoredProgress = {
  lessonIndex: number
  challengeIndex: number
  hearts: number
  streak: number
  completedCorrect: string[]
  completedLessons: number[]
  xp: number
}

const progressStorageKey = 'r-lingo-progress-v2'

function getTheoryPages(lesson: (typeof lessons)[number], support: (typeof lessonSupport)[string]) {
  return [
    {
      eyebrow: 'Qué es',
      title: lesson.title,
      body:
        `${lesson.theory.why} En simple: esta unidad te enseña una herramienta pequeña de R para que una pregunta de salud pública quede escrita como pasos claros, no como memoria o intuición.`,
      bullets: support.keyIdeas.slice(0, 2),
    },
    {
      eyebrow: 'Cuándo y por qué',
      title: 'Cuándo usarlo',
      body:
        'Úsalo cuando quieras que otra persona pueda revisar tu análisis, repetirlo o entender por qué tomaste una decisión. En investigación, eso importa tanto como llegar al número final.',
      bullets: lesson.theory.canDo,
    },
    {
      eyebrow: 'Dónde aparece',
      title: 'Dónde lo verás en datos reales',
      body:
        'Aparece en bases de vigilancia, encuestas, laboratorios, reportes comunales y tableros. Normalmente lo usarás al preparar datos antes de calcular tasas, filtrar casos o crear gráficos.',
      bullets: support.tips.slice(0, 3),
    },
    {
      eyebrow: 'Cómo se usa',
      title: 'Cómo se ve en R',
      body:
        'No necesitas memorizar todo. Mira el patrón general: nombre de objeto, función, paréntesis, argumentos y comentarios. La práctica después te pide reconocer o completar estas piezas.',
      code: support.script,
    },
    {
      eyebrow: 'Ejemplo',
      title: 'Ejemplo en salud pública',
      body: lesson.theory.example,
      bullets: support.keyIdeas.slice(2),
    },
    {
      eyebrow: 'Antes de practicar',
      title: 'Lo mínimo para responder',
      body:
        'Las preguntas salen de estas ideas. Si algo parece aparecer de la nada, vuelve a esta página y busca la palabra clave: función, objeto, filtro, fecha, porcentaje o gráfico.',
      bullets: [...support.keyIdeas.slice(0, 4), ...support.tips.slice(0, 2)],
    },
  ]
}

function getFreshProgress(): StoredProgress {
  return { lessonIndex: 0, challengeIndex: 0, hearts: 5, streak: 0, completedCorrect: [], completedLessons: [], xp: 0 }
}

function getCompletedLessonsFromAnswers(completedCorrect: string[]) {
  return lessons.reduce<number[]>((completed, lesson, lessonIndex) => {
    const lessonDone = getLessonChallenges(lesson).every((_, challengeIndex) =>
      completedCorrect.includes(getChallengeKey(lessonIndex, challengeIndex)),
    )
    return lessonDone ? [...completed, lessonIndex] : completed
  }, [])
}

function getUnlockedLessonIndex(completedLessons: number[]) {
  const completedSet = new Set(completedLessons)
  const firstLocked = lessons.findIndex((_, index) => !completedSet.has(index))
  return firstLocked === -1 ? lessons.length - 1 : firstLocked
}

function getInitialPhase(lessonIndex: number, completedCorrect: string[], completedLessons: number[]): 'practice' | 'match' | 'done' {
  const queue = buildQueue(lessonIndex, getLessonChallenges(lessons[lessonIndex]).length, completedCorrect)
  if (queue.length > 0) return 'practice'
  return completedLessons.includes(lessonIndex) ? 'done' : 'match'
}

function readStoredProgress(): StoredProgress {
  if (typeof window === 'undefined') return getFreshProgress()

  try {
    const stored = window.localStorage.getItem(progressStorageKey)
    if (!stored) return getFreshProgress()

    const parsed = JSON.parse(stored) as Partial<StoredProgress>
    const storedLessonIndex = Math.min(Math.max(parsed.lessonIndex ?? 0, 0), lessons.length - 1)
    const storedCompletedLessons = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : undefined
    const completedLessons = [
      ...new Set(
        (storedCompletedLessons ?? getCompletedLessonsFromAnswers(Array.isArray(parsed.completedCorrect) ? parsed.completedCorrect : [])).filter(
          (index) => Number.isInteger(index) && index >= 0 && index < lessons.length,
        ),
      ),
    ]
    const safeLessonIndex = Math.min(storedLessonIndex, getUnlockedLessonIndex(completedLessons))
    const safeLesson = lessons[safeLessonIndex]
    const completedCorrect = Array.isArray(parsed.completedCorrect) ? parsed.completedCorrect : []
    const safeChallengeIndex = Math.min(Math.max(parsed.challengeIndex ?? 0, 0), getLessonChallenges(safeLesson).length - 1)
    const queue = buildQueue(safeLessonIndex, getLessonChallenges(safeLesson).length, completedCorrect)
    const resumeChallengeIndex = completedCorrect.includes(getChallengeKey(safeLessonIndex, safeChallengeIndex))
      ? (queue[0]?.challengeIndex ?? 0)
      : safeChallengeIndex

    return {
      lessonIndex: safeLessonIndex,
      challengeIndex: resumeChallengeIndex,
      hearts: Math.min(Math.max(parsed.hearts ?? 5, 0), 5),
      streak: Math.max(parsed.streak ?? 0, 0),
      completedCorrect,
      completedLessons,
      xp: Math.max(parsed.xp ?? completedCorrect.length * 20, 0),
    }
  } catch {
    return getFreshProgress()
  }
}

function App() {
  const [initialProgress] = useState(readStoredProgress)
  const [lessonIndex, setLessonIndex] = useState(initialProgress.lessonIndex)
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    buildQueue(
      initialProgress.lessonIndex,
      getLessonChallenges(lessons[initialProgress.lessonIndex]).length,
      initialProgress.completedCorrect,
    ),
  )
  const [phase, setPhase] = useState<'practice' | 'match' | 'done'>(() =>
    getInitialPhase(initialProgress.lessonIndex, initialProgress.completedCorrect, initialProgress.completedLessons),
  )
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult>({ correct: false })
  const [completedCorrect, setCompletedCorrect] = useState(initialProgress.completedCorrect)
  const [completedLessons, setCompletedLessons] = useState(initialProgress.completedLessons)
  const [hearts, setHearts] = useState(initialProgress.hearts)
  const [streak, setStreak] = useState(initialProgress.streak)
  const [xp, setXp] = useState(initialProgress.xp)
  const [celebration, setCelebration] = useState<'correct' | 'level' | 'unit' | null>(null)
  const [showTheory, setShowTheory] = useState(true)
  const [theoryPageIndex, setTheoryPageIndex] = useState(0)

  const lesson = lessons[lessonIndex]
  const lessonChallenges = getLessonChallenges(lesson)
  const support = lessonSupport[lesson.title]
  const theoryPages = getTheoryPages(lesson, support)
  const theoryPage = theoryPages[theoryPageIndex] ?? theoryPages[0]
  const theoryProgress = ((theoryPageIndex + 1) / theoryPages.length) * 100
  const currentItem = queue[0]
  const challengeIndex = currentItem?.challengeIndex ?? 0
  const challenge = lessonChallenges[challengeIndex]
  const challengeKey = getChallengeKey(lessonIndex, challengeIndex)
  const challengeMode = currentItem
    ? pickMode(challenge, `${challengeKey}-a${currentItem.attempts}`, currentItem.failedModes.at(-1))
    : 'choice'
  const revealOnWrong = currentItem ? shouldReveal(currentItem) : false
  const shuffledChoices = useMemo(
    () => seededShuffle(challenge.choices, `${challengeKey}-${challenge.answer}`),
    [challenge.choices, challenge.answer, challengeKey],
  )
  const isCorrect = checkResult.correct
  const totalChallenges = lessons.reduce((sum, item) => sum + getLessonChallenges(item).length, 0)
  const progress = (completedCorrect.length / totalChallenges) * 100
  const level = Math.floor(xp / 100) + 1
  const levelProgress = xp % 100
  const unlockedLessonIndex = getUnlockedLessonIndex(completedLessons)

  const lessonScore = useMemo(() => {
    return Math.round((completedCorrect.length / totalChallenges) * 100)
  }, [completedCorrect.length, totalChallenges])

  useEffect(() => {
    const progressToStore: StoredProgress = { lessonIndex, challengeIndex: queue[0]?.challengeIndex ?? 0, hearts, streak, completedCorrect, completedLessons, xp }
    window.localStorage.setItem(progressStorageKey, JSON.stringify(progressToStore))
  }, [lessonIndex, queue, hearts, streak, completedCorrect, completedLessons, xp])

  useEffect(() => {
    if (!celebration) return
    const timeout = window.setTimeout(() => setCelebration(null), celebration === 'unit' ? 2600 : 1600)
    return () => window.clearTimeout(timeout)
  }, [celebration])

  function checkAnswer() {
    if (!currentItem) return
    if (!selected.trim()) return
    const result =
      challengeMode === 'choice'
        ? { correct: selected === challenge.answer }
        : checkTypedAnswer(selected, getExpectedAnswers(challenge, challengeMode))
    setCheckResult(result)
    setChecked(true)
    if (result.correct) {
      const isNewCompletion = !completedCorrect.includes(challengeKey)
      setCompletedCorrect((completed) => {
        if (completed.includes(challengeKey)) return completed
        return [...completed, challengeKey]
      })
      setStreak((count) => count + 1)
      playFeedbackSound('correct')
      if (isNewCompletion) {
        setXp((currentXp) => {
          const nextXp = currentXp + 20
          setCelebration(nextXp % 100 < currentXp % 100 ? 'level' : 'correct')
          return nextXp
        })
      } else {
        setCelebration('correct')
      }
    } else {
      playFeedbackSound('wrong')
      setHearts((count) => Math.max(0, count - 1))
      setStreak(0)
    }
  }

  function continueSession() {
    const nextQueue = checkResult.correct ? advanceQueue(queue) : requeueFailed(queue, challengeMode)
    setQueue(nextQueue)
    if (nextQueue.length === 0) setPhase('match')
    setSelected('')
    setChecked(false)
    setCheckResult({ correct: false })
  }

  function advanceLesson() {
    if (lessonIndex < lessons.length - 1) {
      const nextLessonIndex = lessonIndex + 1
      const nextQueue = buildQueue(nextLessonIndex, getLessonChallenges(lessons[nextLessonIndex]).length, completedCorrect)
      setLessonIndex(nextLessonIndex)
      setQueue(nextQueue)
      setPhase(nextQueue.length === 0 ? 'done' : 'practice')
      setShowTheory(true)
      setTheoryPageIndex(0)
    } else {
      setPhase('done')
    }
    setSelected('')
    setChecked(false)
    setCheckResult({ correct: false })
  }

  function finishMatch() {
    setCompletedLessons((completed) => (completed.includes(lessonIndex) ? completed : [...completed, lessonIndex]))
    setXp((currentXp) => currentXp + 20)
    playFeedbackSound('unit')
    setCelebration('unit')
    advanceLesson()
  }

  function restart() {
    setLessonIndex(0)
    setQueue(buildQueue(0, getLessonChallenges(lessons[0]).length, []))
    setPhase('practice')
    setSelected('')
    setChecked(false)
    setCheckResult({ correct: false })
    setCompletedCorrect([])
    setCompletedLessons([])
    setHearts(5)
    setStreak(0)
    setXp(0)
    setCelebration(null)
    setShowTheory(true)
    setTheoryPageIndex(0)
  }

  return (
    <main className="app-shell">
      {celebration && (
        <div className={`celebration ${celebration}`} aria-live="polite">
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i key={index} style={{ '--pop': index } as CSSProperties} />
            ))}
          </div>
          <div className="celebration-card">
            {celebration === 'level' || celebration === 'unit' ? <Trophy size={42} aria-hidden="true" /> : <Sparkles size={42} aria-hidden="true" />}
            <strong>{celebration === 'unit' ? 'Unidad lista!' : celebration === 'level' ? `Nivel ${level}!` : '+20 XP'}</strong>
            <span>
              {celebration === 'unit'
                ? `${lesson.title} completada`
                : celebration === 'level'
                  ? 'Nuevo nivel de análisis desbloqueado.'
                  : streak > 1
                    ? `Racha de ${streak}`
                    : 'Respuesta correcta'}
            </span>
          </div>
        </div>
      )}

      <section className="topbar" aria-label="Resumen de avance">
        <div>
          <p className="eyebrow">R-Lingo</p>
          <h1>Aprende R con ejemplos de salud pública.</h1>
        </div>
        <div className="stats">
          <span title="Vidas">
            <Heart size={18} aria-hidden="true" /> {hearts}
          </span>
          <span title="Racha">
            <Flame size={18} aria-hidden="true" /> {streak}
          </span>
          <span title="Logro">
            <Trophy size={18} aria-hidden="true" /> {lessonScore}%
          </span>
          <span title="Experiencia">
            <Medal size={18} aria-hidden="true" /> {xp} XP
          </span>
        </div>
      </section>

      <div className="progress-track" aria-label="Avance del curso">
        <div style={{ width: `${progress}%` }} />
      </div>

      <section className="reward-strip" aria-label="Progreso de recompensa">
        <div className="level-pill">
          <BadgeCheck size={20} aria-hidden="true" />
          <span>Nivel {level}</span>
        </div>
        <div className="level-track">
          <div style={{ width: `${levelProgress}%` }} />
        </div>
        <strong>
          {completedCorrect.length} de {totalChallenges} listas · {100 - levelProgress} XP para el siguiente nivel
        </strong>
      </section>

      <section className="learning-grid">
        <aside className="lesson-path" aria-label="Unidades">
          {lessons.map((item, index) => {
            const Icon = iconMap[item.icon]
            const active = index === lessonIndex
            const complete = completedLessons.includes(index)
            const locked = index > unlockedLessonIndex
            return (
              <button
                aria-label={locked ? `${item.title}, bloqueada` : item.title}
                className={`lesson-node ${active ? 'active' : ''} ${complete ? 'complete' : ''} ${locked ? 'locked' : ''}`}
                disabled={locked}
                key={item.title}
                onClick={() => {
                  if (locked) return
                  const nextQueue = buildQueue(index, getLessonChallenges(lessons[index]).length, completedCorrect)
                  setLessonIndex(index)
                  setQueue(nextQueue)
                  setPhase(getInitialPhase(index, completedCorrect, completedLessons))
                  setSelected('')
                  setChecked(false)
                  setCheckResult({ correct: false })
                  setShowTheory(true)
                  setTheoryPageIndex(0)
                }}
                type="button"
              >
                <span className="lesson-icon">
                  {locked ? <Lock size={20} aria-hidden="true" /> : complete ? <Check size={20} aria-hidden="true" /> : <Icon size={20} aria-hidden="true" />}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{locked ? 'Completa la unidad anterior para desbloquear' : item.goal}</small>
                </span>
              </button>
            )
          })}
        </aside>

        <section className="challenge-panel" aria-live="polite">
          <div className="lesson-meta">
            <span>{lesson.tag}</span>
            <button className="theory-toggle" onClick={() => setShowTheory((visible) => !visible)} type="button">
              <BookOpen size={17} aria-hidden="true" />
              {showTheory ? 'Practicar' : 'Leer unidad'}
            </button>
          </div>

          {showTheory ? (
            <article className="theory-card">
              <div className="theory-icon">
                <BookOpen size={28} aria-hidden="true" />
              </div>
              <div className="theory-progress-header">
                <div>
                  <p className="eyebrow mini">{theoryPage.eyebrow}</p>
                  <h2>{theoryPage.title}</h2>
                </div>
                <span>
                  {theoryPageIndex + 1} de {theoryPages.length}
                </span>
              </div>
              <div className="theory-page-track" aria-label="Progreso de lectura de la unidad">
                <div style={{ width: `${theoryProgress}%` }} />
              </div>
              <p className="context theory-body">{theoryPage.body}</p>
              {theoryPage.bullets && (
                <ul>
                  {theoryPage.bullets.map((item) => (
                    <li key={item}>
                      <Check size={18} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {theoryPage.code && (
                <div className="lesson-support single">
                  <pre>
                    <code>{theoryPage.code}</code>
                  </pre>
                </div>
              )}
              <div className="documentation-links" aria-label={`Documentación de ${lesson.title}`}>
                <strong>Documentación dentro de la app</strong>
                <div>
                  {lesson.theory.docs.map((doc) => (
                    <article className="doc-note" key={doc.url}>
                      <strong>{doc.label}</strong>
                      <span>{doc.summary}</span>
                      <a href={doc.url} rel="noreferrer" target="_blank">
                        Fuente original
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    </article>
                  ))}
                </div>
              </div>
              <div className="actions theory-actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar
                </button>
                <div className="theory-nav">
                  <button className="secondary" disabled={theoryPageIndex === 0} onClick={() => setTheoryPageIndex((page) => Math.max(0, page - 1))} type="button">
                    Atrás
                  </button>
                  {theoryPageIndex < theoryPages.length - 1 ? (
                    <button className="primary" onClick={() => setTheoryPageIndex((page) => Math.min(theoryPages.length - 1, page + 1))} type="button">
                      Siguiente
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  ) : (
                    <button className="primary" onClick={() => setShowTheory(false)} type="button">
                      Empezar práctica
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ) : phase === 'practice' && currentItem ? (
            <>
              <div className="question-count">
                {challengeIndex + 1} de {lessonChallenges.length}
              </div>
              <h2>{challenge.prompt}</h2>
              <p className="context">{challenge.context}</p>

              {challenge.code && (
                <pre className="challenge-code">
                  <code>{challenge.code}</code>
                </pre>
              )}

              {challengeMode === 'choice' ? (
                <ChoiceList
                  answer={challenge.answer}
                  checked={checked}
                  choices={shuffledChoices}
                  disabled={checked}
                  onSelect={setSelected}
                  selected={selected}
                />
              ) : challengeMode === 'tokens' && challenge.tokens ? (
                <TokenBank
                  checked={checked}
                  correct={isCorrect}
                  disabled={checked}
                  distractors={challenge.tokens.distractors}
                  key={challengeKey}
                  onChange={setSelected}
                  parts={challenge.tokens.parts}
                  seed={challengeKey}
                />
              ) : (
                <WriteCard
                  checked={checked}
                  correct={isCorrect}
                  disabled={checked}
                  gapTemplate={challenge.gap?.template}
                  hint={checkResult.hint}
                  mode={challengeMode === 'gap' ? 'gap' : 'write'}
                  onChange={setSelected}
                  revealedAnswer={checked && !isCorrect && revealOnWrong ? (challengeMode === 'gap' ? challenge.gap?.blank : challenge.answer) : undefined}
                  value={selected}
                />
              )}

              {checked && (
                <FeedbackCard
                  concept={challenge.concept}
                  correct={isCorrect}
                  explain={challenge.explain}
                  hint={checkResult.hint}
                  onReviewConcept={() => setShowTheory(true)}
                  revealedAnswer={checked && !isCorrect && revealOnWrong ? (challengeMode === 'gap' ? challenge.gap?.blank : challenge.answer) : undefined}
                />
              )}

              <div className="actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar
                </button>
                {checked ? (
                  <button className="primary" onClick={continueSession} type="button">
                    Continuar
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                ) : (
                  <button className="primary" disabled={!selected.trim()} onClick={checkAnswer} type="button">
                    Revisar
                    <Check size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            </>
          ) : phase === 'match' ? (
            <>
              <h2>Repaso: {lesson.title}</h2>
              <p className="context">Última prueba antes de cerrar la unidad.</p>
              <MatchBoard
                key={lessonIndex}
                onComplete={finishMatch}
                pairs={seededShuffle(lesson.matchPairs, `match-${lessonIndex}`).slice(0, 4)}
                seed={`match-${lessonIndex}`}
              />
              <div className="actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Unidad completa</h2>
              <p className="context">Ya no quedan preguntas pendientes en esta unidad.</p>
              <div className="feedback good">
                <strong>Buen trabajo.</strong>
                <span>Tu progreso quedó guardado en este dispositivo.</span>
              </div>
              <div className="actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar curso
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="reference-panel" aria-label="Referencia de R para salud pública">
          <div className="daily-goal">
            <Sparkles size={20} aria-hidden="true" />
            <div>
              <strong>Meta de hoy</strong>
              <span>Lee una unidad, responde sus ejercicios y prueba los comandos en RStudio.</span>
            </div>
          </div>
          <h3>Mapa rápido de R</h3>
          <ul>
            <li>
              <code>read.csv()</code>
              <span>Carga un CSV de vigilancia, encuesta o laboratorio como tabla.</span>
              <a href="https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html" rel="noreferrer" target="_blank">
                Fuente
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>summary()</code>
              <span>Resume rangos, frecuencias y posibles valores raros.</span>
              <a href="https://stat.ethz.ch/R-manual/R-devel/library/base/html/summary.html" rel="noreferrer" target="_blank">
                Fuente
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>filter()</code>
              <span>Deja solo filas que cumplen criterios, como confirmados o una comuna.</span>
              <a href="https://dplyr.tidyverse.org/reference/filter.html" rel="noreferrer" target="_blank">
                Fuente
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>ggplot()</code>
              <span>Inicia gráficos para tendencias, grupos o comparación territorial.</span>
              <a href="https://ggplot2.tidyverse.org/reference/ggplot.html" rel="noreferrer" target="_blank">
                Fuente
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </aside>
      </section>
    </main>
  )
}

export default App
