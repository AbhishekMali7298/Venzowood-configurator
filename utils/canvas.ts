export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height)
}

export function applyBlendMode(
  ctx: CanvasRenderingContext2D,
  mode: GlobalCompositeOperation,
  draw: () => void,
): void {
  ctx.globalCompositeOperation = mode
  draw()
  ctx.globalCompositeOperation = 'source-over'
}

export function drawLayered(
  ctx: CanvasRenderingContext2D,
  layers: CanvasImageSource[],
  width: number,
  height: number,
): void {
  layers.forEach((layer) => {
    ctx.drawImage(layer, 0, 0, width, height)
  })
}
