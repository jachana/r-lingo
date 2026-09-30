// webR 0.6's Node worker imports R.js via an absolute path. Windows ESM
// requires file URLs; the documented importScripts branch can load it with
// CommonJS instead. Node also loads this preloader in its worker threads.
if (process.platform === 'win32') {
  const { fileURLToPath } = require('node:url')
  globalThis.importScripts = (path) => require(path.startsWith('file:') ? fileURLToPath(path) : path)
}
