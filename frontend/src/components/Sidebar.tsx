import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Globe, Activity, ShieldAlert, FileText, Settings } from 'lucide-react';

export const Sidebar = () => {
    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/' },
        { icon: <Globe size={20} />, label: 'Domains', href: '/domains' },
        { icon: <Activity size={20} />, label: 'Warm-up', href: '/warmup' },
        { icon: <ShieldAlert size={20} />, label: 'Risk Analysis', href: '/risk' },
        { icon: <FileText size={20} />, label: 'Logs', href: '/logs' },
    ];

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 h-screen flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                    MailGard
                </h1>
                <p className="text-xs text-slate-500 mt-1">Deliverability Intelligence</p>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <Link 
                        key={item.label} 
                        href={item.href}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
};
