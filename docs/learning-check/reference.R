# Referencia para el acompañante. Define fase antes de ejecutar este script.
stopifnot(exists("fase"), fase %in% c("baseline", "seven-day"))
library(dplyr)
library(ggplot2)
registros <- read.csv("vigilancia.csv", na.strings = c("", "NA"))
denominadores <- read.csv("poblaciones.csv")
print(head(registros)); str(registros); str(denominadores)
depurados <- registros[!duplicated(registros$id), ]
depurados$edad[!is.na(depurados$edad) & depurados$edad < 0] <- NA
depurados$fecha_inicio <- as.Date(depurados$fecha_inicio)
depurados$fecha_consulta <- as.Date(depurados$fecha_consulta)
depurados$demora_dias <- as.numeric(depurados$fecha_consulta - depurados$fecha_inicio)
seleccionados <- depurados |> filter(resultado == "confirmado" & edad >= 18)
informe <- seleccionados |> count(comuna, name = "casos")
informe <- merge(informe, denominadores, by = "comuna", all.x = TRUE)
informe <- informe |> mutate(casos_por_100000_adultos = casos / poblacion_adulta * 100000)
seleccionados$semana_calendario <- format(seleccionados$fecha_inicio, "%Y-%W")
por_semana <- seleccionados |> count(semana_calendario)
figura <- ggplot(informe, aes(comuna, casos)) + geom_col() +
  labs(title = paste("Datos ficticios:", fase), x = "Comuna", y = "Adultos confirmados")
write.csv(informe, "resumen_comunal.csv", row.names = FALSE)
ggsave("casos_por_comuna.png", plot = figura, width = 7, height = 4, dpi = 120)
stopifnot(nrow(registros) == 13L, nrow(depurados) == 12L,
          sum(is.na(depurados$edad)) == 3L, nrow(seleccionados) == 6L,
          all(depurados$demora_dias >= 0),
          ncol(read.csv("resumen_comunal.csv")) == ncol(informe),
          file.exists("casos_por_comuna.png"))
if (fase == "baseline") {
  esperados <- c(Valparaiso = 12.5, Concepcion = 8, Temuco = 4)
  stopifnot(all(informe$casos == 2L),
            identical(por_semana$semana_calendario, c("2026-30", "2026-31")),
            identical(por_semana$n, c(2L, 4L)))
} else {
  esperados <- c(Antofagasta = 12.5, "La Serena" = 2.5, Osorno = 6.25)
  stopifnot(identical(informe$casos, c(3L, 1L, 2L)),
            identical(por_semana$semana_calendario, c("2026-35", "2026-36")),
            identical(por_semana$n, c(4L, 2L)))
}
stopifnot(all(informe$casos_por_100000_adultos == unname(esperados[informe$comuna])))
print(informe); print(por_semana); sessionInfo()
