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
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react'
import './App.css'

type Challenge = {
  prompt: string
  context: string
  choices: string[]
  answer: string
  explain: string
  concept: string
}

type Lesson = {
  title: string
  tag: string
  goal: string
  theory: {
    why: string
    canDo: string[]
    example: string
    docs: {
      label: string
      url: string
    }[]
  }
  icon: 'play' | 'flask' | 'chart'
  challenges: Challenge[]
}

const lessons: Lesson[] = [
  {
    title: 'Primeros pasos en R',
    tag: 'Unidad 1',
    goal: 'Objetos, comentarios y scripts reproducibles',
    theory: {
      why: 'R sirve para dejar un análisis como una receta clara: cada número, decisión y limpieza queda escrito y se puede volver a correr sin depender de la memoria.',
      canDo: [
        'Guardar valores importantes como población, casos, muestras o umbrales.',
        'Nombrar pasos intermedios para que el análisis se entienda despues.',
        'Agregar comentarios que expliquen por que se tomo una decisión metodológica.',
      ],
      example:
        'En un informe comunal podrias guardar `población <- 125000` y `casos <- 342`, y luego usar esos objetos para calcular incidencia por 100.000 habitantes.',
      docs: [
        {
          label: 'R intro: objetos',
          url: 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Objects',
        },
        {
          label: 'R intro: comandos',
          url: 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html#R-commands_003b-case-sensitivity-etc_002e',
        },
      ],
    },
    icon: 'play',
    challenges: [
      {
        prompt: 'Guarda el valor 42 en un objeto llamado tamaño_muestra.',
        context: 'En investigación conviene guardar números clave para reútilizarlos sin copiarlos a maño.',
        choices: ['tamaño_muestra <- 42', '42 -> tamaño_muestra()', 'tamaño_muestra == 42'],
        answer: 'tamaño_muestra <- 42',
        explain: 'El operador `<-` asigna un valor a un objeto.',
        concept: 'asignación y objetos',
      },
      {
        prompt: 'Cuál línea agrega un comentario en un script de R?',
        context: 'Los comentarios ayudan a explicar decisiónes, por ejemplo por que se excluyo una comuna o un registro.',
        choices: ['# excluir registros sin edad', '// excluir registros sin edad', 'comment(excluir registros sin edad)'],
        answer: '# excluir registros sin edad',
        explain: 'En R, los comentarios empiezan con `#`; R ignora el resto de esa línea.',
        concept: 'comentarios en scripts',
      },
      {
        prompt: 'Cuál nombre de objeto es más claro para guardar casos confirmados?',
        context: 'Los nombres claros hacen que un análisis de salud pública sea auditable.',
        choices: ['casos_confirmados', 'x1', 'datos.final.final2'],
        answer: 'casos_confirmados',
        explain: '`casos_confirmados` comunica que contiene casos confirmados; `x1` no dice nada.',
        concept: 'nombres de objetos',
      },
      {
        prompt: 'Que comando calcula casos por 100.000 habitantes si ya existen casos y población?',
        context: 'Las tasas permiten comparar comunas de distinto tamaño.',
        choices: ['casos / población * 100000', 'casos + población * 100000', 'población / casos'],
        answer: 'casos / población * 100000',
        explain: 'La incidencia divide casos por población y multiplica por una constante, como 100.000.',
        concept: 'calculos con objetos',
      },
    ],
  },
  {
    title: 'Vectores y tipos de datos',
    tag: 'Unidad 2',
    goal: 'Entender números, texto y valores lógicos',
    theory: {
      why: 'Cada columna de datos tiene un tipo. Si edad queda como texto o una fecha queda mal importada, el análisis puede fallar silenciosamente.',
      canDo: [
        'Crear listas simples de edades, comunas, sintomás o resultados de laboratorio.',
        'Distinguir texto, números y verdadero/falso.',
        'Revisar si una variable esta lista para calcular, filtrar o graficar.',
      ],
      example:
        'Una variable `resultado_pcr` podria guardar `positivo` o `negativo`, mientras `edad` deberia ser numerica para calcular promedios por grupo.',
      docs: [
        {
          label: 'R intro: vectores',
          url: 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Simple-manipulations-numbers-and-vectors',
        },
        {
          label: 'class documentation',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/class.html',
        },
      ],
    },
    icon: 'play',
    challenges: [
      {
        prompt: 'Crea un vector con tres edades: 34, 45 y 52.',
        context: 'Los vectores son la base de muchas columnas en R.',
        choices: ['edades <- c(34, 45, 52)', 'edades <- list[34, 45, 52]', 'edades <- 34 + 45 + 52'],
        answer: 'edades <- c(34, 45, 52)',
        explain: '`c()` combina valores en un vector.',
        concept: 'vectores con c()',
      },
      {
        prompt: 'Cuál valor es texto en R?',
        context: 'Comunas, sintomás y categorías suelen guardarse como texto.',
        choices: ['"Santiago"', 'Santiago', 'TRUE'],
        answer: '"Santiago"',
        explain: 'El texto debe ir entre comillas. Sin comillas, R busca un objeto llamado Santiago.',
        concept: 'texto y comillas',
      },
      {
        prompt: 'Que comando revisa el tipo de un objeto llamado edad?',
        context: 'Antes de calcular promedios, conviene confirmar que edad sea numerica.',
        choices: ['class(edad)', 'kind(edad)', 'type = edad'],
        answer: 'class(edad)',
        explain: '`class()` muestra la clase o tipo de un objeto.',
        concept: 'tipos de datos',
      },
      {
        prompt: 'Cuál valor lógico representa verdadero en R?',
        context: 'Los filtros usan condiciones que son verdaderas o falsas para cada fila.',
        choices: ['TRUE', '"TRUE"', 'verdadero()'],
        answer: 'TRUE',
        explain: '`TRUE` es un valor lógico; `"TRUE"` es texto.',
        concept: 'valores lógicos',
      },
    ],
  },
  {
    title: 'Tablas de datos',
    tag: 'Unidad 3',
    goal: 'Cargar, mirar y entender data frames',
    theory: {
      why: 'La mayor parte de la investigación en salud pública vive en tablas: una fila por persona, atencion, muestra, comuna, semana o establecimiento.',
      canDo: [
        'Importar CSV de encuestas, vigilancia, laboratorio o registros administrativos.',
        'Previsualizar columnas antes de confiar en los datos.',
        'Detectar valores perdidos, categorías raras y columnas mal nombradas.',
      ],
      example:
        'Una encuesta de vacunacion podria tener edad, region, comuna, dosis, fecha, sintomás y condicion de riesgo. Un data frame mantiene todo eso junto.',
      docs: [
        {
          label: 'read.csv documentation',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/útils/html/read.table.html',
        },
        {
          label: 'head documentation',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/útils/html/head.html',
        },
      ],
    },
    icon: 'flask',
    challenges: [
      {
        prompt: 'Lee un archivo CSV llamado vigilancia.csv y guardalo como vigilancia.',
        context: 'Muchos datos llegan desde planillas exportadas como CSV.',
        choices: ['vigilancia <- read.csv("vigilancia.csv")', 'vigilancia <- open.csv("vigilancia.csv")', 'read("vigilancia.csv") -> csv'],
        answer: 'vigilancia <- read.csv("vigilancia.csv")',
        explain: '`read.csv()` importa archivos separados por coma como data frames.',
        concept: 'importar CSV',
      },
      {
        prompt: 'Muestra las primeras filas de un data frame llamado vigilancia.',
        context: 'Un vistazo rapido ayuda a encontrar problemás de encabezados o codificacion.',
        choices: ['head(vigilancia)', 'top(vigilancia)', 'vigilancia.first(6)'],
        answer: 'head(vigilancia)',
        explain: '`head()` muestra las primeras filas de un objeto.',
        concept: 'previsualizar datos',
      },
      {
        prompt: 'Que comando muestra los nombres de columnas de casos?',
        context: 'Saber como se llaman las columnas evita errores al filtrar o resumir.',
        choices: ['names(casos)', 'columns(casos)', 'casos.names()'],
        answer: 'names(casos)',
        explain: '`names()` devuelve los nombres de columnas de un data frame.',
        concept: 'nombres de columnas',
      },
      {
        prompt: 'Que comando da un resumen rapido de variables en encuesta?',
        context: 'Sirve para ver rangos, frecuencias y posibles valores extremos.',
        choices: ['summary(encuesta)', 'describe.now(encuesta)', 'quick(encuesta)'],
        answer: 'summary(encuesta)',
        explain: '`summary()` entrega un resumen general de cada variable.',
        concept: 'resumen de variables',
      },
    ],
  },
  {
    title: 'Limpieza inicial',
    tag: 'Unidad 4',
    goal: 'Renombrar, seleccionar y manejar datos faltantes',
    theory: {
      why: 'Antes de analizar, hay que ordenar la tabla. Nombres claros, columnas útiles y valores faltantes bien tratados hacen que el resultado sea defendible.',
      canDo: [
        'Seleccionar solo las variables necesarias para una pregunta.',
        'Renombrar columnas para que el script sea legible.',
        'Identificar `NA` antes de calcular porcentajes o promedios.',
      ],
      example:
        'Si una base trae `F_NAC`, `COM_RES` y `PCR_RES`, puedes renombrarlas como fecha_nacimiento, comuna_residencia y resultado_pcr.',
      docs: [
        {
          label: 'dplyr select',
          url: 'https://dplyr.tidyverse.org/reference/select.html',
        },
        {
          label: 'missing values',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html',
        },
      ],
    },
    icon: 'flask',
    challenges: [
      {
        prompt: 'Con dplyr, que verbo deja solo algunas columnas?',
        context: 'Seleccionar columnas reduce ruido cuando analizas una pregunta concreta.',
        choices: ['select()', 'filter()', 'arrange()'],
        answer: 'select()',
        explain: '`select()` elige columnas; `filter()` elige filas.',
        concept: 'seleccionar columnas',
      },
      {
        prompt: 'Que valor representa dato faltante en R?',
        context: 'En salud pública, una edad o resultado faltante no es cero: es desconocido.',
        choices: ['NA', '0', '"faltante" siempre'],
        answer: 'NA',
        explain: '`NA` representa un valor faltante reconocido por R.',
        concept: 'valores faltantes',
      },
      {
        prompt: 'Que comando cuenta valores faltantes en edad?',
        context: 'Antes de reportar edad promedio, conviene saber cuantas edades faltan.',
        choices: ['sum(is.na(edad))', 'count(edad == NA)', 'missing(edad)'],
        answer: 'sum(is.na(edad))',
        explain: '`is.na()` detecta faltantes y `sum()` cuenta los TRUE.',
        concept: 'contar NA',
      },
      {
        prompt: 'Que verbo de dplyr sirve para crear o modificar una columna?',
        context: 'Podrias crear una columna de grupo etario a partir de edad.',
        choices: ['mutate()', 'select()', 'slice()'],
        answer: 'mutate()',
        explain: '`mutate()` crea o modifica columnas en una tabla.',
        concept: 'crear columnas',
      },
    ],
  },
  {
    title: 'Filtrar casos',
    tag: 'Unidad 5',
    goal: 'Trabajar con subconjuntos de interés',
    theory: {
      why: 'Las preguntas epidemiológicas casi siempre parten por definir a quien incluir: confirmados, mayores de edad, una comuna, un periodo o una condicion.',
      canDo: [
        'Quedarte solo con casos confirmados.',
        'Analizar un periodo especifico, como una semana epidemiológica.',
        'Combinar condiciones para evitar incluir registros que no corresponden.',
      ],
      example:
        'Para revisar un brote, podrias filtrar `resultado == "confirmado"` y `semana_epi >= 12` antes de hacer una curva epidemica.',
      docs: [
        {
          label: 'dplyr filter',
          url: 'https://dplyr.tidyverse.org/reference/filter.html',
        },
        {
          label: 'comparison operators',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/Comparison.html',
        },
      ],
    },
    icon: 'chart',
    challenges: [
      {
        prompt: 'Con dplyr cargado, que expresion mantiene solo edad de 18 o más?',
        context: 'Filtrar por edad es comun al definir poblaciónes de estudio.',
        choices: ['filter(edad >= 18)', 'select(edad >= 18)', 'mutate(edad >= 18)'],
        answer: 'filter(edad >= 18)',
        explain: '`filter()` conserva filas que cumplen una condicion.',
        concept: 'filtrar filas',
      },
      {
        prompt: 'Cuál condicion mantiene solo casos confirmados?',
        context: 'La definicion de caso debe quedar explicita en el código.',
        choices: ['resultado == "confirmado"', 'resultado = "confirmado"', 'resultado <- "confirmado"'],
        answer: 'resultado == "confirmado"',
        explain: '`==` compara; `<-` asigna y `=` no es la forma recomendada para esta condicion.',
        concept: 'comparaciones',
      },
      {
        prompt: 'Que operador significa "y" al combinar condiciones?',
        context: 'Podrias pedir confirmados y residentes de una region.',
        choices: ['&', '|', '%in%'],
        answer: '&',
        explain: '`&` exige que ambas condiciones sean verdaderas.',
        concept: 'condiciones combinadas',
      },
      {
        prompt: 'Que operador sirve para buscar varias comunas posibles?',
        context: 'A veces quieres filtrar Santiago, Maipú y Puente Alto al mismo tiempo.',
        choices: ['comuna %in% c("Santiago", "Maipú", "Puente Alto")', 'comuna == c("Santiago", "Maipú", "Puente Alto")', 'comuna contains comunas'],
        answer: 'comuna %in% c("Santiago", "Maipú", "Puente Alto")',
        explain: '`%in%` revisa si cada valor pertenece a un conjunto de valores.',
        concept: 'pertenencia con %in%',
      },
    ],
  },
  {
    title: 'Resumir indicadores',
    tag: 'Unidad 6',
    goal: 'Contar, agrupar y calcular porcentajes',
    theory: {
      why: 'Los informes no muestran cada fila: resumen patrones. Conteos, tasas y porcentajes ayudan a convertir datos crudos en decisiónes.',
      canDo: [
        'Contar casos por comuna, semana o grupo etario.',
        'Calcular porcentajes de positividad o cobertura.',
        'Comparar grupos con una tabla resumida.',
      ],
      example:
        'Puedes agrupar por comuna y contar casos confirmados para ver donde concentrar busqueda activa o comunicacion de riesgo.',
      docs: [
        {
          label: 'dplyr summarise',
          url: 'https://dplyr.tidyverse.org/reference/summarise.html',
        },
        {
          label: 'dplyr count',
          url: 'https://dplyr.tidyverse.org/reference/count.html',
        },
      ],
    },
    icon: 'chart',
    challenges: [
      {
        prompt: 'Que verbo agrupa una tabla por comuna antes de resumir?',
        context: 'Agrupar permite calcular indicadores por territorio.',
        choices: ['group_by(comuna)', 'split_by(comuna)', 'arrange(comuna)'],
        answer: 'group_by(comuna)',
        explain: '`group_by()` define grupos para operaciones posteriores.',
        concept: 'agrupar datos',
      },
      {
        prompt: 'Que comando cuenta filas por comuna en dplyr?',
        context: 'Un conteo por comuna puede mostrar donde hay más reportes.',
        choices: ['count(comuna)', 'sum(comuna)', 'total(comuna)'],
        answer: 'count(comuna)',
        explain: '`count(comuna)` cuenta cuantas filas hay en cada comuna.',
        concept: 'contar grupos',
      },
      {
        prompt: 'Como calcularias porcentaje de positivos si positivos y total ya existen?',
        context: 'La positividad se expresa normalmente como porcentaje.',
        choices: ['positivos / total * 100', 'positivos + total * 100', 'total / positivos'],
        answer: 'positivos / total * 100',
        explain: 'Un porcentaje divide la parte por el total y multiplica por 100.',
        concept: 'calcular porcentajes',
      },
      {
        prompt: 'Que funcion calcula el promedio de edad ignorando NA?',
        context: 'Los faltantes no deberian romper un resumen si se decide excluirlos.',
        choices: ['mean(edad, na.rm = TRUE)', 'average(edad, remove_na)', 'mean(edad, missing = no)'],
        answer: 'mean(edad, na.rm = TRUE)',
        explain: '`na.rm = TRUE` le pide a `mean()` ignorar valores faltantes.',
        concept: 'promedios con NA',
      },
    ],
  },
  {
    title: 'Visualizar datos',
    tag: 'Unidad 7',
    goal: 'Crear gráficos simples con ggplot2',
    theory: {
      why: 'Un grafico bien hecho ayuda a ver patrones que una tabla esconde: aumentos, grupos de riesgo, diferencias territoriales o errores de datos.',
      canDo: [
        'Graficar puntos para explorar relaciones.',
        'Usar barras para comparar categorías.',
        'Dibujar líneas para mirar evolucion temporal.',
      ],
      example:
        'Una curva de casos por semana epidemiológica puede mostrar si un brote esta creciendo, llegando a peak o bajando.',
      docs: [
        {
          label: 'ggplot2 basics',
          url: 'https://ggplot2.tidyverse.org/reference/ggplot.html',
        },
        {
          label: 'geom_col',
          url: 'https://ggplot2.tidyverse.org/reference/geom_bar.html',
        },
      ],
    },
    icon: 'chart',
    challenges: [
      {
        prompt: 'Que funcion inicia un grafico con ggplot2?',
        context: 'ggplot define los datos y mapeos visuales antes de agregar capas.',
        choices: ['ggplot()', 'plotly_start()', 'make_chart()'],
        answer: 'ggplot()',
        explain: '`ggplot()` inicia un grafico de ggplot2.',
        concept: 'iniciar ggplot',
      },
      {
        prompt: 'Que capa agrega puntos a un grafico?',
        context: 'Los puntos sirven para explorar relacion entre dos variables.',
        choices: ['geom_point()', 'geom_table()', 'plot_points()'],
        answer: 'geom_point()',
        explain: '`geom_point()` dibuja un punto por observacion.',
        concept: 'gráficos de puntos',
      },
      {
        prompt: 'Que capa sirve para una barra por categoría ya resumida?',
        context: 'Si ya tienes casos por comuna, una barra por comuna es directa.',
        choices: ['geom_col()', 'geom_point()', 'geom_box()'],
        answer: 'geom_col()',
        explain: '`geom_col()` usa valores ya calculados para la altura de barras.',
        concept: 'gráficos de barras',
      },
      {
        prompt: 'Que estetica suele ir en el eje x de una curva epidemica?',
        context: 'Una curva epidemica ordena casos en el tiempo.',
        choices: ['semana_epi', 'nombre_paciente', 'id_registro'],
        answer: 'semana_epi',
        explain: 'La semana epidemiológica permite ver evolucion temporal de casos.',
        concept: 'series temporales simples',
      },
    ],
  },
  {
    title: 'Fechas y semanas',
    tag: 'Unidad 8',
    goal: 'Trabajar con fechas de vigilancia',
    theory: {
      why: 'En salud pública, el tiempo importa mucho: fecha de inicio de sintomás, toma de muestra, consulta, notificación y cierre pueden contar historias distintas.',
      canDo: [
        'Convertir texto a fecha para ordenar eventos.',
        'Calcular diferencias entre fechas.',
        'Crear variables de semana o mes para reportes.',
      ],
      example:
        'Si `fecha_inicio` y `fecha_consulta` son fechas, puedes calcular cuantos días demoraron las personas en consultar.',
      docs: [
        {
          label: 'as.Date documentation',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/as.Date.html',
        },
        {
          label: 'lubridate',
          url: 'https://lubridate.tidyverse.org/',
        },
      ],
    },
    icon: 'flask',
    challenges: [
      {
        prompt: 'Que funcion base convierte texto a fecha?',
        context: 'Importar fechas como texto impide ordenar bien una línea de tiempo.',
        choices: ['as.Date()', 'toCalendar()', 'date_text()'],
        answer: 'as.Date()',
        explain: '`as.Date()` convierte valores compatibles a fechas.',
        concept: 'convertir fechas',
      },
      {
        prompt: 'Si usas lubridate, que funcion lee una fecha como "2026-07-02"?',
        context: 'El formato año-mes-día es comun en bases exportadas.',
        choices: ['ymd("2026-07-02")', 'dmy("2026-07-02")', 'mdy("2026-07-02")'],
        answer: 'ymd("2026-07-02")',
        explain: '`ymd()` lee fechas en orden año, mes y día.',
        concept: 'leer fechas con lubridate',
      },
      {
        prompt: 'Que resta calcula días entre consulta e inicio?',
        context: 'La demora de consulta puede orientar intervenciones de comunicacion.',
        choices: ['fecha_consulta - fecha_inicio', 'fecha_inicio + fecha_consulta', 'días(fecha_consulta, fecha_inicio)'],
        answer: 'fecha_consulta - fecha_inicio',
        explain: 'Restar fechas entrega la diferencia de tiempo entre ambas.',
        concept: 'diferencia entre fechas',
      },
      {
        prompt: 'Para reportes mensuales, que variable seria más útil?',
        context: 'Agrupar por mes permite preparar tableros y reportes periódicos.',
        choices: ['mes_notificación', 'rut', 'observacion_libre'],
        answer: 'mes_notificación',
        explain: 'Una variable de mes permite agrupar y resumir eventos en el tiempo.',
        concept: 'periodos de reporte',
      },
    ],
  },
  {
    title: 'Exportar resultados',
    tag: 'Unidad 9',
    goal: 'Guardar tablas y compartir evidencia',
    theory: {
      why: 'Un análisis no termina al obtener un número. Hay que guardar salidas reproducibles para informes, revision tecnica o trabajo con equipos.',
      canDo: [
        'Exportar tablas limpias o resumidas.',
        'Guardar figuras para insertar en informes.',
        'Mantener un rastro entre datos de entrada, código y resultados.',
      ],
      example:
        'Tras resumir cobertura de vacunacion por comuna, puedes guardar una tabla CSV para revision del equipo territorial.',
      docs: [
        {
          label: 'write.csv documentation',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/útils/html/write.table.html',
        },
        {
          label: 'ggsave documentation',
          url: 'https://ggplot2.tidyverse.org/reference/ggsave.html',
        },
      ],
    },
    icon: 'play',
    challenges: [
      {
        prompt: 'Que comando guarda una tabla resumen como CSV?',
        context: 'Exportar permite compartir resultados con otras personas del equipo.',
        choices: ['write.csv(resumen, "resumen.csv")', 'save.table(resumen, "resumen.csv")', 'export(resumen)'],
        answer: 'write.csv(resumen, "resumen.csv")',
        explain: '`write.csv()` escribe un data frame en un archivo CSV.',
        concept: 'exportar CSV',
      },
      {
        prompt: 'Que funcion de ggplot2 guarda un grafico en archivo?',
        context: 'Los gráficos suelen ir a informes o presentaciones.',
        choices: ['ggsave("curva.png")', 'save_plot_now("curva.png")', 'plot_export("curva.png")'],
        answer: 'ggsave("curva.png")',
        explain: '`ggsave()` guarda el ultimo grafico o uno indicado.',
        concept: 'guardar gráficos',
      },
      {
        prompt: 'Que nombre de archivo es más claro para una tabla de casos por comuna?',
        context: 'Los nombres ordenados evitan confundir versiones.',
        choices: ['casos_por_comuna_2026.csv', 'final_final.csv', 'tabla.csv'],
        answer: 'casos_por_comuna_2026.csv',
        explain: 'Un buen nombre dice que contiene la salida y a que periodo corresponde.',
        concept: 'nombrar salidas',
      },
      {
        prompt: 'Que conviene guardar junto a los resultados?',
        context: 'La reproducibilidad permite explicar como se obtuvo cada número.',
        choices: ['El script usado para generar la salida', 'Solo una captura de pantalla', 'Nada, si el resultado se ve bien'],
        answer: 'El script usado para generar la salida',
        explain: 'El script deja evidencia de los pasos usados para producir la salida.',
        concept: 'reproducibilidad',
      },
    ],
  },
]

