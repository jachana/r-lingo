import { type CSSProperties, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  BarChart3,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  FlaskConical,
  Lock,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react'
import './App.css'

import {
  getLessonChallenges,
  lessons,
  lessonSupport,
} from './data/lessons'
import { ChoiceList } from './components/ChoiceList'
import { FeedbackCard } from './components/FeedbackCard'
import { MatchBoard } from './components/MatchBoard'
import { TokenBank } from './components/TokenBank'
import { WriteCard } from './components/WriteCard'
import { activeLessonId, activeRun, allChallenges, challengeById, currentMode, evaluateAnswer, lessonFor, matchingPairs, transition, unlockedIndex } from './lib/learningSession'
import { importProgress, loadProgress, saveProgress } from './lib/progressStorage'
import { seededShuffle } from './lib/shuffle'
import { concepts, dayStreak, dueReview, localDay } from './lib/dailyLearning'

const iconMap = {
  play: Play,
  flask: FlaskConical,
  chart: BarChart3,
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
    window.setTimeout(() => { void audioContext.close() }, 700)
  } catch {
    // Audio feedback is a bonus; browsers can block it without affecting learning.
  }
}

const learningHints: Record<string, string> = {
  'r-basics': 'Piensa si quieres guardar un valor, comparar valores o explicar un paso. Son tareas distintas.',
  vectors: 'Revisa el tipo de cada elemento y qué pide el enunciado: texto, números o un valor lógico.',
  tables: 'Distingue filas de columnas. ¿Necesitas conocer la estructura o mirar registros individuales?',
  cleaning: 'Busca primero valores ausentes y duplicados. Decide qué información quieres conservar.',
  filtering: 'Expresa el criterio en palabras y revisa si debe cumplirse una condición o varias.',
  indicators: 'Identifica el numerador, el denominador y la unidad del indicador antes de calcular.',
  plots: 'Elige qué variable va en cada eje y si quieres mostrar grupos, puntos o una tendencia.',
  dates: 'Observa el orden de año, mes y día y si necesitas una fecha o una agrupación semanal.',
  export: 'Revisa el tipo de resultado, la ruta y si el nombre del archivo está escrito como texto.',
}
function getTheoryPages(lesson: (typeof lessons)[number], support: (typeof lessonSupport)[string], challenge: (typeof allChallenges)[number]) {
  return [
    { eyebrow: 'Idea clave', title: lesson.title, body: lesson.theory.why, bullets: support.keyIdeas },
    { eyebrow: 'Lo que podrás hacer', title: lesson.goal, body: lesson.theory.example, bullets: lesson.theory.canDo },
    { eyebrow: 'Paso a paso', title: 'Un script para probar en RStudio', body: support.tips[0], code: support.script },
    { eyebrow: 'Errores frecuentes', title: 'Qué revisar antes de continuar', body: learningHints[lesson.id], bullets: support.tips },
    { eyebrow: 'Aplicación', title: 'Del ejemplo a tus datos', body: lesson.theory.example, bullets: support.keyIdeas.slice(-2) },
    { eyebrow: 'Repasar concepto', title: challenge.concept, body: challenge.explain, code: challenge.code ?? challenge.answer },
  ]
}

