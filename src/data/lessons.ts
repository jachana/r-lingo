export type MatchPair = { left: string; right: string }

export type Challenge = {
  prompt: string
  context: string
  code?: string
  choices: string[]
  answer: string
  acceptedAnswers?: string[]
  gap?: { template: string; blank: string; acceptedBlanks?: string[] }
  tokens?: { parts: string[]; distractors: string[] }
  explain: string
  concept: string
}

export type Lesson = {
  title: string
  tag: string
  goal: string
  theory: {
    why: string
    canDo: string[]
    example: string
    docs: {
      label: string
      summary: string
      url: string
    }[]
  }
  icon: 'play' | 'flask' | 'chart'
  challenges: Challenge[]
  matchPairs?: MatchPair[]
}

export const lessons: Lesson[] = [
  {
    title: 'Primeros pasos en R',
    tag: 'Unidad 1',
    goal: 'Objetos, comentarios y scripts reproducibles',
    theory: {
      why: 'R sirve para dejar un análisis como una receta clara: cada número, decisión y limpieza queda escrito y se puede volver a correr sin depender de la memoria.',
      canDo: [
        'Guardar valores importantes como población, casos, muestras o umbrales.',
        'Nombrar pasos intermedios para que el análisis se entienda después.',
        'Agregar comentarios que expliquen por qué se tomó una decisión metodológica.',
      ],
      example:
        'En un informe comunal podrías guardar `poblacion <- 125000` y `casos_confirmados <- 342`, y luego calcular incidencia por 100.000 habitantes para comparar comunas.',
      docs: [
        {
          label: 'R intro: objetos',
          summary: 'Un objeto es un nombre que guarda un valor, una tabla o un resultado para reutilizarlo más adelante.',
          url: 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Objects',
        },
        {
          label: 'R intro: comandos',
          summary: 'Un script es una secuencia de comandos. Permite repetir el análisis y revisar cada paso.',
          url: 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html#R-commands_003b-case-sensitivity-etc_002e',
        },
      ],
    },
    icon: 'play',
    challenges: [
      {
        prompt: 'Guarda el valor 42 en un objeto llamado tamano_muestra.',
        context: 'En investigación conviene guardar números clave para reutilizarlos sin copiarlos a mano.',
        choices: ['tamano_muestra <- 42', '42 -> tamano_muestra()', 'tamano_muestra == 42'],
        answer: 'tamano_muestra <- 42',
        acceptedAnswers: ['tamano_muestra = 42', '42 -> tamano_muestra'],
        gap: { template: 'tamano_muestra ____ 42', blank: '<-' },
        tokens: { parts: ['tamano_muestra', '<-', '42'], distractors: ['==', 'c('] },
        explain: 'El operador `<-` asigna un valor a un objeto.',
        concept: 'asignación y objetos',
      },
      {
        prompt: 'Cuál línea agrega un comentario en un script de R?',
        context: 'Los comentarios ayudan a explicar decisiones, por ejemplo por qué se excluyó una comuna o un registro.',
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
        prompt: 'Qué comando calcula casos por 100.000 habitantes si ya existen casos y población?',
        context: 'Las tasas permiten comparar comunas de distinto tamaño.',
        choices: ['casos / poblacion * 100000', 'casos + poblacion * 100000', 'poblacion / casos'],
        answer: 'casos / poblacion * 100000',
        gap: { template: 'casos / poblacion ____ 100000', blank: '*' },
        tokens: { parts: ['casos', '/', 'poblacion', '*', '100000'], distractors: ['+', 'casos_confirmados'] },
        explain: 'La incidencia divide casos por población y multiplica por una constante, como 100.000.',
        concept: 'cálculos con objetos',
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
        'Crear listas simples de edades, comunas, síntomas o resultados de laboratorio.',
        'Distinguir texto, números y verdadero/falso.',
        'Revisar si una variable está lista para calcular, filtrar o graficar.',
      ],
      example:
        'Una variable `resultado_pcr` podría guardar `positivo` o `negativo`, mientras `edad` debería ser numérica para comparar promedios entre grupos de riesgo.',
      docs: [
        {
          label: 'R intro: vectores',
          summary: 'Un vector junta valores del mismo tipo, como edades, comunas, resultados de test o semanas.',
          url: 'https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Simple-manipulations-numbers-and-vectors',
        },
        {
          label: 'class documentation',
          summary: '`class()` ayuda a verificar si una variable es numérica, texto, fecha u otro tipo antes de analizar.',
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
        acceptedAnswers: ['edades = c(34, 45, 52)'],
        gap: { template: 'edades <- ____(34, 45, 52)', blank: 'c' },
        tokens: { parts: ['edades', '<-', 'c(', '34,', '45,', '52', ')'], distractors: ['list(', 'sum('] },
        explain: '`c()` combina valores en un vector.',
        concept: 'vectores con c()',
      },
      {
        prompt: 'Cuál valor es texto en R?',
        context: 'Comunas, síntomas y categorías suelen guardarse como texto.',
        choices: ['"Santiago"', 'Santiago', 'TRUE'],
        answer: '"Santiago"',
        explain: 'El texto debe ir entre comillas. Sin comillas, R busca un objeto llamado Santiago.',
        concept: 'texto y comillas',
      },
      {
        prompt: 'Qué comando revisa el tipo de un objeto llamado edad?',
        context: 'Antes de calcular promedios, conviene confirmar que edad sea numérica.',
        choices: ['class(edad)', 'kind(edad)', 'type = edad'],
        answer: 'class(edad)',
        gap: { template: '____(edad)', blank: 'class' },
        tokens: { parts: ['class(', 'edad', ')'], distractors: ['kind(', 'typeof ='] },
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
      why: 'La mayor parte de la investigación en salud pública vive en tablas: una fila por persona, atención, muestra, comuna, semana o establecimiento.',
      canDo: [
        'Importar CSV de encuestas, vigilancia, laboratorio o registros administrativos.',
        'Previsualizar columnas antes de confiar en los datos.',
        'Detectar valores perdidos, categorías raras y columnas mal nombradas.',
      ],
      example:
        'Una encuesta de vacunación podría tener edad, región, comuna, dosis, fecha, síntomas y condición de riesgo. Un data frame mantiene todo eso junto.',
      docs: [
        {
          label: 'read.csv documentation',
          summary: '`read.csv()` carga archivos CSV como tablas para trabajar con encuestas, vigilancia o laboratorio.',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html',
        },
        {
          label: 'head documentation',
          summary: '`head()` muestra las primeras filas para revisar si la importación quedó razonable.',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/utils/html/head.html',
        },
      ],
    },
    icon: 'flask',
    challenges: [
      {
        prompt: 'Lee un archivo CSV llamado vigilancia_respiratoria.csv y guárdalo como vigilancia.',
        context: 'Muchos datos de vigilancia respiratoria llegan desde planillas exportadas como CSV.',
        choices: ['vigilancia <- read.csv("vigilancia_respiratoria.csv")', 'vigilancia <- open.csv("vigilancia_respiratoria.csv")', 'read("vigilancia_respiratoria.csv") -> csv'],
        answer: 'vigilancia <- read.csv("vigilancia_respiratoria.csv")',
        acceptedAnswers: ['vigilancia = read.csv("vigilancia_respiratoria.csv")'],
        gap: { template: 'vigilancia <- ____("vigilancia_respiratoria.csv")', blank: 'read.csv' },
        tokens: {
          parts: ['vigilancia', '<-', 'read.csv(', '"vigilancia_respiratoria.csv"', ')'],
          distractors: ['open.csv(', 'read('],
        },
        explain: '`read.csv()` importa archivos separados por coma como data frames.',
        concept: 'importar CSV',
      },
      {
        prompt: 'Muestra las primeras filas de un data frame llamado vigilancia.',
        context: 'Un vistazo rápido ayuda a encontrar problemas de encabezados o codificación.',
        choices: ['head(vigilancia)', 'top(vigilancia)', 'vigilancia.first(6)'],
        answer: 'head(vigilancia)',
        gap: { template: '____(vigilancia)', blank: 'head' },
        explain: '`head()` muestra las primeras filas de un objeto.',
        concept: 'previsualizar datos',
      },
      {
        prompt: 'Qué comando muestra los nombres de columnas de casos?',
        context: 'Saber cómo se llaman las columnas evita errores al filtrar o resumir.',
        choices: ['names(casos)', 'columns(casos)', 'casos.names()'],
        answer: 'names(casos)',
        gap: { template: '____(casos)', blank: 'names' },
        explain: '`names()` devuelve los nombres de columnas de un data frame.',
        concept: 'nombres de columnas',
      },
      {
        prompt: 'Qué comando da un resumen rápido de variables en encuesta?',
        context: 'Sirve para ver rangos, frecuencias y posibles valores extremos.',
        choices: ['summary(encuesta)', 'describe.now(encuesta)', 'quick(encuesta)'],
        answer: 'summary(encuesta)',
        gap: { template: '____(encuesta)', blank: 'summary' },
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
          summary: '`select()` deja solo las columnas necesarias para una pregunta o informe.',
          url: 'https://dplyr.tidyverse.org/reference/select.html',
        },
        {
          label: 'missing values',
          summary: '`NA` representa datos faltantes. Conviene contarlos antes de calcular indicadores.',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html',
        },
      ],
    },
    icon: 'flask',
    challenges: [
      {
        prompt: 'Con dplyr, qué verbo deja solo algunas columnas?',
        context: 'Seleccionar columnas reduce ruido cuando analizas una pregunta concreta.',
        choices: ['select()', 'filter()', 'arrange()'],
        answer: 'select()',
        explain: '`select()` elige columnas; `filter()` elige filas.',
        concept: 'seleccionar columnas',
      },
      {
        prompt: 'Qué valor representa dato faltante en R?',
        context: 'En salud pública, una edad o resultado faltante no es cero: es desconocido.',
        choices: ['NA', '0', '"faltante" siempre'],
        answer: 'NA',
        explain: '`NA` representa un valor faltante reconocido por R.',
        concept: 'valores faltantes',
      },
      {
        prompt: 'Qué comando cuenta valores faltantes en edad?',
        context: 'Antes de reportar edad promedio, conviene saber cuantas edades faltan.',
        choices: ['sum(is.na(edad))', 'count(edad == NA)', 'missing(edad)'],
        answer: 'sum(is.na(edad))',
        gap: { template: 'sum(____(edad))', blank: 'is.na' },
        tokens: { parts: ['sum(', 'is.na(', 'edad', ')', ')'], distractors: ['count(', '== NA'] },
        explain: '`is.na()` detecta faltantes y `sum()` cuenta los TRUE.',
        concept: 'contar NA',
      },
      {
        prompt: 'Qué verbo de dplyr sirve para crear o modificar una columna?',
        context: 'Podrías crear una columna de grupo etario a partir de edad para reportar riesgo por tramo.',
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
      why: 'Las preguntas epidemiológicas casi siempre parten por definir a quién incluir: confirmados, mayores de edad, una comuna, un periodo o una condición.',
      canDo: [
        'Quedarte solo con casos confirmados.',
        'Analizar un periodo específico, como una semana epidemiológica.',
        'Combinar condiciones para evitar incluir registros que no corresponden.',
      ],
      example:
        'Para revisar un brote gastrointestinal, podrías filtrar `clasificacion == "confirmado"` y `semana_epi >= 12` antes de hacer una curva epidémica.',
      docs: [
        {
          label: 'dplyr filter',
          summary: '`filter()` conserva filas que cumplen una condición, como casos confirmados o una comuna.',
          url: 'https://dplyr.tidyverse.org/reference/filter.html',
        },
        {
          label: 'comparison operators',
          summary: 'Los operadores como `==`, `>=` y `%in%` permiten definir criterios de inclusión.',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/Comparison.html',
        },
      ],
    },
    icon: 'chart',
    challenges: [
      {
        prompt: 'Con dplyr cargado, qué expresión mantiene solo edad de 18 o más?',
        context: 'Filtrar por edad es común al definir poblaciones de estudio.',
        choices: ['filter(edad >= 18)', 'select(edad >= 18)', 'mutate(edad >= 18)'],
        answer: 'filter(edad >= 18)',
        gap: { template: '____(edad >= 18)', blank: 'filter' },
        tokens: { parts: ['filter(', 'edad', '>=', '18', ')'], distractors: ['select(', '<='] },
        explain: '`filter()` conserva filas que cumplen una condición.',
        concept: 'filtrar filas',
      },
      {
        prompt: 'Cuál condición mantiene solo casos confirmados?',
        context: 'La definición de caso debe quedar explícita en el código.',
        choices: ['resultado == "confirmado"', 'resultado = "confirmado"', 'resultado <- "confirmado"'],
        answer: 'resultado == "confirmado"',
        gap: { template: 'resultado ____ "confirmado"', blank: '==' },
        tokens: { parts: ['resultado', '==', '"confirmado"'], distractors: ['<-', '='] },
        explain: '`==` compara; `<-` asigna y `=` no es la forma recomendada para esta condición.',
        concept: 'comparaciones',
      },
      {
        prompt: 'Qué operador significa "y" al combinar condiciones?',
        context: 'Podrías pedir confirmados y residentes de una región.',
        choices: ['&', '|', '%in%'],
        answer: '&',
        explain: '`&` exige que ambas condiciones sean verdaderas.',
        concept: 'condiciones combinadas',
      },
      {
        prompt: 'Qué expresión mantiene solo las comunas Santiago, Maipú y Puente Alto?',
        context: 'A veces quieres filtrar Santiago, Maipú y Puente Alto al mismo tiempo.',
        choices: ['comuna %in% c("Santiago", "Maipú", "Puente Alto")', 'comuna == c("Santiago", "Maipú", "Puente Alto")', 'comuna contains comunas'],
        answer: 'comuna %in% c("Santiago", "Maipú", "Puente Alto")',
        tokens: {
          parts: ['comuna', '%in%', 'c(', '"Santiago",', '"Maipú",', '"Puente Alto"', ')'],
          distractors: ['==', 'contains'],
        },
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
      why: 'Los informes no muestran cada fila: resumen patrones. Conteos, tasas y porcentajes ayudan a convertir datos crudos en decisiones.',
      canDo: [
        'Contar casos por comuna, semana o grupo etario.',
        'Calcular porcentajes de positividad o cobertura.',
        'Comparar grupos con una tabla resumida.',
      ],
      example:
        'Puedes agrupar por comuna y contar casos confirmados para priorizar búsqueda activa, fiscalización o comunicación de riesgo.',
      docs: [
        {
          label: 'dplyr summarise',
          summary: '`summarise()` calcula indicadores agregados, como promedios, conteos o porcentajes.',
          url: 'https://dplyr.tidyverse.org/reference/summarise.html',
        },
        {
          label: 'dplyr count',
          summary: '`count()` cuenta registros por grupo, por ejemplo casos por comuna o semana.',
          url: 'https://dplyr.tidyverse.org/reference/count.html',
        },
      ],
    },
    icon: 'chart',
    challenges: [
      {
        prompt: 'Qué verbo agrupa una tabla por comuna antes de resumir?',
        context: 'Agrupar permite calcular indicadores por territorio.',
        choices: ['group_by(comuna)', 'split_by(comuna)', 'arrange(comuna)'],
        answer: 'group_by(comuna)',
        gap: { template: '____(comuna)', blank: 'group_by' },
        explain: '`group_by()` define grupos para operaciones posteriores.',
        concept: 'agrupar datos',
      },
      {
        prompt: 'Qué comando cuenta filas por comuna en dplyr?',
        context: 'Un conteo por comuna puede mostrar dónde hay más reportes.',
        choices: ['count(comuna)', 'sum(comuna)', 'total(comuna)'],
        answer: 'count(comuna)',
        gap: { template: '____(comuna)', blank: 'count' },
        explain: '`count(comuna)` cuenta cuántas filas hay en cada comuna.',
        concept: 'contar grupos',
      },
      {
        prompt: 'Cómo calcularías porcentaje de positivos si positivos y total ya existen?',
        context: 'La positividad se expresa normalmente como porcentaje.',
        choices: ['positivos / total * 100', 'positivos + total * 100', 'total / positivos'],
        answer: 'positivos / total * 100',
        gap: { template: 'positivos / total ____ 100', blank: '*' },
        tokens: { parts: ['positivos', '/', 'total', '*', '100'], distractors: ['+', 'casos'] },
        explain: 'Un porcentaje divide la parte por el total y multiplica por 100.',
        concept: 'calcular porcentajes',
      },
      {
        prompt: 'Qué función calcula el promedio de edad ignorando NA?',
        context: 'Los faltantes no deberían romper un resumen si se decide excluirlos.',
        choices: ['mean(edad, na.rm = TRUE)', 'average(edad, remove_na)', 'mean(edad, missing = no)'],
        answer: 'mean(edad, na.rm = TRUE)',
        gap: { template: 'mean(edad, na.rm = ____)', blank: 'TRUE' },
        tokens: { parts: ['mean(', 'edad,', 'na.rm', '=', 'TRUE', ')'], distractors: ['FALSE', 'median('] },
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
      why: 'Un gráfico bien hecho ayuda a ver patrones que una tabla esconde: aumentos, grupos de riesgo, diferencias territoriales o errores de datos.',
      canDo: [
        'Graficar puntos para explorar relaciones.',
        'Usar barras para comparar categorías.',
        'Dibujar líneas para mirar evolución temporal.',
      ],
      example:
        'Una curva de casos por semana epidemiológica puede mostrar si un brote está creciendo, llegando a peak o bajando.',
      docs: [
        {
          label: 'ggplot2 basics',
          summary: '`ggplot()` inicia un gráfico declarando datos y variables visuales.',
          url: 'https://ggplot2.tidyverse.org/reference/ggplot.html',
        },
        {
          label: 'geom_col',
          summary: '`geom_col()` crea barras cuando ya tienes valores resumidos, como casos por comuna.',
          url: 'https://ggplot2.tidyverse.org/reference/geom_bar.html',
        },
      ],
    },
    icon: 'chart',
    challenges: [
      {
        prompt: 'Qué función inicia un gráfico con ggplot2?',
        context: 'ggplot define los datos y mapeos visuales antes de agregar capas.',
        choices: ['ggplot()', 'plotly_start()', 'make_chart()'],
        answer: 'ggplot()',
        explain: '`ggplot()` inicia un gráfico de ggplot2.',
        concept: 'iniciar ggplot',
      },
      {
        prompt: 'Qué capa agrega puntos a un gráfico?',
        context: 'Los puntos sirven para explorar relación entre dos variables, por ejemplo edad y días hasta consulta.',
        choices: ['geom_point()', 'geom_table()', 'plot_points()'],
        answer: 'geom_point()',
        explain: '`geom_point()` dibuja un punto por observación.',
        concept: 'gráficos de puntos',
      },
      {
        prompt: 'Qué capa sirve para una barra por categoría ya resumida?',
        context: 'Si ya tienes casos por comuna, una barra por comuna es directa.',
        choices: ['geom_col()', 'geom_point()', 'geom_box()'],
        answer: 'geom_col()',
        explain: '`geom_col()` usa valores ya calculados para la altura de barras.',
        concept: 'gráficos de barras',
      },
      {
        prompt: 'Qué variable suele ir en el eje x de una curva epidémica?',
        context: 'Una curva epidémica ordena casos en el tiempo.',
        choices: ['semana_epi', 'nombre_paciente', 'id_registro'],
        answer: 'semana_epi',
        explain: 'La semana epidemiológica permite ver evolución temporal de casos.',
        concept: 'series temporales simples',
      },
    ],
  },
  {
    title: 'Fechas y semanas',
    tag: 'Unidad 8',
    goal: 'Trabajar con fechas de vigilancia',
    theory: {
      why: 'En salud pública, el tiempo importa mucho: fecha de inicio de síntomas, toma de muestra, consulta, notificación y cierre pueden contar historias distintas.',
      canDo: [
        'Convertir texto a fecha para ordenar eventos.',
        'Calcular diferencias entre fechas.',
        'Crear variables de semana o mes para reportes.',
      ],
      example:
        'Si `fecha_inicio_sintomas` y `fecha_consulta` son fechas, puedes calcular cuántos días demoraron las personas en consultar.',
      docs: [
        {
          label: 'as.Date documentation',
          summary: '`as.Date()` convierte texto compatible en fechas para ordenar y calcular tiempos.',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/base/html/as.Date.html',
        },
        {
          label: 'lubridate',
          summary: 'lubridate facilita leer fechas con funciones como `ymd()`, `dmy()` o `mdy()`.',
          url: 'https://lubridate.tidyverse.org/',
        },
      ],
    },
    icon: 'flask',
    challenges: [
      {
        prompt: 'Qué función base convierte texto a fecha?',
        context: 'Importar fechas como texto impide ordenar bien una línea de tiempo.',
        choices: ['as.Date()', 'toCalendar()', 'date_text()'],
        answer: 'as.Date()',
        explain: '`as.Date()` convierte valores compatibles a fechas.',
        concept: 'convertir fechas',
      },
      {
        prompt: 'Si usas lubridate, qué función lee una fecha como "2026-07-02"?',
        context: 'El formato año-mes-día es común en bases exportadas.',
        choices: ['ymd("2026-07-02")', 'dmy("2026-07-02")', 'mdy("2026-07-02")'],
        answer: 'ymd("2026-07-02")',
        gap: { template: '____("2026-07-02")', blank: 'ymd' },
        explain: '`ymd()` lee fechas en orden año, mes y día.',
        concept: 'leer fechas con lubridate',
      },
      {
        prompt: 'Qué resta calcula días entre consulta e inicio?',
        context: 'La demora de consulta puede orientar intervenciones de comunicación.',
        choices: ['fecha_consulta - fecha_inicio', 'fecha_inicio + fecha_consulta', 'dias(fecha_consulta, fecha_inicio)'],
        answer: 'fecha_consulta - fecha_inicio',
        gap: { template: 'fecha_consulta ____ fecha_inicio', blank: '-' },
        tokens: { parts: ['fecha_consulta', '-', 'fecha_inicio'], distractors: ['+', 'dias('] },
        explain: 'Restar fechas entrega la diferencia de tiempo entre ambas.',
        concept: 'diferencia entre fechas',
      },
      {
        prompt: 'Para reportes mensuales, qué variable sería más útil?',
        context: 'Agrupar por mes permite preparar tableros y reportes periódicos.',
        choices: ['mes_notificacion', 'rut', 'observacion_libre'],
        answer: 'mes_notificacion',
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
      why: 'Un análisis no termina al obtener un número. Hay que guardar salidas reproducibles para informes, revisión técnica o trabajo con equipos.',
      canDo: [
        'Exportar tablas limpias o resumidas.',
        'Guardar figuras para insertar en informes.',
        'Mantener un rastro entre datos de entrada, código y resultados.',
      ],
      example:
        'Tras resumir cobertura de vacunación por comuna, puedes guardar una tabla CSV para revisión del equipo territorial.',
      docs: [
        {
          label: 'write.csv documentation',
          summary: '`write.csv()` guarda tablas para compartir o documentar salidas del análisis.',
          url: 'https://stat.ethz.ch/R-manual/R-devel/library/utils/html/write.table.html',
        },
        {
          label: 'ggsave documentation',
          summary: '`ggsave()` guarda gráficos en archivos para informes, presentaciones o anexos.',
          url: 'https://ggplot2.tidyverse.org/reference/ggsave.html',
        },
      ],
    },
    icon: 'play',
    challenges: [
      {
        prompt: 'Qué comando guarda una tabla resumen como CSV?',
        context: 'Exportar permite compartir resultados con otras personas del equipo.',
        choices: ['write.csv(resumen, "resumen.csv")', 'save.table(resumen, "resumen.csv")', 'export(resumen)'],
        answer: 'write.csv(resumen, "resumen.csv")',
        gap: { template: '____(resumen, "resumen.csv")', blank: 'write.csv' },
        tokens: { parts: ['write.csv(', 'resumen,', '"resumen.csv"', ')'], distractors: ['save.table(', 'export('] },
        explain: '`write.csv()` escribe un data frame en un archivo CSV.',
        concept: 'exportar CSV',
      },
      {
        prompt: 'Qué función de ggplot2 guarda un gráfico en archivo?',
        context: 'Los gráficos suelen ir a informes o presentaciones.',
        choices: ['ggsave("curva.png")', 'save_plot_now("curva.png")', 'plot_export("curva.png")'],
        answer: 'ggsave("curva.png")',
        gap: { template: '____("curva.png")', blank: 'ggsave' },
        explain: '`ggsave()` guarda el último gráfico o uno indicado.',
        concept: 'guardar gráficos',
      },
      {
        prompt: 'Qué nombre de archivo es más claro para una tabla de casos por comuna?',
        context: 'Los nombres ordenados evitan confundir versiones.',
        choices: ['casos_por_comuna_2026.csv', 'final_final.csv', 'tabla.csv'],
        answer: 'casos_por_comuna_2026.csv',
        explain: 'Un buen nombre dice qué contiene la salida y a qué periodo corresponde.',
        concept: 'nombrar salidas',
      },
      {
        prompt: 'Qué conviene guardar junto a los resultados?',
        context: 'La reproducibilidad permite explicar como se obtuvo cada número.',
        choices: ['El script usado para generar la salida', 'Solo una captura de pantalla', 'Nada, si el resultado se ve bien'],
        answer: 'El script usado para generar la salida',
        explain: 'El script deja evidencia de los pasos usados para producir la salida.',
        concept: 'reproducibilidad',
      },
    ],
  },
]

export type LessonSupport = {
  keyIdeas: string[]
  script: string
  tips: string[]
}

export const lessonSupport: Record<string, LessonSupport> = {
  'Primeros pasos en R': {
    keyIdeas: [
      '`<-` guarda valores en objetos.',
      'Los nombres claros hacen que el análisis sea auditable.',
      '`#` inicia comentarios que R no ejecuta.',
      'Las tasas permiten comparar territorios de distinto tamaño.',
    ],
    script: `poblacion <- 125000
casos_confirmados <- 342
incidencia <- casos_confirmados / poblacion * 100000
# Incidencia por 100.000 habitantes`,
    tips: [
      'Usa nombres sin tildes ni espacios en objetos de R.',
      'Prefiere nombres como `casos_confirmados` antes que `x` o `tabla_final2`.',
      'Deja comentarios cuando una exclusión o decisión pueda necesitar explicación.',
    ],
  },
  'Vectores y tipos de datos': {
    keyIdeas: [
      '`c()` crea vectores.',
      'El texto va entre comillas.',
      '`TRUE` y `FALSE` son valores lógicos.',
      '`class()` ayuda a revisar el tipo de una variable.',
    ],
    script: `edades <- c(34, 45, 52)
comunas <- c("Santiago", "Maipu", "Puente Alto")
confirmado <- c(TRUE, FALSE, TRUE)
class(edades)`,
    tips: [
      'Si una variable numérica queda como texto, los cálculos pueden fallar.',
      'Las categorías como comuna, síntoma o resultado se guardan como texto.',
      'Los filtros producen valores lógicos: verdadero o falso para cada fila.',
    ],
  },
  'Tablas de datos': {
    keyIdeas: [
      '`read.csv()` carga archivos CSV.',
      '`head()` muestra las primeras filas.',
      '`names()` muestra nombres de columnas.',
      '`summary()` entrega una revisión rápida de variables.',
    ],
    script: `vigilancia <- read.csv("vigilancia_respiratoria.csv")
head(vigilancia)
names(vigilancia)
summary(vigilancia)`,
    tips: [
      'Antes de analizar, mira si las columnas llegaron con nombres esperados.',
      'Revisa si edad, fechas y resultados quedaron en formatos razonables.',
      'Un data frame suele representar una fila por persona, evento o muestra.',
    ],
  },
  'Limpieza inicial': {
    keyIdeas: [
      '`select()` elige columnas.',
      '`mutate()` crea o modifica columnas.',
      '`NA` representa datos faltantes.',
      '`sum(is.na(variable))` cuenta faltantes.',
    ],
    script: `casos_limpios <- casos |>
  select(comuna, edad, resultado_pcr, fecha_consulta) |>
  mutate(mayor_60 = edad >= 60)

sum(is.na(casos_limpios$edad))`,
    tips: [
      'No trates un dato faltante como cero si realmente es desconocido.',
      'Crea nombres legibles antes de compartir un análisis.',
      'Selecciona columnas para reducir ruido y evitar errores.',
    ],
  },
  'Filtrar casos': {
    keyIdeas: [
      '`filter()` conserva filas que cumplen condiciones.',
      '`==` compara igualdad.',
      '`&` significa “y”.',
      '`%in%` busca valores dentro de una lista.',
    ],
    script: `casos_confirmados <- vigilancia |>
  filter(resultado == "confirmado" & edad >= 18)

casos_rm <- vigilancia |>
  filter(comuna %in% c("Santiago", "Maipu", "Puente Alto"))`,
    tips: [
      'Define la población de estudio antes de contar o graficar.',
      'Usa comillas para comparar texto.',
      'Combina filtros para que la definición de caso quede explícita.',
    ],
  },
  'Resumir indicadores': {
    keyIdeas: [
      '`group_by()` define grupos.',
      '`count()` cuenta filas por grupo.',
      '`summarise()` calcula indicadores.',
      'Un porcentaje es parte dividido por total, multiplicado por 100.',
    ],
    script: `resumen_comunal <- casos |>
  group_by(comuna) |>
  summarise(
    casos = n(),
    edad_promedio = mean(edad, na.rm = TRUE)
  )`,
    tips: [
      'Agrupa por la unidad que quieres comparar: comuna, semana, sexo o grupo etario.',
      'Siempre revisa el denominador de una tasa o porcentaje.',
      '`na.rm = TRUE` excluye faltantes cuando esa decisión corresponde.',
    ],
  },
  'Visualizar datos': {
    keyIdeas: [
      '`ggplot()` inicia el gráfico.',
      '`aes()` conecta variables con ejes o colores.',
      '`geom_col()` sirve para barras ya resumidas.',
      '`geom_line()` ayuda a mirar tendencias temporales.',
    ],
    script: `ggplot(casos_semana, aes(x = semana_epi, y = casos)) +
  geom_line() +
  geom_point()

ggplot(casos_comuna, aes(x = comuna, y = casos)) +
  geom_col()`,
    tips: [
      'Usa líneas para evolución temporal y barras para comparar categorías.',
      'Una curva epidémica suele usar semana o fecha en el eje x.',
      'Antes de graficar, asegúrate de que los datos estén resumidos al nivel correcto.',
    ],
  },
  'Fechas y semanas': {
    keyIdeas: [
      '`as.Date()` convierte texto en fecha.',
      '`ymd()` lee fechas año-mes-día con lubridate.',
      'Restar fechas permite calcular demoras.',
      'Mes o semana sirven para reportes periódicos.',
    ],
    script: `fecha_inicio <- as.Date("2026-07-02")
fecha_consulta <- as.Date("2026-07-05")
demora_consulta <- fecha_consulta - fecha_inicio

mes_notificacion <- format(fecha_consulta, "%Y-%m")`,
    tips: [
      'Distingue fecha de síntomas, consulta, muestra y notificación.',
      'No ordenes fechas como texto si necesitas una línea de tiempo.',
      'Agrupar por semana o mes ayuda a reportar tendencias.',
    ],
  },
  'Exportar resultados': {
    keyIdeas: [
      '`write.csv()` guarda tablas.',
      '`ggsave()` guarda gráficos.',
      'Los nombres de archivo deben decir qué contienen.',
      'El script es parte de la evidencia del resultado.',
    ],
    script: `write.csv(resumen_comunal, "casos_por_comuna_2026.csv", row.names = FALSE)

ggsave("curva_epidemica.png", width = 8, height = 5)`,
    tips: [
      'Guarda salidas con nombres claros y fecha o periodo.',
      'Conserva el script que generó cada tabla o figura.',
      'Evita nombres como `final_final.csv` porque no explican el contenido.',
    ],
  },
}

export const extraChallenges: Record<string, Challenge[]> = {
  'Primeros pasos en R': [
    {
      prompt: 'Qué línea guarda 125000 como población comunal?',
      context: 'La población se usa como denominador para tasas comunales.',
      choices: ['poblacion <- 125000', '125000 == poblacion', 'poblacion(125000)'],
      answer: 'poblacion <- 125000',
      acceptedAnswers: ['poblacion = 125000', '125000 -> poblacion'],
      gap: { template: 'poblacion ____ 125000', blank: '<-' },
      tokens: { parts: ['poblacion', '<-', '125000'], distractors: ['==', 'poblacion('] },
      explain: '`<-` asigna el valor 125000 al objeto `poblacion`.',
      concept: 'asignación y objetos',
    },
    {
      prompt: 'Cuál objeto está mejor nombrado para guardar positivos de PCR?',
      context: 'Un nombre claro evita confundir resultados de laboratorio.',
      choices: ['pcr_positivos', 'pp', 'dato3'],
      answer: 'pcr_positivos',
      explain: '`pcr_positivos` describe el contenido del objeto.',
      concept: 'nombres de objetos',
    },
    {
      prompt: 'Qué línea explica una decisión sin ejecutarse?',
      context: 'Los comentarios documentan decisiones metodológicas.',
      choices: ['# excluir duplicados por rut', 'excluir duplicados por rut', 'print(excluir duplicados)'],
      answer: '# excluir duplicados por rut',
      explain: 'El signo `#` transforma esa línea en comentario.',
      concept: 'comentarios en scripts',
    },
    {
      prompt: 'Si casos = 50 y poblacion = 100000, qué calcula incidencia?',
      context: 'La incidencia por 100.000 permite comparar comunas.',
      choices: ['casos / poblacion * 100000', 'poblacion / casos * 100000', 'casos * poblacion'],
      answer: 'casos / poblacion * 100000',
      gap: { template: 'casos / poblacion ____ 100000', blank: '*' },
      tokens: { parts: ['casos', '/', 'poblacion', '*', '100000'], distractors: ['+', 'tasa'] },
      explain: 'La tasa divide eventos por población y multiplica por 100.000.',
      concept: 'cálculos con objetos',
    },
    {
      prompt: 'Qué objeto conviene evitar por poco claro?',
      context: 'Los análisis se revisan después por otras personas o por ti misma.',
      choices: ['x', 'casos_sospechosos', 'poblacion_comunal'],
      answer: 'x',
      explain: '`x` no explica qué dato contiene.',
      concept: 'nombres de objetos',
    },
    {
      prompt: 'Qué comentario sería útil en un análisis de brote?',
      context: 'Una exclusión debe quedar justificada.',
      choices: ['# excluir registros sin fecha de inicio', '# hola', '# tabla bonita'],
      answer: '# excluir registros sin fecha de inicio',
      explain: 'Ese comentario explica una decisión relevante para el análisis.',
      concept: 'comentarios en scripts',
    },
  ],
  'Vectores y tipos de datos': [
    {
      prompt: 'Qué comando crea un vector de comunas?',
      context: 'Las comunas son texto y deben ir entre comillas.',
      choices: ['comunas <- c("Santiago", "Maipu")', 'comunas <- Santiago + Maipu', 'comunas <- c(Santiago, Maipu)'],
      answer: 'comunas <- c("Santiago", "Maipu")',
      acceptedAnswers: ['comunas = c("Santiago", "Maipu")'],
      gap: { template: 'comunas <- ____("Santiago", "Maipu")', blank: 'c' },
      tokens: { parts: ['comunas', '<-', 'c(', '"Santiago",', '"Maipu"', ')'], distractors: ['list(', '+'] },
      explain: '`c()` combina valores y el texto va entre comillas.',
      concept: 'vectores con c()',
    },
    {
      prompt: 'Cuál es un valor numérico?',
      context: 'Edad y recuentos suelen ser numéricos.',
      choices: ['42', '"42"', 'cuarenta_dos'],
      answer: '42',
      explain: '`42` es número; `"42"` es texto.',
      concept: 'tipos de datos',
    },
    {
      prompt: 'Qué representa FALSE en R?',
      context: 'Una condición puede cumplirse o no para cada registro.',
      choices: ['Falso lógico', 'Texto', 'Dato faltante'],
      answer: 'Falso lógico',
      explain: '`FALSE` es un valor lógico.',
      concept: 'valores lógicos',
    },
    {
      prompt: 'Qué comando revisa el tipo de resultado_pcr?',
      context: 'Conviene confirmar si resultado_pcr llegó como texto o factor.',
      choices: ['class(resultado_pcr)', 'type(resultado_pcr)', 'kind(resultado_pcr)'],
      answer: 'class(resultado_pcr)',
      gap: { template: '____(resultado_pcr)', blank: 'class' },
      explain: '`class()` muestra la clase del objeto.',
      concept: 'tipos de datos',
    },
    {
      prompt: 'Cuál valor está escrito como texto?',
      context: 'Los resultados de laboratorio suelen ser categorías.',
      choices: ['"positivo"', 'positivo', 'TRUE'],
      answer: '"positivo"',
      explain: 'Las comillas indican texto.',
      concept: 'texto y comillas',
    },
    {
      prompt: 'Qué vector podría representar casos semanales?',
      context: 'Un vector puede guardar conteos por semana.',
      choices: ['casos <- c(12, 18, 25)', 'casos <- "12, 18, 25"', 'casos <- TRUE'],
      answer: 'casos <- c(12, 18, 25)',
      acceptedAnswers: ['casos = c(12, 18, 25)'],
      gap: { template: 'casos <- ____(12, 18, 25)', blank: 'c' },
      tokens: { parts: ['casos', '<-', 'c(', '12,', '18,', '25', ')'], distractors: ['"', 'TRUE'] },
      explain: 'Ese comando crea un vector numérico con tres conteos.',
      concept: 'vectores con c()',
    },
  ],
  'Tablas de datos': [
    {
      prompt: 'Qué comando permite ver columnas y tipos de vigilancia?',
      context: 'La estructura muestra si edad, fechas y resultados llegaron como esperabas.',
      choices: ['str(vigilancia)', 'shape(vigilancia)', 'columns(vigilancia)'],
      answer: 'str(vigilancia)',
      gap: { template: '____(vigilancia)', blank: 'str' },
      explain: '`str()` resume la estructura de un objeto.',
      concept: 'estructura de datos',
    },
    {
      prompt: 'Qué revisarías primero tras importar un CSV?',
      context: 'Antes de calcular, conviene confirmar que el archivo se leyó bien.',
      choices: ['head(vigilancia)', 'ggsave(vigilancia)', 'delete(vigilancia)'],
      answer: 'head(vigilancia)',
      gap: { template: '____(vigilancia)', blank: 'head' },
      explain: '`head()` permite inspeccionar las primeras filas.',
      concept: 'previsualizar datos',
    },
    {
      prompt: 'Qué comando muestra nombres de columnas?',
      context: 'Necesitas nombres exactos para filtrar o seleccionar.',
      choices: ['names(vigilancia)', 'labels_only(vigilancia)', 'headers(vigilancia)'],
      answer: 'names(vigilancia)',
      gap: { template: '____(vigilancia)', blank: 'names' },
      explain: '`names()` devuelve los nombres de columnas.',
      concept: 'nombres de columnas',
    },
    {
      prompt: 'Qué archivo suena más como entrada de vigilancia?',
      context: 'Los nombres de archivo también comunican contexto.',
      choices: ['vigilancia_respiratoria.csv', 'cosas.csv', 'final.xlsx.csv.csv'],
      answer: 'vigilancia_respiratoria.csv',
      explain: 'Ese nombre indica el tipo de datos que contiene.',
      concept: 'importar CSV',
    },
    {
      prompt: 'Qué función da mínimos, máximos y frecuencias básicas?',
      context: 'Sirve para detectar edades imposibles o categorías inesperadas.',
      choices: ['summary(vigilancia)', 'peek(vigilancia)', 'scan_fast(vigilancia)'],
      answer: 'summary(vigilancia)',
      explain: '`summary()` entrega una revisión rápida de variables.',
      concept: 'resumen de variables',
    },
    {
      prompt: 'Si una columna se llama fecha_consulta, qué representa probablemente?',
      context: 'Los nombres de columnas ayudan a interpretar la tabla.',
      choices: ['Fecha en que la persona consultó', 'Edad de la persona', 'Código de comuna'],
      answer: 'Fecha en que la persona consultó',
      explain: 'Un nombre claro comunica el significado de la variable.',
      concept: 'nombres de columnas',
    },
  ],
  'Limpieza inicial': [
    {
      prompt: 'Qué comando selecciona comuna y edad?',
      context: 'Seleccionar columnas deja la tabla enfocada en la pregunta.',
      choices: ['select(comuna, edad)', 'filter(comuna, edad)', 'choose_rows(comuna, edad)'],
      answer: 'select(comuna, edad)',
      gap: { template: '____(comuna, edad)', blank: 'select' },
      tokens: { parts: ['select(', 'comuna,', 'edad', ')'], distractors: ['filter(', 'rows'] },
      explain: '`select()` elige columnas.',
      concept: 'seleccionar columnas',
    },
    {
      prompt: 'Qué comando crea una columna mayor_60?',
      context: 'Los grupos de riesgo se pueden derivar desde edad.',
      choices: ['mutate(mayor_60 = edad >= 60)', 'select(mayor_60 = edad >= 60)', 'filter(mayor_60 = edad >= 60)'],
      answer: 'mutate(mayor_60 = edad >= 60)',
      gap: { template: '____(mayor_60 = edad >= 60)', blank: 'mutate' },
      tokens: { parts: ['mutate(', 'mayor_60', '=', 'edad', '>=', '60', ')'], distractors: ['select(', '<-'] },
      explain: '`mutate()` crea o modifica columnas.',
      concept: 'crear columnas',
    },
    {
      prompt: 'Qué significa NA en edad?',
      context: 'Un dato faltante no debe tratarse automáticamente como cero.',
      choices: ['Edad desconocida o faltante', 'Edad igual a cero', 'Edad negativa'],
      answer: 'Edad desconocida o faltante',
      explain: '`NA` representa información faltante.',
      concept: 'valores faltantes',
    },
    {
      prompt: 'Qué detecta is.na(edad)?',
      context: 'Permite saber qué registros no tienen edad registrada.',
      choices: ['Valores faltantes', 'Valores mayores de edad', 'Valores duplicados'],
      answer: 'Valores faltantes',
      explain: '`is.na()` identifica valores faltantes.',
      concept: 'contar NA',
    },
    {
      prompt: 'Qué columna sería útil crear para análisis de riesgo?',
      context: 'Las personas mayores pueden analizarse como grupo prioritario.',
      choices: ['mayor_60', 'color_favorito', 'fila_original_sin_uso'],
      answer: 'mayor_60',
      explain: '`mayor_60` permite comparar un grupo de riesgo.',
      concept: 'crear columnas',
    },
    {
      prompt: 'Qué opción reduce una tabla a variables útiles para reporte comunal?',
      context: 'No siempre necesitas todas las columnas del sistema original.',
      choices: ['select(comuna, edad, resultado_pcr)', 'mutate()', 'filter() sin condiciones'],
      answer: 'select(comuna, edad, resultado_pcr)',
      tokens: { parts: ['select(', 'comuna,', 'edad,', 'resultado_pcr', ')'], distractors: ['filter(', 'mutate('] },
      explain: 'Ese `select()` conserva columnas relevantes para el reporte.',
      concept: 'seleccionar columnas',
    },
  ],
  'Filtrar casos': [
    {
      prompt: 'Qué filtro deja solo casos confirmados?',
      context: 'La definición de caso debe ser explícita.',
      choices: ['filter(resultado == "confirmado")', 'filter(resultado <- "confirmado")', 'select(resultado == "confirmado")'],
      answer: 'filter(resultado == "confirmado")',
      gap: { template: 'filter(resultado ____ "confirmado")', blank: '==' },
      tokens: { parts: ['filter(', 'resultado', '==', '"confirmado"', ')'], distractors: ['<-', 'select('] },
      explain: '`filter()` conserva filas y `==` compara.',
      concept: 'filtrar filas',
    },
    {
      prompt: 'Qué condición identifica mayores de 60?',
      context: 'Los grupos etarios ayudan a priorizar riesgo.',
      choices: ['edad >= 60', 'edad => 60', 'edad = 60+'],
      answer: 'edad >= 60',
      gap: { template: 'edad ____ 60', blank: '>=' },
      explain: '`>=` significa mayor o igual.',
      concept: 'comparaciones',
    },
    {
      prompt: 'Qué filtro combina confirmados y mayores de edad?',
      context: 'A veces la población de estudio requiere más de un criterio.',
      choices: ['filter(resultado == "confirmado" & edad >= 18)', 'filter(resultado == "confirmado" | edad >= 18 siempre)', 'select(resultado, edad)'],
      answer: 'filter(resultado == "confirmado" & edad >= 18)',
      tokens: { parts: ['filter(', 'resultado', '==', '"confirmado"', '&', 'edad', '>=', '18', ')'], distractors: ['|', 'select('] },
      explain: '`&` exige que ambas condiciones se cumplan.',
      concept: 'condiciones combinadas',
    },
    {
      prompt: 'Qué operador usarías para filtrar tres comunas?',
      context: 'Un brote puede concentrarse en varias comunas vecinas.',
      choices: ['%in%', '== solamente', '<-'],
      answer: '%in%',
      explain: '`%in%` compara contra una lista de valores posibles.',
      concept: 'pertenencia con %in%',
    },
    {
      prompt: 'Qué condición mantiene semana epidemiológica 20 o posterior?',
      context: 'Filtrar periodos permite analizar una fase del brote.',
      choices: ['semana_epi >= 20', 'semana_epi <- 20', 'semana_epi == posterior'],
      answer: 'semana_epi >= 20',
      gap: { template: 'semana_epi ____ 20', blank: '>=' },
      explain: '`>=` conserva valores mayores o iguales a 20.',
      concept: 'comparaciones',
    },
    {
      prompt: 'Qué filtro usa texto correctamente?',
      context: 'Las categorías de texto deben compararse con comillas.',
      choices: ['filter(comuna == "Santiago")', 'filter(comuna == Santiago)', 'filter("comuna" == Santiago)'],
      answer: 'filter(comuna == "Santiago")',
      gap: { template: 'filter(comuna == ____)', blank: '"Santiago"' },
      tokens: { parts: ['filter(', 'comuna', '==', '"Santiago"', ')'], distractors: ['Santiago', '<-'] },
      explain: '`"Santiago"` es texto; sin comillas R busca un objeto.',
      concept: 'filtrar filas',
    },
  ],
  'Resumir indicadores': [
    {
      prompt: 'Qué hace group_by(comuna)?',
      context: 'Agrupar por comuna permite calcular indicadores territoriales.',
      choices: ['Define grupos por comuna', 'Borra la comuna', 'Ordena alfabéticamente solamente'],
      answer: 'Define grupos por comuna',
      explain: '`group_by()` prepara la tabla para resumir por grupo.',
      concept: 'agrupar datos',
    },
    {
      prompt: 'Qué función cuenta registros por grupo?',
      context: 'Contar casos por comuna es un resumen epidemiológico básico.',
      choices: ['count()', 'mean()', 'select()'],
      answer: 'count()',
      explain: '`count()` cuenta filas por una o más variables.',
      concept: 'contar grupos',
    },
    {
      prompt: 'Qué calcula positivos / total * 100?',
      context: 'La positividad se interpreta como porcentaje.',
      choices: ['Porcentaje de positivos', 'Número de comunas', 'Promedio de edad'],
      answer: 'Porcentaje de positivos',
      explain: 'Parte dividido por total, multiplicado por 100, da porcentaje.',
      concept: 'calcular porcentajes',
    },
    {
      prompt: 'Qué significa na.rm = TRUE en mean()?',
      context: 'Los datos faltantes pueden impedir calcular promedios.',
      choices: ['Ignorar NA para ese cálculo', 'Convertir NA en cero', 'Borrar toda la tabla'],
      answer: 'Ignorar NA para ese cálculo',
      explain: '`na.rm = TRUE` remueve faltantes dentro de la función.',
      concept: 'promedios con NA',
    },
    {
      prompt: 'Qué resumen sirve para casos por semana?',
      context: 'La vigilancia temporal necesita conteos por semana epidemiológica.',
      choices: ['count(semana_epi)', 'select(semana_epi)', 'class(semana_epi)'],
      answer: 'count(semana_epi)',
      gap: { template: '____(semana_epi)', blank: 'count' },
      explain: '`count(semana_epi)` cuenta registros en cada semana.',
      concept: 'contar grupos',
    },
    {
      prompt: 'Qué indicador requiere denominador poblacional?',
      context: 'Las tasas comparan territorios con distinto tamaño.',
      choices: ['Incidencia por 100.000', 'Nombre de comuna', 'ID de registro'],
      answer: 'Incidencia por 100.000',
      explain: 'La incidencia necesita casos y población.',
      concept: 'calcular porcentajes',
    },
  ],
  'Visualizar datos': [
    {
      prompt: 'Qué función inicia un gráfico de ggplot2?',
      context: 'Todo gráfico de ggplot2 parte declarando datos y estética.',
      choices: ['ggplot()', 'geom_start()', 'chart()'],
      answer: 'ggplot()',
      explain: '`ggplot()` inicia el gráfico.',
      concept: 'iniciar ggplot',
    },
    {
      prompt: 'Qué capa usarías para una curva epidémica semanal?',
      context: 'Una curva temporal suele unir puntos en el tiempo.',
      choices: ['geom_line()', 'geom_col() siempre', 'geom_text_only()'],
      answer: 'geom_line()',
      explain: '`geom_line()` muestra evolución temporal.',
      concept: 'series temporales simples',
    },
    {
      prompt: 'Qué pondrías en x para comparar casos por semana?',
      context: 'El eje x de una serie temporal representa tiempo.',
      choices: ['semana_epi', 'rut', 'observacion_libre'],
      answer: 'semana_epi',
      explain: '`semana_epi` ordena los casos en el tiempo.',
      concept: 'series temporales simples',
    },
    {
      prompt: 'Qué capa sirve para barras de casos por comuna ya resumidos?',
      context: 'Si la tabla ya tiene una columna casos, la altura ya está calculada.',
      choices: ['geom_col()', 'geom_point()', 'geom_date()'],
      answer: 'geom_col()',
      explain: '`geom_col()` usa valores resumidos como altura.',
      concept: 'gráficos de barras',
    },
    {
      prompt: 'Qué capa muestra observaciones como puntos?',
      context: 'Puedes explorar edad versus días hasta consulta.',
      choices: ['geom_point()', 'geom_col()', 'geom_none()'],
      answer: 'geom_point()',
      explain: '`geom_point()` dibuja puntos.',
      concept: 'gráficos de puntos',
    },
    {
      prompt: 'Qué gráfico usarías para comparar comunas?',
      context: 'Las barras funcionan bien para comparar categorías.',
      choices: ['Barras con geom_col()', 'Línea sin eje temporal', 'Solo tabla sin gráfico'],
      answer: 'Barras con geom_col()',
      explain: 'Las comunas son categorías; las barras facilitan la comparación.',
      concept: 'gráficos de barras',
    },
  ],
  'Fechas y semanas': [
    {
      prompt: 'Qué función convierte texto compatible a fecha en R base?',
      context: 'Las fechas deben ser fechas reales para calcular demoras.',
      choices: ['as.Date()', 'date_make()', 'text_to_day()'],
      answer: 'as.Date()',
      explain: '`as.Date()` convierte texto a fecha.',
      concept: 'convertir fechas',
    },
    {
      prompt: 'Qué función lee formato año-mes-día en lubridate?',
      context: 'El formato 2026-07-02 aparece mucho en bases exportadas.',
      choices: ['ymd()', 'dmy()', 'mdy()'],
      answer: 'ymd()',
      explain: '`ymd()` significa year-month-day.',
      concept: 'leer fechas con lubridate',
    },
    {
      prompt: 'Qué calcula fecha_consulta - fecha_inicio?',
      context: 'La demora puede orientar educación o acceso a atención.',
      choices: ['Días entre inicio y consulta', 'Edad de la persona', 'Número de casos'],
      answer: 'Días entre inicio y consulta',
      explain: 'Restar fechas calcula una diferencia de tiempo.',
      concept: 'diferencia entre fechas',
    },
    {
      prompt: 'Qué variable sirve para reportes mensuales?',
      context: 'Los equipos suelen reportar por mes o semana.',
      choices: ['mes_notificacion', 'rut', 'nombre'],
      answer: 'mes_notificacion',
      explain: '`mes_notificacion` permite agrupar eventos por mes.',
      concept: 'periodos de reporte',
    },
    {
      prompt: 'Qué fecha conviene usar para una curva de inicio de síntomas?',
      context: 'La curva cambia según la fecha elegida.',
      choices: ['fecha_inicio_sintomas', 'fecha_digitacion', 'fecha_descarga_archivo'],
      answer: 'fecha_inicio_sintomas',
      explain: 'Para inicio de síntomas, esa fecha representa mejor el evento clínico.',
      concept: 'convertir fechas',
    },
    {
      prompt: 'Qué problema hay si las fechas quedan como texto?',
      context: 'El orden temporal puede quedar mal interpretado.',
      choices: ['No se calculan bien demoras ni orden temporal', 'Se vuelven más exactas', 'Se grafican solas'],
      answer: 'No se calculan bien demoras ni orden temporal',
      explain: 'Conviene convertir texto a fecha antes de analizar tiempo.',
      concept: 'convertir fechas',
    },
  ],
  'Exportar resultados': [
    {
      prompt: 'Qué función guarda una tabla como CSV?',
      context: 'Una tabla resumida puede compartirse con equipos territoriales.',
      choices: ['write.csv()', 'ggsave()', 'filter()'],
      answer: 'write.csv()',
      explain: '`write.csv()` exporta data frames como CSV.',
      concept: 'exportar CSV',
    },
    {
      prompt: 'Qué argumento evita una columna extra de números de fila?',
      context: 'Los CSV para compartir suelen no necesitar row names.',
      choices: ['row.names = FALSE', 'names.rows = TRUE', 'delete.rows = TRUE'],
      answer: 'row.names = FALSE',
      gap: { template: 'row.names = ____', blank: 'FALSE' },
      explain: '`row.names = FALSE` evita guardar nombres de fila.',
      concept: 'exportar CSV',
    },
    {
      prompt: 'Qué función guarda un gráfico de ggplot2?',
      context: 'Las figuras pueden ir a informes o presentaciones.',
      choices: ['ggsave()', 'write.csv()', 'summary()'],
      answer: 'ggsave()',
      explain: '`ggsave()` guarda gráficos.',
      concept: 'guardar gráficos',
    },
    {
      prompt: 'Qué nombre de archivo es más informativo?',
      context: 'Un buen nombre reduce confusión entre versiones.',
      choices: ['curva_epidemica_semana_20.png', 'grafico.png', 'final3.png'],
      answer: 'curva_epidemica_semana_20.png',
      explain: 'El nombre dice qué contiene y el periodo.',
      concept: 'nombrar salidas',
    },
    {
      prompt: 'Qué debes guardar junto a tabla y gráfico?',
      context: 'La reproducibilidad permite defender el resultado.',
      choices: ['El script que generó la salida', 'Solo una captura', 'Nada más'],
      answer: 'El script que generó la salida',
      explain: 'El script muestra cómo se produjo el resultado.',
      concept: 'reproducibilidad',
    },
    {
      prompt: 'Qué salida sirve para revisar cobertura por comuna en Excel?',
      context: 'CSV es un formato común para compartir tablas simples.',
      choices: ['cobertura_por_comuna.csv', 'cobertura_por_comuna.exe', 'cobertura_por_comuna.tmp'],
      answer: 'cobertura_por_comuna.csv',
      explain: 'CSV es adecuado para tablas y puede abrirse en planillas.',
      concept: 'exportar CSV',
    },
  ],
}

export function getLessonChallenges(lesson: Lesson) {
  return [...lesson.challenges, ...(extraChallenges[lesson.title] ?? [])]
}

export function getChallengeKey(lessonPosition: number, challengePosition: number) {
  return `${lessonPosition}-${challengePosition}`
}
