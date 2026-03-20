export interface UVTransformInput {
  tileScale: number
}

export function createTileScaleMatrix(input: UVTransformInput): DOMMatrix {
  return new DOMMatrix().scaleSelf(input.tileScale, input.tileScale)
}
