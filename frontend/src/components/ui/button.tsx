import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-brand-sea to-brand to-55% text-white shadow-[0_8px_22px_rgba(37,99,235,0.38)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.97]',
        secondary:
          'bg-white border border-slate-200 text-ink-dim shadow-sm hover:-translate-y-0.5 hover:text-brand hover:border-brand/30 hover:shadow-[0_10px_22px_rgba(37,99,235,0.16)]',
        success:
          'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-[0_6px_18px_rgba(67,160,71,0.3)] hover:-translate-y-0.5 hover:brightness-105',
        destructive:
          'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_6px_18px_rgba(220,38,38,0.3)] hover:-translate-y-0.5 hover:brightness-105',
        ghost: 'hover:bg-brand/8 hover:text-brand',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