const iconMap = {
  play: Play,
  flask: FlaskConical,
  chart: BarChart3,
}

type StoredProgress = {
  lessonIndex: number
  challengeIndex: number
  hearts: number
  streak: number
  completedCorrect: string[]
  xp: number
}

const progressStorageKey = 'r-lingo-progress-v2'

function getChallengeKey(lessonPosition: number, challengePosition: number) {
  return `${lessonPosition}-${challengePosition}`
}

function getFreshProgress(): StoredProgress {
  return { lessonIndex: 0, challengeIndex: 0, hearts: 5, streak: 0, completedCorrect: [], xp: 0 }
}

function readStoredProgress(): StoredProgress {
  if (typeof window === 'undefined') return getFreshProgress()

  try {
    const stored = window.localStorage.getItem(progressStorageKey)
    if (!stored) return getFreshProgress()

    const parsed = JSON.parse(stored) as Partial<StoredProgress>
    const safeLessonIndex = Math.min(Math.max(parsed.lessonIndex ?? 0, 0), lessons.length - 1)
    const completedCorrect = Array.isArray(parsed.completedCorrect) ? parsed.completedCorrect : []

    return {
      lessonIndex: safeLessonIndex,
      challengeIndex: Math.min(Math.max(parsed.challengeIndex ?? 0, 0), lessons[safeLessonIndex].challenges.length - 1),
      hearts: Math.min(Math.max(parsed.hearts ?? 5, 0), 5),
      streak: Math.max(parsed.streak ?? 0, 0),
      completedCorrect,
      xp: Math.max(parsed.xp ?? completedCorrect.length * 20, 0),
    }
  } catch {
    return getFreshProgress()
  }
}

