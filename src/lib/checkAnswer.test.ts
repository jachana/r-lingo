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
})

describe('checkTypedAnswer', () => {
  const expected = ['mean(edad, na.rm = TRUE)']

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
