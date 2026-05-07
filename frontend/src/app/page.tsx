'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    Plus, Activity, ShieldCheck, Mail, Globe, 
    ArrowRight, AlertCircle, CheckCircle2, TrendingUp,
    ShieldAlert, Zap, Search
} from 'lucide-react';
import api from '@/lib/api';

export default function Dashboard() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/accounts').then(res => {
            setAccounts(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                    <Activity className="animate-spin text-blue-500 relative z-10" size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 lg:space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">Deliverability Overview</h1>
                    <p className="text-slate-400 font-medium">Monitor and manage your SMTP sending reputation.</p>
                </div>
                <Link href="/domains/new" className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 group font-bold">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>Add New Domain</span>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                            <Globe size={24} />
                        </div>
                        <TrendingUp size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Domains</p>
                        <h2 className="text-4xl font-black text-white mt-1">{accounts.filter(a => a.status === 'ACTIVE').length}</h2>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">HEALTHY</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Avg. Health Score</p>
                        <h2 className="text-4xl font-black text-white mt-1">
                            {accounts.length > 0 ? Math.round(accounts.reduce((acc, a) => acc + (a.diagnostics[0]?.ipScore || 0), 0) / accounts.length) : 0}%
                        </h2>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-4 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                            <Zap size={24} />
                        </div>
                        <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">RAMPING</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Daily Warm-up Volume</p>
                        <h2 className="text-4xl font-black text-white mt-1">
                            {accounts.reduce((acc, a) => acc + (a.warmupState?.currentCount || 0), 0)}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Domains List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">Connected Accounts</h3>
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search domains..."
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 w-64"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {accounts.map((account) => {
                        const diag = account.diagnostics[0] || {};
                        const health = diag.ipScore || 0;
                        const statusColor = account.status === 'ACTIVE' ? 'bg-emerald-500' : (account.status === 'PAUSED' ? 'bg-amber-500' : 'bg-rose-500');

                        return (
                            <Link 
                                key={account.id}
                                href={`/domains/${account.id}`}
                                className="group bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 lg:p-6 rounded-[2rem] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-center space-x-4 lg:space-x-6">
                                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-105 transition-transform">
                                        <Mail size={28} />
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <h4 className="text-lg lg:text-xl font-black text-white tracking-tight truncate">{account.domain}</h4>
                                        <p className="text-xs lg:text-sm text-slate-500 font-medium truncate">{account.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 lg:gap-12 px-2 md:px-0">
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Health</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-12 lg:w-20 bg-slate-950 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${health > 80 ? 'bg-emerald-500' : (health > 50 ? 'bg-amber-500' : 'bg-rose-500')}`}
                                                    style={{ width: `${health}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-white">{health}%</span>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
                                            <span className="text-xs font-bold text-white uppercase">{account.status}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {accounts.length === 0 && (
                        <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem]">
                            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                                <Plus size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">No domains connected</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2">Connect your first SMTP account to start the AI-driven warm-up engine.</p>
                            <Link href="/domains/new" className="mt-8 inline-flex items-center space-x-2 text-blue-500 font-bold hover:text-blue-400 transition-colors uppercase tracking-widest text-xs">
                                <span>Get Started Now</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
