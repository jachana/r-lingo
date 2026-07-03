# R-Lingo

Una PWA estilo Duolingo para aprender R con ejemplos de salud pública.

Incluye:

- 9 unidades iniciales sobre R, datos, limpieza, filtros, indicadores, gráficos, fechas y exportación.
- Bloques teoricos opcionales por unidad.
- Ejercicios de seleccion multiple, escritura directa, relleno de espacios, bloques tipo token-bank, lectura de codigo y repaso de emparejar conceptos.
- Reintentos estilo Duolingo: una respuesta incorrecta vuelve al final de la cola en otro modo, con pistas antes de revelar la respuesta.
- Enlaces a documentación desde unidades, feedback y referencia rapida.
- Vidas, racha, XP, niveles y celebraciones.
- Progreso offline en `localStorage`, sin usuarios ni base de datos.
- PWA instalable con cache offline.

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

No requiere base de datos, autenticacion ni cuentas de usuario. El progreso queda guardado localmente en el navegador bajo `r-lingo-progress-v2`.
