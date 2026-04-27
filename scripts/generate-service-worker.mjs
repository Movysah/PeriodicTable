import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'

const distRoot = join(process.cwd(), 'dist')
const serviceWorkerPath = join(distRoot, 'service-worker.js')
const ignoredFiles = new Set(['service-worker.js'])
const ignoredExtensions = new Set(['.map'])

const toWebPath = (filePath) => filePath.split(sep).join('/')

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const relativePath = toWebPath(relative(distRoot, fullPath))

    if (
      ignoredFiles.has(relativePath) ||
      ignoredExtensions.has(extname(relativePath))
    ) {
      continue
    }

    files.push(relativePath)
  }

  return files.sort((left, right) => left.localeCompare(right))
}

const files = await collectFiles(distRoot)
const hash = createHash('sha256')

for (const file of files) {
  const fullPath = join(distRoot, file)
  const fileStat = await stat(fullPath)
  const fileBuffer = await readFile(fullPath)

  hash.update(file)
  hash.update(String(fileStat.size))
  hash.update(fileBuffer)
}

const buildId = hash.digest('hex').slice(0, 12)
const serviceWorker = await readFile(serviceWorkerPath, 'utf8')
const generatedServiceWorker = serviceWorker
  .replace("const BUILD_ID = 'dev'", `const BUILD_ID = '${buildId}'`)
  .replace(
    'const PRECACHE_MANIFEST = []',
    `const PRECACHE_MANIFEST = ${JSON.stringify(files, null, 2)}`,
  )

await writeFile(serviceWorkerPath, generatedServiceWorker)
console.log(`Generated service worker cache ${buildId} with ${files.length} files.`)
