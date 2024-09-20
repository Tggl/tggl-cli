import { formatVariations } from './formatVariations'

test('string', () => {
  expect(formatVariations(['foo'])).toBe('"foo"')
})

test('strings', () => {
  expect(formatVariations(['foo', 'bar'])).toBe('"bar" | "foo"')
})

test('string array', () => {
  expect(formatVariations([['foo'], ['foo', 'bar'], ['baz', 'bar']])).toBe(
    'Array<"bar" | "baz" | "foo">'
  )
})

test('number', () => {
  expect(formatVariations([42])).toBe('42')
})

test('numbers', () => {
  expect(formatVariations([12, 34])).toBe('12 | 34')
})

test('number array', () => {
  expect(formatVariations([[45], [45, 56], [56, 0]])).toBe('Array<0 | 45 | 56>')
})

test('true', () => {
  expect(formatVariations([true])).toBe('true')
})

test('false', () => {
  expect(formatVariations([false])).toBe('false')
})

test('true and false', () => {
  expect(formatVariations([true, false])).toBe('boolean')
})

test('objects', () => {
  expect(
    formatVariations([
      { bar: 'baz', foo: 34 },
      { foo: 9, bar: 'qux' },
      {
        foo: false,
        active: true,
      },
      {
        active: true,
        foo: true,
      },
    ])
  ).toBe(`{ active: true, foo: boolean } | { bar: "baz" | "qux", foo: 34 | 9 }`)
})

test('objects with array', () => {
  expect(
    formatVariations([
      {
        foo: [12, 4],
      },
      {
        foo: [4, 51],
      },
    ])
  ).toBe(`{ foo: Array<12 | 4 | 51> }`)
})

test('mix', () => {
  expect(
    formatVariations([
      true,
      24,
      ['c'],
      { foo: true },
      'foo',
      ['a', 'b'],
      { foo: false },
      false,
    ])
  ).toBe(`"foo" | 24 | Array<"a" | "b" | "c"> | boolean | { foo: boolean }`)
})
