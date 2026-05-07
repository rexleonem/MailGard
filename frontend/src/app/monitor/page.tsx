'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
    Activity, ShieldCheck, Zap, AlertCircle, 
    ArrowLeft, Clock, CheckCircle2, XCircle,
    Server, Cpu, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function Monitor() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/accounts/monitor/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Activity className="animate-spin text-blue-500" size={48} />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">Queue Intelligence</h1>
                    <p className="text-slate-400 font-medium text-lg">Real-time asynchronous task monitoring & infrastructure health.</p>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Active Tasks" value={stats.active} icon={<Zap size={20} />} color="text-blue-500" />
                <StatCard label="Waiting" value={stats.waiting} icon={<Clock size={20} />} color="text-amber-500" />
                <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={20} />} color="text-emerald-500" />
                <StatCard label="Failed" value={stats.failed} icon={<XCircle size={20} />} color="text-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white flex items-center space-x-3">
                                <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500">
                                    <Server size={24} />
                                </div>
                                <span>Worker System Status</span>
                            </h2>
                            <button onClick={fetchStats} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <RefreshCw size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                                        <Cpu size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold tracking-tight">Main Production Worker</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Concurrency: 10/s</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                                        Processing
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-3xl flex items-start space-x-4">
                                <AlertCircle className="text-blue-500 shrink-0 mt-1" size={20} />
                                <div className="space-y-1">
                                    <h4 className="text-white font-black tracking-tight text-sm uppercase">Infrastructure Insight</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        The worker system uses an exponential backoff strategy for failed sends. Currently, the system is optimized for stability over throughput to protect domain health.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
                        <h3 className="text-lg font-black text-white flex items-center space-x-2 relative z-10">
                            <Activity size={18} className="text-blue-500" />
                            <span>System Load</span>
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <LoadIndicator label="CPU Utilization" value={12} />
                            <LoadIndicator label="Memory Usage" value={24} />
                            <LoadIndicator label="Redis Latency" value={4} unit="ms" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-white font-black tracking-tight mb-4">Need Help?</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                            If you encounter persistent failures, please check your SMTP credentials and DNS configuration first.
                        </p>
                        <Link href="/settings" className="block text-center py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-xs uppercase tracking-widest">
                            System Settings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-4 hover:bg-slate-900 transition-all group">
            <div className={`p-3 bg-slate-950 border border-slate-800 rounded-2xl w-fit ${color} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <h3 className="text-3xl font-black text-white mt-1 tracking-tighter">{value}</h3>
            </div>
        </div>
    );
}

function LoadIndicator({ label, value, unit = '%' }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">{label}</span>
                <span className="text-white">{value}{unit}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-blue-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
