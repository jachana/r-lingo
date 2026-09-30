import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
const source = new URL('../public/app-icon.svg', import.meta.url)
const sourcePath = fileURLToPath(source)
for (const size of [192, 512]) {
  await sharp(sourcePath).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/app-icon-${size}.png`, import.meta.url)))
}
await sharp(sourcePath).resize(180, 180).png().toFile(fileURLToPath(new URL('../public/apple-touch-icon.png', import.meta.url)))
// Keep the original mark fully inside the central mask-safe region.
const mark = await sharp(sourcePath).resize(340, 340).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#2ca65f' } })
  .composite([{ input: mark, gravity: 'centre' }]).png()
  .toFile(fileURLToPath(new URL('../public/app-icon-maskable.png', import.meta.url)))
