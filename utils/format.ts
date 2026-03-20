export function formatDecorCode(code: string): string {
  return code.replace('_', ' ')
}

export function truncateName(name: string, limit = 28): string {
  if (name.length <= limit) {
    return name
  }

  return `${name.slice(0, limit - 1)}…`
}
