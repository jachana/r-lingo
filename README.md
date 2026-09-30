# R-Lingo

Una PWA estilo Duolingo para aprender R con ejemplos de salud pública.

Incluye:

- 9 unidades iniciales sobre R, datos, limpieza, filtros, indicadores, gráficos, fechas y exportación.
- Bloques teoricos opcionales por unidad.
- Ejercicios de seleccion multiple, escritura directa, relleno de espacios, bloques tipo token-bank, lectura de codigo y repaso de emparejar conceptos.
- Reintentos estilo Duolingo: una respuesta incorrecta vuelve al final de la cola en otro modo, con pistas antes de revelar la respuesta.
- Enlaces a documentación desde unidades, feedback y referencia rapida.
- Racha diaria, respuestas consecutivas, XP, niveles y celebraciones; práctica sin límite.
- Meta diaria configurable y repaso de conceptos con un calendario de 1, 3, 7 y 14 días.
- Práctica repetida de unidades completas sin borrar logros ni duplicar XP.
- Copias de progreso por archivo, recuperación y reinicio con confirmación.
- Ejercicio independiente en RStudio con datos ficticios, guía, rúbrica y solución separada.
- Progreso offline en `localStorage`, sin usuarios ni base de datos.
- PWA instalable con cache offline.

## Improvement roadmap

See [improvement goals and milestones](docs/IMPROVEMENT_GOALS.md) for the app assessment, prioritized roadmap, and acceptance criteria.

See [implementation evidence](docs/verification/implementation-checks.md) for completed checks and the remaining device/learning gates. This is a personal app for friends learning R.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Luego abre la URL local que imprime Vite.

## Build

```bash
npm run build
```

## Deploy en Coolify

Usa el `Dockerfile` incluido. Coolify puede construir la app con Node, copiar el `dist` estatico a Nginx y servirla en el puerto `80`.

No requiere base de datos, autenticacion ni cuentas de usuario. El progreso queda guardado localmente en el navegador bajo `r-lingo-progress-v3`. La migración conserva la copia anterior de `r-lingo-progress-v2`.

## Verificar cambios

```bash
npm test
npm run lint
npm run build
npm run verify:r
```

La verificación de R usa webR solo en desarrollo y descarga paquetes de su repositorio oficial; no forma parte de la app. El registro de ejecución está en [docs/verification/r-runtime.json](docs/verification/r-runtime.json). Para regenerar iconos: `npm run generate:icons`.

Consulta [el protocolo para amigos y dispositivos](docs/PILOT_PROTOCOL.md) antes de dar por verificadas la instalación móvil y la retención del aprendizaje.
