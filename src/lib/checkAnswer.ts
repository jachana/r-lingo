export type CheckResult = { correct: boolean; hint?: string }

// Multi-char operators are protected with placeholder chars so the
// single-char pass can't split them (e.g. `<-` must not become `< -`).
const operatorPlaceholders: [string, string][] = [
  ['%in%', '\u0001'],
  ['<-', '\u0002'],
  ['->', '\u0003'],
  ['==', '\u0004'],
  ['>=', '\u0005'],
  ['<=', '\u0006'],
  ['!=', '\u0007'],
]

export function normalizeCode(value: string): string {
  let out = value.trim().replace(/'/g, '"')
  const stringLiterals: string[] = []
  out = out.replace(/"([^"\\]|\\.)*"/g, (literal) => {
    const placeholder = `\u0008${stringLiterals.length}\u0008`
    stringLiterals.push(literal)
    return placeholder
  })
  for (const [op, placeholder] of operatorPlaceholders) out = out.split(op).join(placeholder)
  out = out.replace(/([\u0001-\u0007=+\-*/&|<>,()])/g, ' $1 ')
  for (const [op, placeholder] of operatorPlaceholders) out = out.split(placeholder).join(op)
  out = out
    .replace(/\s+/g, ' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')')
    .replace(/ ,/g, ',')
    .trim()
  return out.replace(/\u0008(\d+)\u0008/g, (_, index: string) => stringLiterals[Number(index)])
}

function findCaseMismatch(input: string, candidate: string): { want: string; got: string } | undefined {
  const inputTokens = input.split(' ')
  const candidateTokens = candidate.split(' ')
  for (let index = 0; index < candidateTokens.length; index += 1) {
    if (candidateTokens[index] !== inputTokens[index]) {
      return { want: candidateTokens[index], got: inputTokens[index] ?? '' }
    }
  }
  return undefined
}

export function checkTypedAnswer(input: string, expected: string[]): CheckResult {
  const normalizedInput = normalizeCode(input)
  if (!normalizedInput) return { correct: false }
  const normalizedExpected = expected.map(normalizeCode)

  if (normalizedExpected.includes(normalizedInput)) return { correct: true }

  const caseMatch = normalizedExpected.find(
    (candidate) => candidate.toLowerCase() === normalizedInput.toLowerCase(),
  )
  if (caseMatch) {
    const mismatch = findCaseMismatch(normalizedInput, caseMatch)
    if (mismatch) {
      return {
        correct: false,
        hint: `Casi — R distingue mayúsculas: es \`${mismatch.want}\`, no \`${mismatch.got}\`.`,
      }
    }
  }

  const opens = (normalizedInput.match(/\(/g) ?? []).length
  const closes = (normalizedInput.match(/\)/g) ?? []).length
  if (opens !== closes) {
    return {
      correct: false,
      hint:
        opens > closes
          ? 'Te falta cerrar un paréntesis `)`.'
          : 'Hay un paréntesis `)` de más o falta abrir `(`.',
    }
  }

  const primary = normalizedExpected[0]
  const quotedLiteral = primary.match(/"([^"]+)"/)?.[1]
  if (
    quotedLiteral &&
    !normalizedInput.includes('"') &&
    normalizedInput.toLowerCase().includes(quotedLiteral.toLowerCase())
  ) {
    return { correct: false, hint: `El texto va entre comillas: \`"${quotedLiteral}"\`.` }
  }

  return { correct: false }
}
