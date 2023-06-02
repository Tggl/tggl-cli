#! /usr/bin/env node

import { program } from 'commander'
import fs from 'fs/promises'
import axios, { AxiosError } from 'axios'

program.name('tggl').version('1.0.0')

const template = `import { TgglFlags, TgglContext } from 'tggl-client'

declare module 'tggl-client' {
  export interface TgglContext {
    <CONTEXT>
  }

  export interface TgglFlags {
    <FLAGS>
  }
}`

class TsType {
  constructor(public name: string) {}
}

const formatVariations = (variations: any[]) => {
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

  return [
    ...new Set(
      variations.map((variation) =>
        variation instanceof TsType ? variation.name : JSON.stringify(variation)
      )
    ),
  ].join(' | ')
}

const formatContextType = (type: any) => {
  if (
    [
      'STRING',
      'VERSION',
      'PHONE',
      'USER_AGENT',
      'IP',
      'LANGUAGE',
      'COUNTRY',
      'CURRENCY',
    ].includes(type.type)
  ) {
    return 'string'
  }
  if (type.type === 'NUMBER') {
    return 'number'
  }
  if (type.type === 'STRING_ARRAY') {
    return 'string[]'
  }
  if (type.type === 'DATE') {
    return 'string | number'
  }
  if (type.type === 'BOOLEAN') {
    return 'number'
  }
  if (type.type === 'SELECT') {
    return formatVariations(type.options.map((option: any) => option.value))
  }

  return 'any'
}

program
  .command('typing')
  .description(
    'Create a Typescript declaration file for your flags and context'
  )
  .requiredOption(
    '-k, --api-key <key>',
    'Tggl API key, defaults to TGGL_API_KEY environment variable',
    process.env.TGGL_API_KEY
  )
  .requiredOption('-o, --output <file>', 'File to write the typing to')
  .action(async (options) => {
    try {
      const response = await axios({
        url: 'https://api.tggl.io/typing',
        headers: {
          'x-tggl-api-key': options.apiKey,
        },
      })

      const { flags, context } = response.data

      await fs.writeFile(
        options.output,
        template
          .replace(
            /( *)<FLAGS>/,
            '$1' +
              Object.entries(flags)
                .map(
                  ([key, type]) => `${key}: ${formatVariations(type as any[])}`
                )
                .join('\n$1')
          )
          .replace(
            /( *)<CONTEXT>/,
            '$1' +
              Object.entries(context)
                .map(
                  ([key, type]) => `${key}: ${formatContextType(type as any)}`
                )
                .join('\n$1')
          )
      )
    } catch (error) {
      // @ts-ignore
      program.error(
        `Error: ${
          (error as AxiosError<{ error?: string }>).response?.data?.error ||
          (error as AxiosError).response?.statusText
        }`
      )
    }
  })

program.parseAsync()