function App() {
  const [storedProgress, setStoredProgress] = useState(readStoredProgress)
  const [lessonIndex, setLessonIndex] = useState(storedProgress.lessonIndex)
  const [challengeIndex, setChallengeIndex] = useState(storedProgress.challengeIndex)
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState(false)
  const [completedCorrect, setCompletedCorrect] = useState(storedProgress.completedCorrect)
  const [hearts, setHearts] = useState(storedProgress.hearts)
  const [streak, setStreak] = useState(storedProgress.streak)
  const [xp, setXp] = useState(storedProgress.xp)
  const [celebration, setCelebration] = useState<'correct' | 'level' | null>(null)
  const [showTheory, setShowTheory] = useState(true)

  const lesson = lessons[lessonIndex]
  const challenge = lesson.challenges[challengeIndex]
  const isCorrect = selected === challenge.answer
  const isLastChallenge = lessonIndex === lessons.length - 1 && challengeIndex === lesson.challenges.length - 1
  const challengeKey = getChallengeKey(lessonIndex, challengeIndex)
  const totalChallenges = lessons.reduce((sum, item) => sum + item.challenges.length, 0)
  const completedBefore = lessons.slice(0, lessonIndex).reduce((sum, item) => sum + item.challenges.length, 0)
  const progress = ((completedBefore + challengeIndex + Number(completedCorrect.includes(challengeKey))) / totalChallenges) * 100
  const level = Math.floor(xp / 100) + 1
  const levelProgress = xp % 100

  const lessonScore = useMemo(() => {
    return Math.round((completedCorrect.length / totalChallenges) * 100)
  }, [completedCorrect.length, totalChallenges])

  useEffect(() => {
    setStoredProgress({ lessonIndex, challengeIndex, hearts, streak, completedCorrect, xp })
  }, [lessonIndex, challengeIndex, hearts, streak, completedCorrect, xp])

  useEffect(() => {
    window.localStorage.setItem(progressStorageKey, JSON.stringify(storedProgress))
  }, [storedProgress])

  useEffect(() => {
    if (!celebration) return
    const timeout = window.setTimeout(() => setCelebration(null), 1600)
    return () => window.clearTimeout(timeout)
  }, [celebration])

  function checkAnswer() {
    if (!selected) return
    setChecked(true)
    if (selected === challenge.answer) {
      const isNewCompletion = !completedCorrect.includes(challengeKey)
      setCompletedCorrect((completed) => {
        if (completed.includes(challengeKey)) return completed
        return [...completed, challengeKey]
      })
      setStreak((count) => count + 1)
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
      setHearts((count) => Math.max(0, count - 1))
      setStreak(0)
    }
  }

  function nextChallenge() {
    const hasNextChallenge = challengeIndex < lesson.challenges.length - 1
    const hasNextLesson = lessonIndex < lessons.length - 1

    if (hasNextChallenge) {
      setChallengeIndex((index) => index + 1)
    } else if (hasNextLesson) {
      setLessonIndex((index) => index + 1)
      setChallengeIndex(0)
      setShowTheory(true)
    }

    setSelected('')
    setChecked(false)
  }

  function restart() {
    setLessonIndex(0)
    setChallengeIndex(0)
    setSelected('')
    setChecked(false)
    setCompletedCorrect([])
    setHearts(5)
    setStreak(0)
    setXp(0)
    setCelebration(null)
    setShowTheory(true)
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
            {celebration === 'level' ? <Trophy size={42} aria-hidden="true" /> : <Sparkles size={42} aria-hidden="true" />}
            <strong>{celebration === 'level' ? `Nivel ${level}!` : '+20 XP'}</strong>
            <span>{celebration === 'level' ? 'Nuevo nivel de análisis desbloqueado.' : streak > 1 ? `Racha de ${streak}` : 'Respuesta correcta'}</span>
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
        <strong>{100 - levelProgress} XP para el siguiente nivel</strong>
      </section>

      <section className="learning-grid">
        <aside className="lesson-path" aria-label="Unidades">
          {lessons.map((item, index) => {
            const Icon = iconMap[item.icon]
            const active = index === lessonIndex
            const complete = index < lessonIndex
            return (
              <button
                className={`lesson-node ${active ? 'active' : ''} ${complete ? 'complete' : ''}`}
                key={item.title}
                onClick={() => {
                  setLessonIndex(index)
                  setChallengeIndex(0)
                  setSelected('')
                  setChecked(false)
                  setShowTheory(true)
                }}
                type="button"
              >
                <span className="lesson-icon">
                  {complete ? <Check size={20} aria-hidden="true" /> : <Icon size={20} aria-hidden="true" />}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.goal}</small>
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
              <p className="eyebrow mini">Unidad</p>
              <h2>{lesson.title}</h2>
              <p className="context">{lesson.theory.why}</p>
              <h3>Qué puedes hacer con esto</h3>
              <ul>
                {lesson.theory.canDo.map((item) => (
                  <li key={item}>
                    <Check size={18} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="public-health-example">
                <strong>Ejemplo en salud pública</strong>
                <span>{lesson.theory.example}</span>
              </div>
              <div className="documentation-links" aria-label={`Documentación de ${lesson.title}`}>
                <strong>Documentación útil</strong>
                <div>
                  {lesson.theory.docs.map((doc) => (
                    <a href={doc.url} key={doc.url} rel="noreferrer" target="_blank">
                      {doc.label}
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="actions theory-actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar
                </button>
                <button className="primary" onClick={() => setShowTheory(false)} type="button">
                  Empezar práctica
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </article>
          ) : (
            <>
              <div className="question-count">
                {challengeIndex + 1} de {lesson.challenges.length}
              </div>
              <h2>{challenge.prompt}</h2>
              <p className="context">{challenge.context}</p>

              <div className="choice-list">
                {challenge.choices.map((choice) => {
                  const chosen = selected === choice
                  const revealCorrect = checked && choice === challenge.answer
                  const revealWrong = checked && chosen && choice !== challenge.answer
                  return (
                    <button
                      className={`choice ${chosen ? 'chosen' : ''} ${revealCorrect ? 'correct' : ''} ${
                        revealWrong ? 'wrong' : ''
                      }`}
                      disabled={checked}
                      key={choice}
                      onClick={() => setSelected(choice)}
                      type="button"
                    >
                      <code>{choice}</code>
                    </button>
                  )
                })}
              </div>

              {checked && (
                <div className={`feedback ${isCorrect ? 'good' : 'try-again'}`}>
                  <strong>{isCorrect ? 'Bien ahí. Tu racha de análisis sigue viva.' : 'Casi, pero no es esta.'}</strong>
                  <span>{challenge.explain}</span>
                  <button className="concept-link" onClick={() => setShowTheory(true)} type="button">
                    <BookOpen size={16} aria-hidden="true" />
                    Repasar {challenge.concept} en esta unidad
                  </button>
                </div>
              )}

              <div className="actions">
                <button className="secondary" onClick={restart} type="button">
                  <RotateCcw size={18} aria-hidden="true" />
                  Reiniciar
                </button>
                {checked ? (
                  <button className="primary" onClick={isLastChallenge ? restart : nextChallenge} type="button">
                    {isLastChallenge ? 'Reiniciar curso' : 'Continuar'}
                    {isLastChallenge ? <RotateCcw size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                  </button>
                ) : (
                  <button className="primary" disabled={!selected} onClick={checkAnswer} type="button">
                    Revisar
                    <Check size={18} aria-hidden="true" />
                  </button>
                )}
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
          <h3>Mapa rapido de R</h3>
          <ul>
            <li>
              <code>read.csv()</code>
              <a href="https://stat.ethz.ch/R-manual/R-devel/library/útils/html/read.table.html" rel="noreferrer" target="_blank">
                Cargar datos
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>summary()</code>
              <a href="https://stat.ethz.ch/R-manual/R-devel/library/base/html/summary.html" rel="noreferrer" target="_blank">
                Revisar variables
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>filter()</code>
              <a href="https://dplyr.tidyverse.org/reference/filter.html" rel="noreferrer" target="_blank">
                Filtrar filas
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <code>ggplot()</code>
              <a href="https://ggplot2.tidyverse.org/reference/ggplot.html" rel="noreferrer" target="_blank">
                Hacer gráficos
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
