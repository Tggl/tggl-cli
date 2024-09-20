class TsType {
  constructor(public name: string) {}
}

export const formatVariations = (variations: any[]) => {
  if (variations.includes(true) && variations.includes(false)) {
    variations = variations.filter(
      (variation) => typeof variation !== 'boolean'
    )
    variations.push(new TsType('boolean'))
  }

  const arrays = variations.filter((variation) =>
    Array.isArray(variation)
  ) as any[][]

  if (arrays.length) {
    variations = variations.filter((variation) => !Array.isArray(variation))
    variations.push(new TsType(`Array<${formatVariations(arrays.flat())}>`))
  }

  const objectKeys: Record<string, Record<string, any>[]> = {}
  for (const variation of variations) {
    if (
      !(variation instanceof TsType) &&
      typeof variation === 'object' &&
      !Array.isArray(variation) &&
      variation !== null
    ) {
      const key = JSON.stringify(Object.keys(variation).sort())
      objectKeys[key] ??= []
      objectKeys[key].push(variation)
    }
  }

  if (Object.keys(objectKeys).length) {
    variations = variations.filter(
      (variation) =>
        variation instanceof TsType ||
        typeof variation !== 'object' ||
        Array.isArray(variation) ||
        variation === null
    )
    for (const [key, values] of Object.entries(objectKeys)) {
      const keys = JSON.parse(key) as string[]
      variations.push(
        new TsType(
          '{ ' +
            keys
              .map((key) => {
                return `${key}: ${formatVariations(
                  values.map((value) => value[key])
                )}`
              })
              .join(', ') +
            ' }'
        )
      )
    }
  }

  return [
    ...new Set(
      variations.map((variation) =>
        variation instanceof TsType ? variation.name : JSON.stringify(variation)
      )
    ),
  ]
    .sort()
    .join(' | ')
}
