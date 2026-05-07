'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    Activity, Shield, ShieldCheck, ShieldAlert, 
    ArrowLeft, RefreshCw, AlertCircle, CheckCircle2,
    Lock, Zap, Info, Mail, Globe, Server, AlertTriangle,
    Trash2, Pause, Play, TrendingUp
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

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Activity className="animate-spin text-blue-500" size={48} />
        </div>
    );
    if (!data) return (
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <ShieldAlert size={64} className="text-slate-800" />
            <h2 className="text-2xl font-bold text-white">Account Not Found</h2>
            <Link href="/" className="text-blue-500 font-bold hover:underline">Return to Dashboard</Link>
        </div>
    );

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
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 pb-20">
            {/* Top Navigation & Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Back to Dashboard</span>
                </Link>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button 
                        onClick={runDiagnostics}
                        disabled={diagnosing}
                        className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-300 transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <RefreshCw size={14} className={diagnosing ? 'animate-spin' : ''} />
                        <span>{diagnosing ? 'Analyzing...' : 'Refresh'}</span>
                    </button>
                    
                    <button 
                        onClick={toggleStatus}
                        className={`flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${data.status === 'ACTIVE' ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                    >
                        {data.status === 'ACTIVE' ? <Pause size={14} /> : <Play size={14} />}
                        <span>{data.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                    </button>

                    <button 
                        onClick={deleteAccount}
                        className={`flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${confirmDelete ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}
                    >
                        <Trash2 size={14} />
                        <span>{confirmDelete ? 'Confirm?' : 'Delete'}</span>
                    </button>
                </div>
            </div>

            {/* Main Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-4 right-6 lg:top-10 lg:right-10 z-10">
                    <div className={`px-4 py-1.5 ${risk.bg} ${risk.border} border ${risk.color} rounded-full text-[10px] font-black tracking-[0.2em] uppercase`}>
                        {risk.label}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                    <div className="flex items-center space-x-5 lg:space-x-8">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 shrink-0">
                            <Globe size={40} />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter truncate">{data.domain}</h1>
                            <p className="text-slate-500 font-bold truncate text-sm lg:text-base">{data.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-10 lg:space-x-16 w-full lg:w-auto lg:pr-10 border-t lg:border-t-0 border-slate-800 pt-8 lg:pt-0">
                        <div className="flex-1 lg:flex-none text-center lg:text-left">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Deliverability Score</p>
                            <p className={`text-5xl lg:text-7xl font-black tracking-tighter ${risk.color}`}>
                                {healthScore}<span className="text-2xl lg:text-3xl opacity-30">%</span>
                            </p>
                        </div>
                        <div className="hidden lg:block h-20 w-px bg-slate-800/50" />
                        <div className="flex-1 lg:flex-none space-y-1 text-center lg:text-left">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</p>
                            <div className="flex items-center justify-center lg:justify-start space-x-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${data.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse`} />
                                <span className="text-white font-black tracking-tight text-lg uppercase">{data.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Stats & AI) */}
                <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    {/* Warm-up Section */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 space-y-8 relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                            <h2 className="text-xl font-black text-white flex items-center space-x-3 tracking-tight">
                                <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                                    <Activity size={20} />
                                </div>
                                <span>Warm-up Pulse</span>
                            </h2>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Engine</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                            <div className="p-6 bg-slate-950/50 border border-slate-800/50 rounded-3xl space-y-2 group hover:border-blue-500/20 transition-all">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adaptive Send Limit</p>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-4xl font-black text-white">{data.warmupState?.currentCount || 0}</span>
                                    <span className="text-slate-600 font-bold">/ {data.adaptive?.adaptiveLimit || 0}</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                                        style={{ width: `${Math.min(100, ((data.warmupState?.currentCount || 0) / (data.adaptive?.adaptiveLimit || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-6 bg-slate-950/50 border border-slate-800/50 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trust Level</p>
                                <p className={`text-3xl font-black tracking-tight ${data.adaptive?.trustLevel === 'DEGRADED' ? 'text-rose-500' : 'text-white'}`}>
                                    {data.adaptive?.trustLevel || 'NEW'}
                                </p>
                                <div className="flex items-center space-x-1 mt-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div 
                                            key={i} 
                                            className={`h-1 flex-1 rounded-full ${i <= ['NEW', 'LEARNING', 'STABLE', 'ELEVATED'].indexOf(data.adaptive?.trustLevel || 'NEW') + 1 ? 'bg-blue-600' : 'bg-slate-800'}`} 
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-950/50 border border-slate-800/50 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reputation Trend</p>
                                <div className="flex items-center space-x-2">
                                    <TrendingUp size={24} className={data.adaptive?.trustTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'} style={{ transform: `rotate(${data.adaptive?.trustTrend * -45}deg)` }} />
                                    <p className="text-3xl font-black text-white tracking-tight">
                                        {data.adaptive?.trustTrend > 0 ? '+' : ''}{Math.round(data.adaptive?.trustTrend * 100)}%
                                    </p>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
                                    Momentum: {data.adaptive?.trustTrend >= 0 ? 'ACCELERATING' : 'DEGRADING'}
                                </p>
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Transmission Logs</h3>
                                <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</button>
                            </div>
                            <div className="space-y-3">
                                {data.emailLogs?.slice(0, 4).map((log: any) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-950/30 border border-slate-800/50 rounded-2xl hover:bg-slate-950 transition-colors">
                                        <div className="flex items-center space-x-4 min-w-0">
                                            <div className={`p-2.5 rounded-xl ${log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/10'}`}>
                                                <Mail size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{log.subject}</p>
                                                <p className="text-[10px] text-slate-600 font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ${log.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* DNS Panel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-white flex items-center space-x-3 tracking-tight">
                                <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                                    <ShieldCheck size={20} />
                                </div>
                                <span>Security Audit</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'SPF', val: latestDiag.spf },
                                { label: 'DKIM', val: latestDiag.dkim },
                                { label: 'DMARC', val: latestDiag.dmarc }
                            ].map((item) => (
                                <div key={item.label} className={`p-6 rounded-[2rem] border transition-all ${item.val ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'} group hover:scale-[1.02]`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                        {item.val ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
                                    </div>
                                    <p className={`text-3xl font-black ${item.val ? 'text-emerald-500' : 'text-rose-500'} tracking-tighter`}>{item.val ? 'PASS' : 'FAIL'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (AI & Meta) */}
                <div className="space-y-6 lg:space-y-8">
                    {/* AI Insights */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-white flex items-center space-x-2">
                                <Zap size={18} className="text-blue-500" />
                                <span>AI Logic</span>
                            </h2>
                            <div className="px-2 py-0.5 bg-blue-600/10 rounded-md border border-blue-600/20">
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Gemini 1.5</span>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 relative overflow-hidden">
                            {aiData.isOverridden && (
                                <div className="absolute top-0 right-0 px-4 py-1 bg-rose-600 text-[8px] font-black uppercase tracking-[0.2em] text-white transform rotate-45 translate-x-5 translate-y-3 shadow-2xl">
                                    Override
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2 text-blue-500">
                                    <Info size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Reasoning</span>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                    {aiData.reason || "Analyzing infrastructure baseline..."}
                                </p>
                            </div>

                            <div className="pt-5 border-t border-slate-800 grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">AI Recommendation</p>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${aiData.action === 'PROCEED' ? 'bg-emerald-500' : (aiData.action === 'SLOW_DOWN' ? 'bg-amber-500' : 'bg-rose-500')}`} />
                                        <p className={`text-lg font-black tracking-tight ${aiData.action === 'PROCEED' ? 'text-emerald-500' : (aiData.action === 'SLOW_DOWN' ? 'text-amber-500' : 'text-rose-500')}`}>
                                            {aiData.action || "WAITING"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 lg:p-8 space-y-6">
                        <h2 className="text-lg font-black text-white flex items-center space-x-2">
                            <Server size={18} className="text-blue-500" />
                            <span>System Health</span>
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/50 group hover:border-blue-500/20 transition-all">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">IP Reputation</span>
                                <span className={`text-sm font-black ${aiData.ipReputation >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {aiData.ipReputation || 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SMTP Stability</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">STABLE</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Pulse Action */}
                    <button 
                        onClick={startWarmup}
                        disabled={triggering || data.status !== 'ACTIVE'}
                        className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-20 text-white font-black py-7 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(37,99,235,0.4)] transition-all flex flex-col items-center justify-center space-y-1 group"
                    >
                        <div className="flex items-center space-x-3">
                            <Zap size={28} className="group-hover:scale-110 transition-transform text-white fill-current" />
                            <span className="text-2xl tracking-tighter uppercase italic">Pulse Send</span>
                        </div>
                        <span className="text-[10px] opacity-60 uppercase tracking-[0.3em]">Adaptive Execution</span>
                    </button>

                    {data.status === 'RISK_BLOCKED' && (
                        <div className="p-6 bg-rose-600/10 border border-rose-600/20 rounded-[2.5rem] flex items-start space-x-4">
                            <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                            <div>
                                <h3 className="text-rose-500 font-black tracking-tight text-xs uppercase mb-1">Automatic Safety Block</h3>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                    System detected critical deliverability risk. All warm-up operations are suspended until infrastructure is remediated.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
