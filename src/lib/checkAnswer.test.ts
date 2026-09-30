import { describe, expect, it } from 'vitest'
import { checkTypedAnswer, normalizeCode } from './checkAnswer'

describe('normalizeCode', () => {
  it.each([
    ['edades<-c(34,45,52)', 'edades <- c(34, 45, 52)'],
    ['edades  <-   c( 34 ,45, 52 )', 'edades <- c(34, 45, 52)'],
    ["filter(comuna == 'Santiago')", 'filter(comuna == "Santiago")'],
    ['mean(edad,na.rm=TRUE)', 'mean(edad, na.rm = TRUE)'],
    ['casos/poblacion*100000', 'casos / poblacion * 100000'],
    ['comuna%in%c("Santiago")', 'comuna %in% c("Santiago")'],
    ['edad>=18', 'edad >= 18'],
    ['42->tamano_muestra', '42 -> tamano_muestra'],
    ['#  excluir   registros', '# excluir registros'],
  ])('normalizes %s and %s to the same string', (a, b) => {
    expect(normalizeCode(a)).toBe(normalizeCode(b))
  })

  it('does NOT fold case', () => {
    expect(normalizeCode('TRUE')).not.toBe(normalizeCode('true'))
  })

  it('normalizes spacing outside quotes but preserves text inside quotes', () => {
    expect(normalizeCode('ymd( "2026-07-02" )')).toBe(normalizeCode('ymd("2026-07-02")'))
    expect(normalizeCode('filter(rango=="20-29")')).toBe(normalizeCode('filter(rango == "20-29")'))
  })

  it('does not equate different string literals', () => {
    expect(normalizeCode('ymd("2026 - 07 - 02")')).not.toBe(normalizeCode('ymd("2026-07-02")'))
  })
})

describe('checkTypedAnswer', () => {
  const expected = ['mean(edad, na.rm = TRUE)']

  it('rejects different vector values and object names under the default exact policy', () => {
    const expectedVector = ['comunas <- c("Santiago", "Maipu")']
    expect(checkTypedAnswer('comunas <- c("wrong")', expectedVector).correct).toBe(false)
    expect(checkTypedAnswer('zonas <- c("Santiago", "Maipu")', expectedVector).correct).toBe(false)
  })

  it('does not change apostrophes or punctuation inside string literals', () => {
    expect(normalizeCode('x <- "don\'t"')).not.toBe(normalizeCode('x <- "don t"'))
    expect(normalizeCode("x <- 'a,b'")).toBe(normalizeCode('x <- "a,b"'))
    expect(checkTypedAnswer('x <- c("a,b", "c")', ['x <- c("a,b", "c")']).correct).toBe(true)
  })

  it('open-ended string vectors accept quoted commas but reject empty or mixed vectors', () => {
    const expectedVector = ['comunas <- c("Santiago", "Maipu")']
    expect(checkTypedAnswer('x <- c("a,b")', expectedVector, 'string-vector').correct).toBe(true)
    expect(checkTypedAnswer('x <- c()', expectedVector, 'string-vector').correct).toBe(false)
    expect(checkTypedAnswer('x <- c("a", 1)', expectedVector, 'string-vector').correct).toBe(false)
  })

  it('open-ended vectors require a legal unquoted R object name', () => {
    const expectedVector = ['comunas <- c("Santiago", "Maipu")']
    for (const name of ['.2zonas', 'if', 'TRUE', 'NA_integer_']) {
      expect(checkTypedAnswer(`${name} <- c("Sur")`, expectedVector, 'string-vector').correct).toBe(false)
    }
    expect(checkTypedAnswer('.zonas <- c("Sur")', expectedVector, 'string-vector').correct).toBe(true)
  })

  it('accepts spacing variants', () => {
    expect(checkTypedAnswer('mean(edad,na.rm=TRUE)', expected).correct).toBe(true)
  })

  it('accepts any entry of the expected list', () => {
    const result = checkTypedAnswer('tamano_muestra = 42', [
      'tamano_muestra <- 42',
      'tamano_muestra = 42',
      '42 -> tamano_muestra',
    ])
    expect(result.correct).toBe(true)
  })

  it('accepts single quotes where double quotes are expected', () => {
    expect(checkTypedAnswer("filter(comuna == 'Santiago')", ['filter(comuna == "Santiago")']).correct).toBe(true)
  })

  it('accepts case and object-name variants for string vector creation', () => {
    const expectedVector = ['comunas <- c("Santiago", "Maipu")']

    expect(checkTypedAnswer('comunas <- c("santiago","maipu")', expectedVector, 'string-vector').correct).toBe(true)
    expect(checkTypedAnswer('zonas = c("Santiago", "Maipu")', expectedVector, 'string-vector').correct).toBe(true)
    expect(checkTypedAnswer('mis_comunas <- c("providencia", "nunoa", "la florida")', expectedVector, 'string-vector').correct).toBe(true)
  })

  it('does not accept unquoted values as string vector creation', () => {
    const result = checkTypedAnswer('comunas <- c(Santiago, Maipu)', ['comunas <- c("Santiago", "Maipu")'])

    expect(result.correct).toBe(false)
    expect(result.hint).toContain('comillas')
  })

  it('rejects case differences with a specific hint', () => {
    const result = checkTypedAnswer('mean(edad, na.rm = true)', expected)
    expect(result.correct).toBe(false)
    expect(result.hint).toContain('mayúsculas')
    expect(result.hint).toContain('TRUE')
    expect(result.hint).toContain('true')
  })

  it('hints about unbalanced parentheses', () => {
    const result = checkTypedAnswer('mean(edad, na.rm = TRUE', expected)
    expect(result.correct).toBe(false)
    expect(result.hint).toContain('paréntesis')
  })

  it('hints about missing quotes around a string literal', () => {
    const result = checkTypedAnswer('filter(comuna == Santiago)', ['filter(comuna == "Santiago")'])
    expect(result.correct).toBe(false)
    expect(result.hint).toContain('comillas')
  })

  it('plain wrong answers get no hint', () => {
    const result = checkTypedAnswer('median(edad)', expected)
    expect(result.correct).toBe(false)
    expect(result.hint).toBeUndefined()
  })

  it('empty input is wrong without hint', () => {
    expect(checkTypedAnswer('   ', expected)).toEqual({ correct: false })
  })
})
