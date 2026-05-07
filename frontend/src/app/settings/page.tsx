'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Mail, Shield, LogOut, ArrowLeft, Key, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Settings() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        api.get('/auth/me').then(res => setUser(res.data));
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (!user) return (
        <div className="flex items-center justify-center h-[70vh]">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-20">
            <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group w-fit">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Dashboard</span>
            </Link>

            <div className="space-y-2">
                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">System Settings</h1>
                <p className="text-slate-400 text-lg font-medium">Manage your security credentials and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl">
                        <h2 className="text-2xl font-black text-white flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500">
                                <User size={24} />
                            </div>
                            <span>Identity</span>
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Holder</label>
                                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-between">
                                    <span>{user.name}</span>
                                    <BadgeCheck size={18} className="text-blue-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-between">
                                    <span>{user.email}</span>
                                    <Mail size={18} className="text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl">
                        <h2 className="text-2xl font-black text-white flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500">
                                <Shield size={24} />
                            </div>
                            <span>Security</span>
                        </h2>
                        <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-3xl flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-4 space-y-4 md:space-y-0">
                            <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500">
                                <Key size={28} />
                            </div>
                            <div>
                                <h3 className="text-white font-black tracking-tight">Zero-Trust SMTP Layer</h3>
                                <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                                    Your SMTP credentials are encrypted using AES-256-CTR. Decryption keys are managed in a hardware-isolated environment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30">
                                <span className="text-4xl font-black text-white">{user.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{user.name}</h3>
                            <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Enterprise</span>
                            </div>
                        </div>
                        
                        <div className="pt-10 border-t border-slate-800 mt-10 relative">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center justify-center space-x-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 py-5 rounded-2xl transition-all font-black uppercase tracking-widest text-xs"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
