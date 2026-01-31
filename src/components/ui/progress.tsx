import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className = '', ...props }, ref) => {
    const percentage = Math.min(Math.max(0, value), max);
    
    return (
      <div 
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-blue-600 transition-all"
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
