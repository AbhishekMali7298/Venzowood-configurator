const tileCache = new Set<string>()
const inflight = new Map<string, Promise<void>>()

function preload(url: string): Promise<void> {
  if (tileCache.has(url)) {
    return Promise.resolve()
  }

  const pending = inflight.get(url)
  if (pending) {
    return pending
  }

  const image = new Image()
  image.src = url

  const request = image
    .decode()
    .then(() => {
      tileCache.add(url)
    })
    .catch(() => {
      // Ignore preload errors; runtime render path handles network failure.
    })
    .finally(() => {
      inflight.delete(url)
    })

  inflight.set(url, request)
  return request
}

export async function preloadTile(url: string): Promise<void> {
  await preload(url)
}

export async function preloadDecorTiles(tile512: string, tile2048?: string): Promise<void> {
  await preload(tile512)

  if (tile2048) {
    void preload(tile2048)
  }
}
