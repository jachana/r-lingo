export type CheckResult = { correct: boolean; hint?: string }

// Multi-char operators are protected with placeholder chars so the
// single-char pass can't split them (e.g. `<-` must not become `< -`).
const operatorPlaceholders: [string, string][] = [
  ['%in%', ''],
  ['<-', ''],
  ['->', ''],
  ['==', ''],
  ['>=', ''],
  ['<=', ''],
  ['!=', ''],
]

export function normalizeCode(value: string): string {
  let out = value.trim().replace(/'/g, '"')
  for (const [op, placeholder] of operatorPlaceholders) out = out.split(op).join(placeholder)
  out = out.replace(/([-=+\-*/&|<>,()])/g, ' $1 ')
  for (const [op, placeholder] of operatorPlaceholders) out = out.split(placeholder).join(op)
  return out
    .replace(/\s+/g, ' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')')
    .replace(/ ,/g, ',')
    .trim()
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
