'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex w-full h-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
                {children}
            </main>
        </div>
    );
}
