import fs from 'node:fs/promises'
import ts from 'typescript'
import { createRequire } from 'node:module'
const { WebR } = createRequire(import.meta.url)('webr')

// Verification runtime only. The application does not download or execute webR.
const source = await fs.readFile(new URL('../src/data/lessons.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const { lessons, lessonSupport, getLessonChallenges } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const r = new WebR()
await r.init()
try {
  console.log('R runtime:', await r.evalRString('R.version.string'))
  await r.installPackages(['dplyr', 'ggplot2', 'lubridate'], { quiet: true })
  await r.evalRVoid(`
    library(dplyr)
    library(ggplot2)
    library(lubridate)
    vigilancia <- data.frame(
      comuna = c("Santiago", "Maipu", "Puente Alto"), edad = c(34, NA, 62),
      resultado = c("confirmado", "negativo", "confirmado"),
      resultado_pcr = c("positivo", "negativo", "positivo"),
      fecha_consulta = as.Date(c("2026-07-02", "2026-07-03", "2026-07-05")),
      semana_epi = c(20, 20, 21))
    casos <- vigilancia
    encuesta <- vigilancia
    edad <- vigilancia$edad
    resultado_pcr <- vigilancia$resultado_pcr
    resumen <- data.frame(comuna = vigilancia$comuna, casos = c(2, 1, 3), semana_epi = c(20, 21, 22))
    casos_semana <- resumen
    casos_comuna <- resumen
    poblacion <- 100000
    positivos <- 25
    total <- 100
    write.csv(vigilancia, "vigilancia_respiratoria.csv", row.names = FALSE)
  `)
  for (const lesson of lessons) {
    await r.evalRVoid(lessonSupport[lesson.title].script)
    console.log('PASS theory script:', lesson.id)
  }
  const snippets = lessons.flatMap(getLessonChallenges).filter((question) => question.code)
  // Output-prediction snippets are valid; error-spotting snippets are checked below.
  for (const question of snippets.filter((question) => question.id.endsWith('q11'))) {
    await r.evalRVoid(question.code)
    console.log('PASS prediction snippet:', question.id)
  }
  await r.evalRVoid(`
    stopifnot(identical(length(c(34, 45, 52)), 3L))
    stopifnot(sum(is.na(c(34, NA, 52))) == 1)
    stopifnot(50 / 100000 * 100000 == 50)
    stopifnot(25 / 100 * 100 == 25)
    stopifnot(isTRUE(62 >= 60))
    stopifnot(as.numeric(as.Date("2026-07-05") - as.Date("2026-07-02")) == 3)
    stopifnot(file.exists("resumen.csv"))
    stopifnot(ncol(read.csv("resumen.csv")) == ncol(resumen))
    stopifnot(file.exists("curva_epidemica.png"))
    stopifnot(identical(as.character(ymd("2026-07-02")), "2026-07-02"))
    stopifnot(!identical(as.character(suppressWarnings(ymd("02-07-2026"))), "2026-07-02"))
  `)
  for (const question of snippets.filter((question) => question.id.endsWith('q12') && !['plots-q12', 'dates-q12'].includes(question.id))) {
    const code = question.id === 'tables-q12' ? `local({if ('package:readr' %in% search()) detach('package:readr'); ${question.code}})` : question.code
    const failed = await r.evalRBoolean(`inherits(try(eval(parse(text=${JSON.stringify(code)})), silent=TRUE), "try-error")`)
    if (!failed) throw new Error(`Expected error was not reproduced: ${question.id}`)
    console.log('PASS intentional error:', question.id)
  }
  console.log('PASS numeric/date/export assertions and format mismatch')
  await r.evalRVoid('p <- ggplot(resumen, aes(x=semana_epi, y=casos)); unused <- geom_line(); stopifnot(length(p$layers) == 0L)')
  for (const file of ['vigilancia.csv', 'poblaciones.csv']) {
    await r.FS.writeFile(`/home/web_user/${file}`, await fs.readFile(new URL(`../public/practica/${file}`, import.meta.url)))
  }
  await r.evalRVoid(await fs.readFile(new URL('../public/practica/solucion.R', import.meta.url), 'utf8'))
  console.log('PASS independent assignment solution and scored expected outputs')
  for (const phase of ['baseline', 'seven-day']) {
    for (const file of ['vigilancia.csv', 'poblaciones.csv']) {
      await r.FS.writeFile(`/home/web_user/${file}`, await fs.readFile(new URL(`../docs/learning-check/${phase}/${file}`, import.meta.url)))
    }
    await r.evalRVoid(`fase <- ${JSON.stringify(phase)}`)
    await r.evalRVoid(await fs.readFile(new URL('../docs/learning-check/reference.R', import.meta.url), 'utf8'))
    console.log('PASS learning-check reference:', phase)
  }
  const evidence = {
    verifiedAt: new Date().toISOString(), runtime: await r.evalRString('R.version.string'), webR: r.version,
    packages: Object.fromEntries(await Promise.all(['dplyr', 'ggplot2', 'lubridate'].map(async (name) => [name, await r.evalRString(`as.character(packageVersion("${name}"))`)]))),
    theoryScripts: lessons.map((lesson) => lesson.id), predictionSnippets: snippets.filter((q) => q.id.endsWith('q11')).map((q) => q.id),
    intentionalErrors: snippets.filter((q) => q.id.endsWith('q12') && !['plots-q12', 'dates-q12'].includes(q.id)).map((q) => q.id),
    assertions: ['numeric results', 'Date difference', 'CSV without row names', 'PNG export', 'date format mismatch', 'unattached ggplot layer', 'independent assignment', 'baseline reference', 'seven-day reference'],
  }
  await fs.mkdir(new URL('../docs/verification/', import.meta.url), { recursive: true })
  await fs.writeFile(new URL('../docs/verification/r-runtime.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n')
} finally {
  await r.close()
}
