import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}
