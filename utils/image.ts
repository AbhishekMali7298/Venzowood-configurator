export async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}

export async function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(urls.map((url) => loadImage(url)))
}

export function imageToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
