const imageCache = new Map<string, HTMLImageElement>()

export async function loadLayer(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url)
  if (cached) {
    return cached
  }

  const image = new Image()
  image.src = url
  await image.decode()
  imageCache.set(url, image)
  return image
}

export function clearLayerCache(): void {
  imageCache.clear()
}
