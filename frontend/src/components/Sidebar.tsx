'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, PlusCircle, Settings, 
    ShieldCheck, Activity, LogOut, ChevronRight,
    Menu, X, Send, History
} from 'lucide-react';

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/', disabled: false },
        { icon: <PlusCircle size={20} />, label: 'Add Domain', path: '/domains/new', disabled: false },
        { icon: <Send size={20} />, label: 'Manual Test', path: '/test-send', disabled: false },
        { icon: <History size={20} />, label: 'Delivery Logs', path: '/logs', disabled: false },
        { icon: <Activity size={20} />, label: 'Intelligence', path: '/monitor', disabled: false },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings', disabled: false },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    const NavContent = () => (
        <>
            <div className="p-8">
                <div className="flex items-center space-x-3 text-white group cursor-pointer">
                    <div className="p-2 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/20">
                        <ShieldCheck size={24} />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">MailGard</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {menuItems.map((item) => (
                    <Link 
                        key={item.path} 
                        href={item.disabled ? '#' : item.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                            flex items-center justify-between px-4 py-3 rounded-xl transition-all group
                            ${pathname === item.path 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className="flex items-center space-x-3">
                            <span className={pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-blue-500 transition-colors'}>
                                {item.icon}
                            </span>
                            <span className="font-semibold">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-all ${pathname === item.path ? 'opacity-100' : ''}`} />
                    </Link>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-800">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
                        MG
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white tracking-wide">Production v1.0</span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                            Connected
                        </span>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Toggle */}
            <button 
                onClick={toggleSidebar}
                className="lg:hidden fixed top-6 right-6 z-[60] p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-slate-900 border-r border-slate-800 flex-col h-screen sticky top-0 overflow-hidden">
                <NavContent />
            </aside>

            {/* Mobile Drawer */}
            <div className={`
                lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md transition-all duration-500
                ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                <aside className={`
                    absolute left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-500
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <NavContent />
                </aside>
            </div>
        </>
    );
}
