import React, { type ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
    children: ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-dark-bg text-white selection:bg-teal-500/30 font-sans">
            <PublicHeader />
            <main>
                {children}
            </main>
            <PublicFooter />
        </div>
    );
};
