import fs from 'fs/promises'

fs.readFile('src/index.ts', 'utf-8').then(
  async (code) => {
    const packageJson = await fs.readFile('package.json', 'utf-8')
    const version = JSON.parse(packageJson).version

    await fs.writeFile('src/index.ts', code.replace(/program\.name\('tggl'\)\.version\('[0-9.]+'\)/, `program.name('tggl').version('${version}')`))
  }
)