function App() {
  const [initial] = useState(() => loadProgress(() => window.localStorage))
  const [state, dispatch] = useReducer(transition, initial.progress)
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  const [savingEnabled, setSavingEnabled] = useState(initial.warning === null)
  const [celebration, setCelebration] = useState<'correct' | 'level' | 'unit' | null>(null)
  const [celebrationTitle, setCelebrationTitle] = useState('')
  const [resetPending, setResetPending] = useState(false)
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [replacementProgress, setReplacementProgress] = useState<typeof state | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [today, setToday] = useState(() => localDay(new Date()))
  const run = activeRun(state)
  const activeId = activeLessonId(state)
  const { phase, selected, showTheory, theoryPageIndex } = run
  const { completedCorrect, xp, streak } = state
  const checked = run.result !== null
  const checkResult = run.result ?? { correct: false }
  const lesson = lessonFor(activeId)
  const lessonIndex = lessons.findIndex((item) => item.id === activeId)
  const lessonChallenges = getLessonChallenges(lesson)
  const currentItem = run.queue[0]
  const challenge = challengeById.get(currentItem?.challengeId) ?? lessonChallenges[0]
  const challengeKey = challenge.id
  const challengeIndex = lessonChallenges.findIndex((item) => item.id === challengeKey)
  const challengeMode = currentMode(run)
  const revealOnWrong = (currentItem?.attempts ?? 0) >= 1
  const support = lessonSupport[lesson.title]
  const theoryPages = getTheoryPages(lesson, support, challenge)
  const theoryPage = theoryPages[theoryPageIndex] ?? theoryPages[0]
  const theoryProgress = ((theoryPageIndex + 1) / theoryPages.length) * 100
  const shuffledChoices = useMemo(() => seededShuffle(challenge.choices, challengeKey), [challenge.choices, challengeKey])
  const isCorrect = checkResult.correct
  const totalChallenges = allChallenges.length
  const progress = completedCorrect.length / totalChallenges * 100
  const lessonScore = Math.round(progress)
  const level = Math.floor(xp / 100) + 1
  const levelProgress = xp % 100
  const unlockedLessonIndex = unlockedIndex(state.completedLessons)
  const todayCount = state.dailyHistory[today]?.length ?? 0
  const calendarStreak = dayStreak(state.dailyHistory, today)
  const dueConcepts = dueReview(state.reviewMetrics, today, lessons.slice(0, unlockedLessonIndex + 1).map((item) => item.id))
  const setSelected = (value: string) => dispatch({ type: 'select', value })
  const setShowTheory = (visible: boolean) => dispatch({ type: 'theory', visible })
  const restart = () => setResetPending(true)

  useEffect(() => {
    if (savingEnabled) setStorageWarning(saveProgress(state, () => window.localStorage))
  }, [state, savingEnabled])
  useEffect(() => {
    const refresh = () => setToday(localDay(new Date()))
    const timer = window.setInterval(refresh, 15000)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  useEffect(() => {
    if (!showTheory) headingRef.current?.focus()
  }, [challengeKey, phase, showTheory])
  useEffect(() => {
    if (!celebration) return
    const timeout = window.setTimeout(() => setCelebration(null), celebration === 'unit' ? 2600 : 1600)
    return () => window.clearTimeout(timeout)
  }, [celebration])

  function checkAnswer() {
    if (checked || !selected.trim() || !currentItem) return
    const result = evaluateAnswer(run)
    dispatch({ type: 'check', day: localDay(new Date()) })
    if (state.sound) playFeedbackSound(result.correct ? 'correct' : 'wrong')
    if (result.correct) {
      const earnsXp = run.kind === 'learn' && !completedCorrect.includes(challengeKey)
      setCelebrationTitle(earnsXp ? '+20 XP' : 'Repaso correcto')
      setCelebration(earnsXp && (xp + 20) % 100 === 0 ? 'level' : 'correct')
    }
  }
  function matchPair(left: string, right: string) {
    const next = transition(state, { type: 'match', left, right })
    dispatch({ type: 'match', left, right })
    if (activeRun(next).phase === 'done' && phase !== 'done') {
      setCelebrationTitle(lesson.title)
      setCelebration('unit')
      if (state.sound) playFeedbackSound('unit')
    }
  }
  function exportProgress() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'r-lingo-progreso.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function prepareImport() {
    try { setReplacementProgress(importProgress(importText)); setImportMessage('Copia válida. Confirma para reemplazar el progreso de este navegador.') }
    catch { setImportMessage('Archivo incompatible o inválido. El progreso actual no cambió.'); setReplacementProgress(null) }
  }

  return (
    <main className="app-shell">
      <a className="skip-link" href="#practice">Ir a la práctica</a>
      {storageWarning && <p className="feedback try-again" role="status">{storageWarning}</p>}
      {resetPending && <section className="feedback try-again" role="alertdialog" aria-modal="false" aria-labelledby="reset-title">
        <h2 id="reset-title">¿Reiniciar todo el curso?</h2>
        <p>Se borrarán los logros de este navegador. Exporta una copia si quieres recuperarlos después.</p>
        <div className="actions"><button className="secondary" onClick={exportProgress} type="button">Exportar antes de reiniciar</button>
          <button className="secondary" onClick={() => setResetPending(false)} type="button">Cancelar</button>
          <button className="primary" onClick={() => { dispatch({ type: 'reset' }); setSavingEnabled(true); setResetPending(false); setCelebration(null) }} type="button">Confirmar reinicio</button></div>
      </section>}
      {celebration && (
        <div className={`celebration ${celebration}`} aria-live="polite">
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i key={index} style={{ '--pop': index } as CSSProperties} />
            ))}
          </div>
          <div className="celebration-card">
            {celebration === 'level' || celebration === 'unit' ? <Trophy size={42} aria-hidden="true" /> : <Sparkles size={42} aria-hidden="true" />}
            <strong>{celebration === 'unit' ? 'Unidad lista!' : celebration === 'level' ? `Nivel ${level}!` : celebrationTitle}</strong>
            <span>
              {celebration === 'unit'
                ? `${celebrationTitle} completada`
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
          <span title="Respuestas correctas consecutivas">
            <Flame size={18} aria-hidden="true" /> {streak} seguidas
          </span>
          <span title="Logro">
            <Trophy size={18} aria-hidden="true" /> {lessonScore}%
          </span>
          <span title="Experiencia">
            <Medal size={18} aria-hidden="true" /> {xp} XP
          </span>
        </div>
      </section>

      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={totalChallenges} aria-valuenow={completedCorrect.length} aria-label="Avance del curso">
        <div style={{ width: `${progress}%` }} />
      </div>

      <section className="reward-strip" aria-label="Progreso de recompensa">
        <div className="level-pill">
          <BadgeCheck size={20} aria-hidden="true" />
          <span>Nivel {level}</span>
        </div>
        <div className="level-track" role="progressbar" aria-label="Avance del nivel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelProgress}>
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
            const complete = state.completedLessons.includes(item.id)
            const locked = index > unlockedLessonIndex
            return (
              <button
                aria-label={locked ? `${item.title}, bloqueada` : item.title}
                className={`lesson-node ${active ? 'active' : ''} ${complete ? 'complete' : ''} ${locked ? 'locked' : ''}`}
                disabled={locked}
                key={item.title}
                onClick={() => dispatch({ type: 'navigate', lessonId: item.id })}
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

        <section className="challenge-panel" id="practice" aria-label="Práctica de R">
          <div className="lesson-meta">
            <span>{lesson.tag}</span>
            <button className="theory-toggle" onClick={() => setShowTheory(!showTheory)} type="button">
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
              <div className="theory-page-track" role="progressbar" aria-valuemin={0} aria-valuemax={theoryPages.length} aria-valuenow={theoryPageIndex + 1} aria-label="Progreso de lectura de la unidad">
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
                        Fuente original (requiere internet)
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
                  <button className="secondary" disabled={theoryPageIndex === 0} onClick={() => dispatch({ type: 'theoryPage', page: theoryPageIndex - 1 })} type="button">
                    Atrás
                  </button>
                  {theoryPageIndex < theoryPages.length - 1 ? (
                    <button className="primary" onClick={() => dispatch({ type: 'theoryPage', page: theoryPageIndex + 1 })} type="button">
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
              <h2 ref={headingRef} tabIndex={-1}>{challenge.prompt}</h2>
              <p className="context">{challenge.context}</p>

              {challenge.code && (
                <pre className="challenge-code">
                  <code>{challenge.code}</code>
                </pre>
              )}

              {challengeMode === 'choice' ? (
                <ChoiceList
                  answer={challenge.answer}
                  revealAnswer={revealOnWrong}
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
                  key={`${challengeKey}-${currentItem?.attempts}`}
                  onChange={(value, tokenIds) => dispatch({ type: 'select', value, tokenIds })}
                  placedIds={run.tokenIds}
                  parts={challenge.tokens.parts}
                  seed={challengeKey}
                />
              ) : (
                <WriteCard
                  checked={checked}
                  correct={isCorrect}
                  disabled={checked}
                  gapTemplate={challenge.gap?.template}
                  hint={revealOnWrong ? checkResult.hint : undefined}
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
                  learningHint={learningHints[lesson.id]}
                  revealExplanation={revealOnWrong}
                  hint={revealOnWrong ? checkResult.hint : undefined}
                  onReviewConcept={() => dispatch({ type: 'theory', visible: true, page: 5 })}
                  revealedAnswer={checked && !isCorrect && revealOnWrong ? (challengeMode === 'gap' ? challenge.gap?.blank : challenge.answer) : undefined}
                />
              )}

              <div className="actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar
                </button>
                {checked ? (
                  <button className="primary" onClick={() => dispatch({ type: 'continue' })} type="button">
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
              <h2 ref={headingRef} tabIndex={-1}>Repaso: {lesson.title}</h2>
              <p className="context">Última prueba antes de cerrar la unidad.</p>
              <MatchBoard
                key={activeId}
                matchedLefts={run.matchedLefts}
                onMatch={matchPair}
                pairs={matchingPairs(activeId)}
                seed={`match-${activeId}`}
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
              <h2 ref={headingRef} tabIndex={-1}>{run.kind === 'review' ? 'Repaso completo' : state.completedLessons.length === lessons.length ? 'Curso completo' : 'Unidad completa'}</h2>
              <p className="context">Ya no quedan preguntas pendientes en esta unidad.</p>
              <div className="feedback good">
                <strong>Buen trabajo.</strong>
                <span>{storageWarning ? 'Exporta una copia para conservar tu progreso.' : 'Tu progreso quedó guardado en este dispositivo.'}</span>
              </div>
              <div className="actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar curso
                </button>
                {state.reviewActive ? <button className="primary" onClick={() => dispatch({ type: 'returnToCourse' })} type="button">Volver al curso</button> : <>
                  <button className="primary" onClick={() => dispatch({ type: 'replay' })} type="button">Practicar de nuevo</button>
                  {lessonIndex < lessons.length - 1 && <button className="primary" onClick={() => dispatch({ type: 'navigate', lessonId: lessons[lessonIndex + 1].id })} type="button">Siguiente unidad</button>}
                </>}
              </div>
            </>
          )}
        </section>

        <aside className="reference-panel" aria-label="Referencia de R para salud pública">
          <div className="daily-goal">
            <Sparkles size={20} aria-hidden="true" />
            <div>
              <strong>Meta de hoy</strong>
              <span>{todayCount} de {state.dailyGoal} ejercicios correctos · {calendarStreak} días de racha</span>
              <span>{todayCount >= state.dailyGoal ? '¡Meta alcanzada!' : 'Cada ejercicio cuenta una vez al día, también durante el repaso.'}</span>
            </div>
          </div>
          <label className="goal-choice">Ejercicios por día <select value={state.dailyGoal} onChange={(event) => dispatch({ type: 'dailyGoal', target: Number(event.target.value) })}>
            {[5, 10, 15].map((target) => <option value={target} key={target}>{target}</option>)}
          </select></label>
          <p className="learning-rules">Practica sin límite. Los errores vuelven a la cola. Un día con una respuesta correcta mantiene la racha diaria según la fecha local.</p>
          {(dueConcepts.length > 0 || state.dailyReview?.run.phase !== 'done' && state.dailyReview !== null) && <button className="secondary" onClick={() => dispatch({ type: 'startReview', day: today })} type="button">{state.dailyReview && state.dailyReview.run.phase !== 'done' ? 'Continuar repaso pendiente' : `Repasar ${dueConcepts.length} conceptos pendientes`}</button>}
          {state.reviewActive && phase !== 'done' && <button className="secondary" onClick={() => dispatch({ type: 'returnToCourse' })} type="button">Volver al curso</button>}
          <details className="concept-progress"><summary>Conceptos para repasar</summary>
            <p>Sesiones de hasta cinco conceptos. Tras acertar en días distintos, el repaso pasa de 1 a 3, 7 y 14 días; un error vuelve a 1 día.</p>
            <ul>{Object.entries(state.reviewMetrics).sort(([, a], [, b]) => b.failures - a.failures).map(([key, metric]) => <li key={key}>
              <strong>{concepts.get(metric.challengeId)!.label}</strong><span>{metric.failures} errores · próximo repaso {metric.dueDay}</span>
            </li>)}</ul>
          </details>
          <h3>Mapa rápido de R</h3>
          <details className="practical-assignment">
            <summary>Práctica independiente en RStudio</summary>
            <p>Usa datos ficticios para crear una tabla y un gráfico. Guarda tu intento antes de abrir la solución.</p>
            <a href="/practica/guia.md" download>Guía y rúbrica</a>
            <a href="/practica/vigilancia.csv" download>Datos de vigilancia (CSV)</a>
            <a href="/practica/poblaciones.csv" download>Poblaciones ficticias (CSV)</a>
            <a href="/practica/inicio.R" download>Script inicial</a>
            <details><summary>Solución: ver después de intentar</summary><a href="/practica/solucion.R" download>Solución comentada</a></details>
          </details>
          <ul>
            <li>
              <code>read.csv()</code>
              <span>Carga un CSV de vigilancia, encuesta o laboratorio como tabla.</span>
              <a href="https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html" rel="noreferrer" target="_blank">
                Fuente (requiere internet)
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>summary()</code>
              <span>Resume rangos, frecuencias y posibles valores raros.</span>
              <a href="https://stat.ethz.ch/R-manual/R-devel/library/base/html/summary.html" rel="noreferrer" target="_blank">
                Fuente (requiere internet)
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>filter()</code>
              <span>Deja solo filas que cumplen criterios, como confirmados o una comuna.</span>
              <a href="https://dplyr.tidyverse.org/reference/filter.html" rel="noreferrer" target="_blank">
                Fuente (requiere internet)
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>ggplot()</code>
              <span>Inicia gráficos para tendencias, grupos o comparación territorial.</span>
              <a href="https://ggplot2.tidyverse.org/reference/ggplot.html" rel="noreferrer" target="_blank">
                Fuente (requiere internet)
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </aside>
      </section>
      <details className="backup-panel">
        <summary>Guardar o recuperar una copia de progreso</summary>
        <label><input type="checkbox" checked={state.sound} onChange={(event) => dispatch({ type: 'sound', enabled: event.target.checked })} /> Sonidos de respuesta</label>
        <button className="secondary" onClick={exportProgress} type="button">Exportar progreso</button>
        <label htmlFor="progress-import">Recuperar desde un archivo de progreso</label>
        <input id="progress-import" type="file" accept="application/json,.json" onChange={async (event) => {
          setReplacementProgress(null)
          setImportMessage('')
          const file = event.target.files?.[0]
          if (!file) { setImportText(''); return }
          try { setImportText(await file.text()) }
          catch { setImportText(''); setImportMessage('No se pudo leer el archivo. El progreso actual no cambió.') }
        }} />
        <button className="secondary" onClick={prepareImport} type="button">Validar copia</button>
        <p role="status">{importMessage}</p>
        {replacementProgress && <button className="primary" onClick={() => { dispatch({ type: 'replace', progress: replacementProgress }); setSavingEnabled(true); setReplacementProgress(null); setImportMessage('Progreso recuperado.'); setCelebration(null) }} type="button">Confirmar reemplazo</button>}
      </details>
    </main>
  )
}

export default App
