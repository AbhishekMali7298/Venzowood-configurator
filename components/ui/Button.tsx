import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    variant === 'primary'
      ? 'bg-stone-900 text-white hover:bg-stone-700'
      : 'bg-white text-stone-900 border border-stone-300 hover:border-stone-500'

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${base} ${className}`.trim()}
      {...props}
    />
  )
}
