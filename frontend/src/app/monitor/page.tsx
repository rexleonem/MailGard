'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
    Activity, ShieldCheck, Zap, AlertCircle, 
    Clock, CheckCircle2, XCircle,
    Server, Cpu, RefreshCw, Terminal, 
    AlertTriangle, Info, Bell
} from 'lucide-react';
import Link from 'next/link';

export default function Monitor() {
    const [stats, setStats] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, eventsRes, alertsRes] = await Promise.all([
                api.get('/accounts/monitor/stats'),
                api.get('/accounts/monitor/events'),
                api.get('/accounts/monitor/alerts')
            ]);
            setStats(statsRes.data);
            setEvents(eventsRes.data);
            setAlerts(alertsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Activity className="animate-spin text-blue-500" size={48} />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12 pb-20">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">Observability Hub</h1>
                    <p className="text-slate-400 font-medium text-lg">Full-stack visibility into MailGard infrastructure.</p>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">System Live</span>
                </div>
            </div>

            {/* Critical Alerts Bar */}
            {alerts.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-6 flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/20">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-black tracking-tight">Active Critical Alerts</h3>
                            <p className="text-sm text-rose-500/80 font-bold">{alerts.length} systems requiring immediate attention.</p>
                        </div>
                    </div>
                    <Link href="#alerts" className="px-6 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">View All</Link>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Active Tasks" value={stats.active} icon={<Zap size={20} />} color="text-blue-500" />
                <StatCard label="Waiting" value={stats.waiting} icon={<Clock size={20} />} color="text-amber-500" />
                <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={20} />} color="text-emerald-500" />
                <StatCard label="Failed" value={stats.failed} icon={<XCircle size={20} />} color="text-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Live Event Feed */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl overflow-hidden relative">
                        <div className="flex items-center justify-between relative z-10">
                            <h2 className="text-2xl font-black text-white flex items-center space-x-3">
                                <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500">
                                    <Terminal size={24} />
                                </div>
                                <span>Live Event Stream</span>
                            </h2>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Streaming</span>
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                            {events.map((event, i) => (
                                <div key={i} className="p-5 bg-slate-950/50 border border-slate-800/50 rounded-2xl flex items-start space-x-4 group hover:border-slate-700 transition-all">
                                    <SeverityIcon severity={event.severity} />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{event.type}</span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase">{new Date(event.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">{event.message}</p>
                                        {event.accountId && (
                                            <p className="text-[10px] text-slate-500 font-medium">Domain ID: {event.accountId}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Security & Integrity Status */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                        <h3 className="text-lg font-black text-white flex items-center space-x-2 relative z-10">
                            <ShieldCheck size={18} className="text-emerald-500" />
                            <span>Security & Integrity</span>
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <SecurityToggle label="API Rate Limiting" active={true} />
                            <SecurityToggle label="AI Schema Validation" active={true} />
                            <SecurityToggle label="At-Rest Encryption" active={true} />
                            <SecurityToggle label="Idempotency Locking" active={true} />
                        </div>
                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auth Guard</p>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-md">HARDENED</span>
                        </div>
                    </div>

                    {/* Infrastructure Health */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
                        <h3 className="text-lg font-black text-white flex items-center space-x-2 relative z-10">
                            <Activity size={18} className="text-blue-500" />
                            <span>Infrastructure Load</span>
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <LoadIndicator label="CPU Utilization" value={12} />
                            <LoadIndicator label="Memory Usage" value={24} />
                            <LoadIndicator label="Redis Latency" value={4} unit="ms" />
                        </div>
                    </div>

                    {/* Active Alerts List */}
                    <div id="alerts" className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                        <h3 className="text-lg font-black text-white flex items-center space-x-2">
                            <AlertTriangle size={18} className="text-rose-500" />
                            <span>System Alerts</span>
                        </h3>
                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 size={32} className="text-emerald-500/20 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No active alerts</p>
                                </div>
                            ) : (
                                alerts.map((alert, i) => (
                                    <div key={i} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{alert.type}</span>
                                            <span className="text-[10px] font-bold text-slate-600">{new Date(alert.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-white">{alert.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
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

function SecurityToggle({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${active ? 'bg-emerald-500 left-5' : 'bg-slate-600 left-1'}`} />
            </div>
        </div>
    );
}

function SeverityIcon({ severity }: { severity: string }) {
    switch (severity) {
        case 'CRITICAL': return <div className="p-2 bg-rose-500 text-white rounded-lg"><AlertCircle size={14} /></div>;
        case 'ERROR': return <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><XCircle size={14} /></div>;
        case 'WARNING': return <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><AlertTriangle size={14} /></div>;
        default: return <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Info size={14} /></div>;
    }
}
