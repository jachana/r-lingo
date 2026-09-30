# Ejecuta este archivo desde una carpeta que contenga ambos CSV.
# Instala los paquetes una sola vez con conexión a internet:
# install.packages(c("dplyr", "ggplot2"))
library(dplyr)
library(ggplot2)

# 1. Importa los CSV y revisa nombres, tipos y primeras filas.

# 2. Quita el registro duplicado por id.
#    Convierte edades negativas a NA; no sustituyas edades desconocidas por cero.

# 3. Convierte ambas columnas de fechas a Date y calcula la demora en días.

# 4. Conserva solo confirmados de 18 años o más.
#    Cuenta cuántos registros se excluyen por edad desconocida.

# 5. Cuenta casos adultos confirmados por comuna.
#    Agrega la población adulta de cada comuna y calcula casos / población * 100000.

# 6. Cuenta casos por semana de calendario (lunes como inicio; format(fecha, "%Y-%W")).
#    Esta agrupación NO define una semana epidemiológica oficial.

# 7. Haz un gráfico de barras por comuna con títulos y etiquetas.

# 8. Guarda el resumen como CSV sin nombres de fila, el gráfico como PNG y este script.
#    Explica cada decisión en un comentario. No abras la solución durante la evaluación.
