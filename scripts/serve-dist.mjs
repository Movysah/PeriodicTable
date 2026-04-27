import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const port = Number(process.env.PORT ?? '4173')
const host = process.env.HOST ?? '0.0.0.0'
const root = join(process.cwd(), 'dist')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
}

const resolveFilePath = (urlPath) => {
  const pathname = decodeURIComponent(urlPath.split('?')[0] || '/')
  const normalized = normalize(pathname).replace(/^(\.\.[\\/])+/, '')

  if (normalized === '/' || normalized === '\\') {
    return join(root, 'index.html')
  }

  return join(root, normalized)
}

const server = createServer(async (request, response) => {
  const filePath = resolveFilePath(request.url ?? '/')

  try {
    const file = await readFile(filePath)
    const extension = extname(filePath)
    const contentType =
      contentTypes[extension] ?? 'application/octet-stream'

    response.writeHead(200, { 'Content-Type': contentType })
    response.end(file)
  } catch {
    try {
      const fallback = await readFile(join(root, 'index.html'))
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      response.end(fallback)
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Not found')
    }
  }
})

server.listen(port, host, () => {
  console.log(`Static preview running at http://${host}:${port}`)
})
