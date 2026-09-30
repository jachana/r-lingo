# Práctica independiente de R-Lingo

Analiza una pequeña vigilancia ficticia y produce un reporte reproducible. Todos los datos son sintéticos. Tiempo orientativo: 45–60 minutos; registra el tiempo real.

## Preparación en RStudio

Instala R desde [CRAN](https://cran.r-project.org/) y RStudio Desktop desde los enlaces de instalación de la [guía oficial de Posit](https://docs.posit.co/ide/user/). RStudio es el editor; R ejecuta tu código.

Crea un proyecto o carpeta local y descarga allí `vigilancia.csv`, `poblaciones.csv` e `inicio.R`. Abre el script desde esa carpeta. Antes de desconectarte, ejecuta una vez:

```r
install.packages(c("dplyr", "ggplot2"))
```

Después, los archivos y paquetes instalados permiten realizar el ejercicio sin conexión. Se requiere R con soporte para el operador `|>`; el material se verificó en R 4.6.0. Guarda `sessionInfo()` con tus resultados para registrar tus versiones.

## Tu tarea

1. Importa ambos CSV y muestra sus columnas, tipos y primeras filas.
2. Conserva un registro por `id`. Convierte edades negativas a `NA` y cuenta edades desconocidas. Explica por qué no se reemplazan por cero.
3. Convierte fechas de texto a fechas y calcula días entre inicio y consulta.
4. Conserva confirmados de 18 años o más. Explica qué ocurre con las edades desconocidas.
5. Cuenta esos casos por comuna y calcula casos por 100.000 adultos usando el denominador de `poblaciones.csv`.
6. Cuenta por semana de calendario usando lunes como inicio. Indica expresamente que no estás definiendo una semana epidemiológica oficial.
7. Crea barras por comuna con título y etiquetas legibles.
8. Exporta el resumen sin números de fila, un PNG del gráfico y el script comentado que permite reproducirlos.

Puedes consultar la teoría y documentación de R. Durante la evaluación independiente no abras `solucion.R`, no uses respuestas reveladas y no pidas que otra persona escriba el código por ti. El observador registra cualquier ayuda recibida.

## Rúbrica de 20 puntos

| Criterio | Puntos |
|---|---:|
| Importación e inspección de ambas tablas | 2 |
| Duplicado y edades inválidas tratados con explicación | 3 |
| Fechas y demora correctas | 2 |
| Filtro adulto/confirmado y tratamiento de faltantes explicado | 3 |
| Conteos y denominadores por comuna correctos | 3 |
| Agrupación semanal definida y correcta | 2 |
| Gráfico correcto y etiquetado | 2 |
| CSV, PNG, script y entorno reproducibles | 3 |

El objetivo del piloto es al menos 16/20 puntos sin respuestas reveladas. La solución se entrega después de guardar el intento. Consulta las referencias oficiales de [filter](https://dplyr.tidyverse.org/reference/filter.html) y [ggsave](https://ggplot2.tidyverse.org/reference/ggsave.html) para resolver dudas sobre esas funciones.
