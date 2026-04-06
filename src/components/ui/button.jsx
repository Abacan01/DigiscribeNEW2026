import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/40',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
        secondary: 'bg-gray-100 text-dark-text hover:bg-gray-200 focus-visible:ring-gray-300',
        outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-primary/30',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-dark-text focus-visible:ring-primary/30',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary/30',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button = React.forwardRef(function Button({ className, variant, size, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
