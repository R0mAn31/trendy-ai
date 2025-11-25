import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
  const variantClasses = {
    primary: 'bg-gradient-primary text-white shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/60 hover:scale-105 active:scale-95',
    secondary: 'bg-gradient-secondary text-white shadow-lg shadow-secondary-500/50 hover:shadow-xl hover:shadow-secondary-500/60 hover:scale-105 active:scale-95',
    outline: 'border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 hover:border-primary-600 hover:scale-105 active:scale-95',
    ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
  }
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-xs mr-2" />}
      {children}
    </button>
  )
}

