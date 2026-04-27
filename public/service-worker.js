const BUILD_ID = 'dev'
const CACHE_NAME = `periodic-table-explorer-${BUILD_ID}`
const RUNTIME_CACHE_NAME = `${CACHE_NAME}-runtime`
const PRECACHE_MANIFEST = []

const SCOPE_URL = new URL('./', self.location).toString()
const APP_SHELL_URL = new URL('index.html', SCOPE_URL).toString()
const PRECACHE_URLS = Array.from(
  new Set(['./', 'index.html', ...PRECACHE_MANIFEST].map((url) =>
    new URL(url, SCOPE_URL).toString(),
  )),
)

const isCacheableResponse = (response) =>
  response && response.status === 200 && response.type !== 'opaque'

const isSameScopeRequest = (request) => {
  const url = new URL(request.url)
  return url.origin === self.location.origin && url.href.startsWith(SCOPE_URL)
}

const putInCache = async (cacheName, request, response) => {
  if (!isCacheableResponse(response)) {
    return
  }

  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
}

const fromNetworkFirst = async (request) => {
  try {
    const response = await fetch(request)
    await putInCache(CACHE_NAME, request, response)
    return response
  } catch {
    const cached =
      (await caches.match(request, { ignoreSearch: true })) ??
      (await caches.match(SCOPE_URL, { ignoreSearch: true })) ??
      (await caches.match(APP_SHELL_URL, { ignoreSearch: true }))

    return cached ?? Response.error()
  }
}

const fromCacheFirst = async (request) => {
  const cached = await caches.match(request, { ignoreSearch: true })

  if (cached) {
    return cached
  }

  const response = await fetch(request)
  await putInCache(RUNTIME_CACHE_NAME, request, response)
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== CACHE_NAME && key !== RUNTIME_CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  if (!isSameScopeRequest(request)) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkFirst(request))
    return
  }

  event.respondWith(fromCacheFirst(request))
})
