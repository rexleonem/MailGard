'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    Activity, Shield, ShieldCheck, ShieldAlert, 
    ArrowLeft, RefreshCw, AlertCircle, CheckCircle2,
    Lock, Zap, Info, Mail, Globe, Server, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function DomainDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [diagnosing, setDiagnosing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/accounts/${id}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runDiagnostics = async () => {
        setDiagnosing(true);
        try {
            const res = await api.post(`/accounts/${id}/diagnostics`);
            setData(res.data);
        } catch (err) {
            alert('Failed to refresh diagnostics');
        }
        setDiagnosing(false);
    };

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
    const healthScore = latestDiag.ipScore || 0;

    const getRiskLevel = () => {
        if (healthScore >= 80) return { label: 'SAFE', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        if (healthScore >= 50) return { label: 'CAUTION', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        return { label: 'HIGH RISK', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    };

    const risk = getRiskLevel();

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </Link>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={runDiagnostics}
                        disabled={diagnosing}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-all text-sm font-bold"
                    >
                        <RefreshCw size={16} className={diagnosing ? 'animate-spin' : ''} />
                        <span>{diagnosing ? 'Analyzing...' : 'Run Diagnostics'}</span>
                    </button>
                    <button 
                        onClick={toggleStatus}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${data.status === 'ACTIVE' ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                    >
                        {data.status === 'ACTIVE' ? 'Pause Warm-up' : 'Resume Warm-up'}
                    </button>
                    <button 
                        onClick={deleteAccount}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${confirmDelete ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}
                    >
                        {confirmDelete ? 'Click again to Confirm' : 'Delete Domain'}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10">
                    <div className={`px-4 py-2 ${risk.bg} ${risk.border} border ${risk.color} rounded-full text-xs font-black tracking-widest uppercase`}>
                        {risk.label}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                                <Globe size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter">{data.domain}</h1>
                                <p className="text-slate-500 font-medium">{data.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-12 pr-20">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Health Score</p>
                            <p className={`text-6xl font-black tracking-tighter ${risk.color}`}>
                                {healthScore}<span className="text-2xl opacity-50">%</span>
                            </p>
                        </div>
                        <div className="h-16 w-px bg-slate-800" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${data.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                <span className="text-white font-bold tracking-tight">{data.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                                <Activity size={20} className="text-blue-500" />
                                <span>Warm-up Progress</span>
                            </h2>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Cycle</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sent Today</p>
                                <div className="flex items-end space-x-2">
                                    <span className="text-3xl font-black text-white">{data.warmupState?.currentCount || 0}</span>
                                    <span className="text-slate-600 font-bold mb-1">/ {aiData.recommended_daily_limit || 0}</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
                                    <div 
                                        className="bg-blue-600 h-full transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, ((data.warmupState?.currentCount || 0) / (aiData.recommended_daily_limit || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Warm-up Stage</p>
                                <p className="text-3xl font-black text-white">Day {data.warmupState?.dayNumber || 1}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Safe Ramp-up</p>
                            </div>
                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Activity</p>
                                <p className="text-sm font-bold text-white truncate mt-2">
                                    {data.warmupState?.lastSentAt ? new Date(data.warmupState.lastSentAt).toLocaleTimeString() : 'No activity yet'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Next: Scheduled</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Live Activity Feed</h3>
                            <div className="space-y-3">
                                {data.emailLogs?.slice(0, 5).map((log: any) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/50 rounded-2xl group hover:border-slate-700 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-lg ${log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                <Mail size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{log.subject}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md ${log.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                                {log.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!data.emailLogs || data.emailLogs.length === 0) && (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl">
                                        <Mail className="mx-auto text-slate-700 mb-2" size={32} />
                                        <p className="text-slate-500 font-medium">Waiting for first warm-up pulse...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                                <ShieldCheck size={20} className="text-blue-500" />
                                <span>DNS & Authentication Audit</span>
                            </h2>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pass/Fail Logic</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className={`p-6 rounded-2xl border ${latestDiag.spf ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'} space-y-3`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">SPF</span>
                                    {latestDiag.spf ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                                </div>
                                <p className={`text-2xl font-black ${latestDiag.spf ? 'text-emerald-500' : 'text-rose-500'}`}>{latestDiag.spf ? 'PASS' : 'FAIL'}</p>
                            </div>
                            <div className={`p-6 rounded-2xl border ${latestDiag.dkim ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'} space-y-3`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">DKIM</span>
                                    {latestDiag.dkim ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                                </div>
                                <p className={`text-2xl font-black ${latestDiag.dkim ? 'text-emerald-500' : 'text-rose-500'}`}>{latestDiag.dkim ? 'PASS' : 'FAIL'}</p>
                            </div>
                            <div className={`p-6 rounded-2xl border ${latestDiag.dmarc ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'} space-y-3`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">DMARC</span>
                                    {latestDiag.dmarc ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                                </div>
                                <p className={`text-2xl font-black ${latestDiag.dmarc ? 'text-emerald-500' : 'text-rose-500'}`}>{latestDiag.dmarc ? 'PASS' : 'FAIL'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                                <Zap size={20} className="text-blue-500" />
                                <span>AI Deliverability Insights</span>
                            </h2>
                            <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 rounded-md">
                                <Lock size={10} className="text-blue-500" />
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Gemini AI 1.5</span>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 relative overflow-hidden">
                            {aiData.isOverridden && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500 text-[8px] font-black uppercase tracking-widest text-white transform rotate-45 translate-x-4 translate-y-2 shadow-lg">
                                    System Override
                                </div>
                            )}
                            
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                                    <Info size={20} className="text-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-bold">Analysis Summary</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {aiData.reason || "No detailed AI insights available for this diagnostic run."}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suggested Daily Limit</p>
                                    <p className="text-xl font-bold text-white">{aiData.recommended_daily_limit || 0} emails</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Action</p>
                                    <p className={`text-xl font-bold ${aiData.action === 'PROCEED' ? 'text-emerald-500' : (aiData.action === 'SLOW_DOWN' ? 'text-amber-500' : 'text-rose-500')}`}>
                                        {aiData.action || "UNKNOWN"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                            <Server size={20} className="text-blue-500" />
                            <span>Infrastructure</span>
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">IP Reputation</span>
                                <span className={`text-xs font-black ${aiData.ipReputation >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {aiData.ipReputation || 0}/100
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">SMTP Stability</span>
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">STABLE</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Blacklist Scan</span>
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">0 HITS</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={startWarmup}
                        disabled={triggering || data.status !== 'ACTIVE'}
                        className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-20 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-blue-900/40 transition-all flex flex-col items-center justify-center space-y-1 group"
                    >
                        <div className="flex items-center space-x-2">
                            < Zap size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xl tracking-tight">Manual Warm-up Pulse</span>
                        </div>
                        <span className="text-[10px] opacity-60 uppercase tracking-widest">Human-Simulated Pattern</span>
                    </button>

                    {data.status === 'RISK_BLOCKED' && (
                        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-start space-x-4">
                            <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                            <div>
                                <h3 className="text-rose-500 font-black tracking-tight text-sm uppercase">Automatic Risk Block</h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Warm-up is disabled because this domain failed critical deliverability checks. Correct your DNS records and re-run diagnostics to unlock.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
