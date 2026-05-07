'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

export default function RootLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) return <>{children}</>;

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-8 pt-24 lg:pt-8 w-full max-w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
