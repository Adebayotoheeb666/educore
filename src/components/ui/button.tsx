import * as React from 'react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  ghost: 'hover:bg-gray-100',
  link: 'text-blue-600 underline hover:text-blue-700',
};

const sizeClasses = {
  default: 'h-10 py-2 px-4',
  sm: 'h-9 px-3 rounded-md',
  lg: 'h-11 px-8 rounded-md',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variantClass = variantClasses[variant] || variantClasses.default;
    const sizeClass = sizeClasses[size] || sizeClasses.default;
    
    return (
      <button
        className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
