#! /usr/bin/env node

import { program } from 'commander'
import fs from 'fs/promises'
import axios, { AxiosError } from 'axios'
import { formatVariations } from './formatVariations'

program.name('tggl').version('1.4.0')

const template = `// This file was automatically generated by the tggl CLI

import '<PACKAGE_NAME>'

declare module '<PACKAGE_NAME>' {
  export interface TgglContext {
    <CONTEXT>
  }

  export interface TgglFlags {
    <FLAGS>
  }
}`

const rawTemplate = `// This file was automatically generated by the tggl CLI

export interface TgglContext {
  <CONTEXT>
}

export interface TgglFlags {
  <FLAGS>
}`

const formatContextType = (type: any) => {
  if (['STRING', 'VERSION'].includes(type.type)) {
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
    return 'boolean'
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
  .requiredOption(
    '-h, --skip-hidden',
    'Skip hidden properties in context',
    false
  )
  .requiredOption(
    '-p, --package <package>',
    'Name of the package to declare types for',
    'tggl-client'
  )
  .action(async (options) => {
    try {
      const response = await axios({
        url: 'https://api.tggl.io/typing',
        headers: {
          'x-tggl-api-key': options.apiKey,
        },
      })

      const { flags, context } = response.data

      const chosenTemplate = options.output.endsWith('.d.ts')
        ? template
        : rawTemplate

      await fs.writeFile(
        options.output,
        chosenTemplate
          .replace(
            /( *)<FLAGS>/,
            '$1' +
              Object.entries(flags)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(
                  ([key, type]) => `${key}: ${formatVariations(type as any[])}`
                )
                .join('\n$1')
          )
          .replace(
            /( *)<CONTEXT>/,
            '$1' +
              Object.entries(context)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .filter(([_, type]) => {
                  return options.skipHidden ? !(type as any).hidden : true
                })
                .map(
                  ([key, type]) =>
                    `${key}${
                      (type as any).hidden ? '?' : ''
                    }: ${formatContextType(type as any)}`
                )
                .join('\n$1')
          )
          .replace(/<PACKAGE_NAME>/g, options.package)
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
