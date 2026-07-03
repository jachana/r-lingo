export function seededShuffle<T>(items: T[], seed: string): T[] {
  let hash = 0
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return [...items]
    .map((item) => {
      hash = (hash * 1664525 + 1013904223) >>> 0
      return { item, order: hash }
    })
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item)
}
