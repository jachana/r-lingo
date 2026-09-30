# Solución separada: úsala después de terminar tu intento independiente.
library(dplyr)
library(ggplot2)

vigilancia <- read.csv("vigilancia.csv", na.strings = c("", "NA"))
poblaciones <- read.csv("poblaciones.csv")
print(head(vigilancia))
print(names(vigilancia))
str(vigilancia)

# Un id representa un evento; el archivo contiene una copia accidental.
limpios <- vigilancia[!duplicated(vigilancia$id), ]
# Una edad negativa es inválida; desconocida no significa cero.
limpios$edad[limpios$edad < 0 & !is.na(limpios$edad)] <- NA
limpios$fecha_inicio <- as.Date(limpios$fecha_inicio)
limpios$fecha_consulta <- as.Date(limpios$fecha_consulta)
limpios$demora_dias <- as.numeric(limpios$fecha_consulta - limpios$fecha_inicio)
print(sum(is.na(limpios$edad)))

# Los desconocidos se reportan aparte; no cuentan como adultos conocidos.
adultos <- limpios |> filter(resultado == "confirmado" & edad >= 18)
resumen <- adultos |> count(comuna, name = "casos")
resumen <- merge(resumen, poblaciones, by = "comuna", all.x = TRUE)
resumen <- resumen |> mutate(casos_por_100000_adultos = casos / poblacion_adulta * 100000)
print(resumen)

# Semanas de calendario con lunes como inicio; no son una convención epidemiológica.
adultos$semana_calendario <- format(adultos$fecha_inicio, "%Y-%W")
semanas <- adultos |> count(semana_calendario)
print(semanas)

grafico <- ggplot(resumen, aes(x = comuna, y = casos)) +
  geom_col() + labs(title = "Ejercicio: casos adultos confirmados", x = "Comuna", y = "Casos")
write.csv(resumen, "resumen_comunal.csv", row.names = FALSE)
ggsave("casos_por_comuna.png", plot = grafico, width = 7, height = 4, dpi = 120)

stopifnot(nrow(vigilancia) == 13L, nrow(limpios) == 12L)
stopifnot(sum(is.na(limpios$edad)) == 3L, nrow(adultos) == 6L)
stopifnot(all(resumen$casos == 2L))
stopifnot(resumen$casos_por_100000_adultos[resumen$comuna == "Santiago"] == 20)
stopifnot(resumen$casos_por_100000_adultos[resumen$comuna == "Maipu"] == 10)
stopifnot(resumen$casos_por_100000_adultos[resumen$comuna == "Puente Alto"] == 5)
stopifnot(all(adultos$demora_dias >= 0), file.exists("casos_por_comuna.png"))

# Todas las personas y poblaciones son ficticias. El indicador es solo del ejercicio.
# Registra el entorno para poder reproducir los resultados.
sessionInfo()
