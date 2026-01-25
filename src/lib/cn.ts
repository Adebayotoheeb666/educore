import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicting Tailwind utilities
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}
