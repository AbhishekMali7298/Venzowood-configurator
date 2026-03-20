const tileCache = new Set<string>()

export async function preloadTile(url: string): Promise<void> {
  if (tileCache.has(url)) {
    return
  }

  const image = new Image()
  image.src = url
  await image.decode()
  tileCache.add(url)
}
