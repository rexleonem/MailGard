'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const isAuthPage = pathname === '/login' || pathname === '/register';

        if (!token && !isAuthPage) {
            router.push('/login');
        } else if (token && isAuthPage) {
            router.push('/');
        } else {
            setAuthorized(true);
        }
    }, [pathname, router]);

    if (!authorized) {
        return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading...</div>;
    }

    if (pathname === '/login' || pathname === '/register') {
        return <>{children}</>;
    }

    return <>{children}</>;
}
