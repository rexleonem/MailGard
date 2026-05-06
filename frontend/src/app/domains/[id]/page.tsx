'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    Activity, Shield, ShieldCheck, ShieldAlert, 
    ArrowLeft, History, Cpu, Mail, ExternalLink, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

export default function DomainDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => {
        api.get(`/accounts/${id}`)
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    const startWarmup = async () => {
        setTriggering(true);
        try {
            await api.post(`/accounts/${id}/warmup`);
            alert('Warm-up job scheduled!');
        } catch (err) {
            alert('Failed to schedule warm-up');
        }
        setTriggering(false);
    };

    const [confirmDelete, setConfirmDelete] = useState(false);

    const toggleStatus = async () => {
        const newStatus = data.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        try {
            const res = await api.put(`/accounts/${id}`, { status: newStatus });
            setData({ ...data, status: res.data.status });
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const deleteAccount = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        try {
            await api.delete(`/accounts/${id}`);
            router.push('/');
        } catch (err) {
            alert('Failed to delete account');
            setConfirmDelete(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading...</div>;
    if (!data) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Not found</div>;

    const latestDiag = data.diagnostics[0] || {};
    const aiData = latestDiag.rawData || {};

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </Link>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={toggleStatus}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${data.status === 'ACTIVE' ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                    >
                        {data.status === 'ACTIVE' ? 'Pause Warm-up' : 'Resume Warm-up'}
                    </button>
                    <button 
                        onClick={deleteAccount}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${confirmDelete ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}
                    >
                        {confirmDelete ? 'Click again to Confirm' : 'Delete Domain'}
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-4xl font-bold text-white tracking-tight">{data.domain}</h1>
                        <StatusBadge status={data.status} />
                    </div>
                    <p className="text-slate-400 mt-2 flex items-center space-x-2">
                        <Mail size={16} />
                        <span>{data.email}</span>
                    </p>
                </div>
                <button 
                    onClick={startWarmup}
                    disabled={triggering || data.status !== 'ACTIVE'}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-xl shadow-blue-900/40"
                >
                    {triggering ? <RefreshCw className="animate-spin" size={20} /> : <Activity size={20} />}
                    <span>Trigger Warm-up Job</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Diagnostics & AI */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                                <Cpu size={22} className="text-blue-500" />
                                <span>AI Risk Intelligence</span>
                            </h2>
                            <span className="text-xs text-slate-500 font-mono">MODEL: GEMINI-1.5-FLASH</span>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center space-x-8">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                            strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * (aiData.score || 0)) / 100}
                                            className={`${(aiData.score || 0) > 70 ? 'text-emerald-500' : 'text-rose-500'} transition-all duration-1000`} 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-white">{aiData.score || '--'}</span>
                                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Score</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-2xl font-bold text-white">{aiData.riskLevel} RISK</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{aiData.reason}</p>
                                    <div className="pt-4">
                                        <div className="inline-flex items-center space-x-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg">
                                            <ShieldCheck size={16} className="text-blue-500" />
                                            <span className="text-sm font-medium text-slate-300">{aiData.recommendation}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                            <Shield size={20} className="text-blue-500" />
                            <span>Protocol Health (DNS)</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DnsCard label="SPF" active={latestDiag.spf} description="Sender Policy Framework" />
                            <DnsCard label="DKIM" active={latestDiag.dkim} description="DomainKeys Identified Mail" />
                            <DnsCard label="DMARC" active={latestDiag.dmarc} description="Domain Message Authentication" />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                                <History size={20} className="text-blue-500" />
                                <span>Recent Logs</span>
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-800">
                            {data.emailLogs.map((log: any) => (
                                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-2 h-2 rounded-full ${log.status === 'SENT' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-white text-sm font-medium">{log.recipient}</span>
                                            <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 ${log.status === 'SENT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {log.status}
                                    </span>
                                </div>
                            ))}
                            {data.emailLogs.length === 0 && (
                                <div className="p-12 text-center text-slate-500 italic">No activity logs recorded yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Warm-up State */}
                <div className="space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                            <Activity size={20} className="text-blue-500" />
                            <span>Warm-up Engine</span>
                        </h2>
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Current Day</p>
                                <p className="text-3xl font-black text-white mt-1">Day {data.warmupState?.dayNumber || 1}</p>
                            </div>
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Daily Limit</p>
                                <p className="text-3xl font-black text-white mt-1">{data.warmupState?.dailyLimit || 5}</p>
                            </div>
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sent Today</p>
                                <p className="text-3xl font-black text-blue-500 mt-1">{data.warmupState?.currentCount || 0}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-500 leading-relaxed italic">
                                    MailGard automatically scales sending volume based on AI health scores to prevent IP blacklisting.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: any = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        PAUSED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        RISK_BLOCKED: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest border ${colors[status]}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

function DnsCard({ label, active, description }: { label: string, active: boolean, description: string }) {
    return (
        <div className={`p-4 rounded-xl border transition-all ${active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">{label}</span>
                {active ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-slate-600" />}
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{description}</p>
        </div>
    );
}
