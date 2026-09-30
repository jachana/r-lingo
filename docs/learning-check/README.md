# Materiales para la persona que acompaña a sus amigos

Estos datos son ficticios. Entrega los dos CSV de `baseline/` antes del curso y los de `seven-day/` siete días después del intento principal. Usa una carpeta nueva en cada ocasión. El archivo `public/practica/inicio.R` sirve como plantilla de tareas, sin solución; cada persona puede elegir nombres de objetos diferentes de los ejemplos del curso.

La tarea y rúbrica son las ocho actividades de [la guía](../../public/practica/guia.md). Durante la línea de base permite 20 minutos y puntúa lo que la persona ya sabe hacer; no se exige aprobar. Para ambos intentos posteriores permite 45–60 minutos y registra la duración real. Puedes ayudar con la instalación en los tres momentos. Registra cualquier ayuda con código y entrega las soluciones después de guardar el intento.

El script de referencia [reference.R](reference.R) usa los mismos archivos en una carpeta nueva, recibe la fase mediante `fase <- "baseline"` o `fase <- "seven-day"` y verifica los resultados antes de exportar. No lo distribuyas hasta terminar la evaluación. Se ejecuta como parte de `npm run verify:r`, junto con la solución principal.

| Resultado esperado | Línea de base | Siete días |
|---|---|---|
| Filas de entrada / después de quitar duplicado | 13 / 12 | 13 / 12 |
| Edades desconocidas después de limpiar | 3 | 3 |
| Adultos confirmados | 6 | 6 |
| Casos por comuna | Valparaiso 2; Concepcion 2; Temuco 2 | Antofagasta 3; La Serena 1; Osorno 2 |
| Casos por 100.000 adultos | 12,5; 8; 4 respectivamente | 12,5; 2,5; 6,25 respectivamente |
| Casos por semana con lunes como inicio | 2026-30: 2; 2026-31: 4 | 2026-35: 4; 2026-36: 2 |

Los indicadores y semanas son solo convenciones del ejercicio. Puntúa cada dominio de la guía; se admiten otras implementaciones correctas. Revisa que los resultados provengan del script entregado y que el CSV se pueda volver a importar, sin una columna adicional de números de fila. Guarda los resultados anónimos en [PILOT_PROTOCOL.md](../PILOT_PROTOCOL.md).
