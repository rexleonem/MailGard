'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
    Send, Mail, User, Type, FileText, 
    CheckCircle2, AlertTriangle, Clock, 
    ShieldCheck, Terminal, ChevronRight, Loader2,
    Eye, Edit3, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function TestSendPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<any>(null);
    const [formData, setFormData] = useState({
        recipient: '',
        subject: 'MailGard Deliverability Test',
        body: 'This is a manual deliverability test sent via the MailGard SMTP Testing Engine.'
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const { data } = await api.get('/accounts');
            console.log('TestSendPage: Fetched accounts:', data);
            // Filter only verified and non-blocked accounts
            const filtered = data.filter((a: any) => 
                a.status !== 'RISK_BLOCKED' && 
                a.diagnostics?.[0]?.spf && 
                a.diagnostics?.[0]?.dkim
            );
            console.log('TestSendPage: Filtered accounts:', filtered);
            setAccounts(filtered);
            if (filtered.length > 0) setSelectedAccount(filtered[0]);
        } catch (error) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;

        setSending(true);
        setSendStatus({ state: 'QUEUED', message: 'Adding to high-priority queue...' });

        try {
            const { data } = await api.post(`/accounts/${selectedAccount.id}/test-send`, formData);
            setSendStatus({ state: 'PROCESSING', message: 'Worker picked up job...', logId: data.logId });
            
            // Start polling for status
            pollStatus(data.logId);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to initiate send');
            setSendStatus({ state: 'FAILED', message: error.response?.data?.error || 'Initialization failed' });
            setSending(false);
        }
    };

    const pollStatus = async (logId: string) => {
        const interval = setInterval(async () => {
            try {
                const { data } = await api.get(`/accounts/logs/${logId}`);
                if (data.status === 'SENT') {
                    setSendStatus({ ...data, state: 'SUCCESS' });
                    setSending(false);
                    clearInterval(interval);
                    toast.success('Test email sent successfully!');
                } else if (data.status === 'FAILED') {
                    setSendStatus({ ...data, state: 'FAILED' });
                    setSending(false);
                    clearInterval(interval);
                    toast.error('SMTP Delivery Failed');
                }
            } catch (error) {
                clearInterval(interval);
                setSending(false);
            }
        }, 2000);
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tighter">Manual SMTP Test</h1>
                    <p className="text-slate-400 font-medium">Verify deliverability and SMTP stability in a controlled environment.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Selector & Composer */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Account Selector */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Select SMTP Account</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {accounts.length === 0 && !loading ? (
                                <div className="col-span-full py-12 text-center bg-slate-950/50 rounded-3xl border border-dashed border-slate-800">
                                    <AlertTriangle size={32} className="text-amber-500/20 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No verified SMTP accounts found</p>
                                    <Link href="/accounts" className="text-blue-500 text-[10px] font-black uppercase mt-2 block hover:underline">Connect an account</Link>
                                </div>
                            ) : (
                                accounts.map((acc) => (
                                    <button
                                        key={acc.id}
                                        onClick={() => setSelectedAccount(acc)}
                                        className={`p-6 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                                            selectedAccount?.id === acc.id 
                                                ? 'bg-blue-600/10 border-blue-600 shadow-lg shadow-blue-600/10' 
                                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className={`p-2 rounded-xl ${selectedAccount?.id === acc.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                                                <Mail size={16} />
                                            </div>
                                            <span className={`font-bold truncate ${selectedAccount?.id === acc.id ? 'text-white' : 'text-slate-400'}`}>
                                                {acc.email}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>{acc.domain}</span>
                                            <div className="flex items-center text-emerald-500">
                                                <ShieldCheck size={10} className="mr-1" />
                                                VERIFIED
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Email Composer */}
                    <form onSubmit={handleSend} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full" />
                        <h3 className="text-xl font-black text-white flex items-center space-x-3">
                            <Edit3 size={20} className="text-blue-500" />
                            <span>Email Composer</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Recipient Address</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input 
                                            type="email"
                                            required
                                            value={formData.recipient}
                                            onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600/50 outline-none transition-all font-medium"
                                            placeholder="hello@target.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Subject Line</label>
                                    <div className="relative group">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input 
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600/50 outline-none transition-all font-medium"
                                            placeholder="Test Subject"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Message Content</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-6 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <textarea 
                                        required
                                        rows={6}
                                        value={formData.body}
                                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-3xl py-5 pl-12 pr-4 focus:ring-2 focus:ring-blue-600/50 outline-none transition-all font-medium resize-none"
                                        placeholder="Write your test message here..."
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={sending || !selectedAccount}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-3 active:scale-[0.98]"
                        >
                            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            <span>{sending ? 'PROCESSING EXECUTION...' : 'INITIATE SECURE SEND'}</span>
                        </button>
                    </form>
                </div>

                {/* Right Column: AI & Status */}
                <div className="space-y-8">
                    {/* Deliverability Health Snapshot */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                        <h3 className="text-lg font-black text-white flex items-center space-x-2 mb-6">
                            <Activity size={18} className="text-emerald-500" />
                            <span>Deliverability Health</span>
                        </h3>
                        {selectedAccount ? (
                            <div className="space-y-6">
                                <HealthMetric label="Diagnostic Score" value={selectedAccount.diagnostics?.[0]?.ipScore || 0} color="emerald" />
                                <HealthMetric label="Trust Momentum" value={Math.round((selectedAccount.warmupState?.trustTrend || 0) * 100 + 50)} color="blue" />
                                <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                                    <AuthBadge label="SPF" active={selectedAccount.diagnostics?.[0]?.spf} />
                                    <AuthBadge label="DKIM" active={selectedAccount.diagnostics?.[0]?.dkim} />
                                    <AuthBadge label="DMARC" active={selectedAccount.diagnostics?.[0]?.dmarc} />
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-500 font-bold italic">Select an account to analyze</div>
                        )}
                    </div>

                    {/* AI Risk Insights */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full" />
                        <h3 className="text-lg font-black text-white flex items-center space-x-2 mb-6">
                            <ShieldCheck size={18} className="text-purple-500" />
                            <span>AI Risk Insights</span>
                        </h3>
                        {selectedAccount?.diagnostics?.[0]?.rawData ? (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-2xl border ${
                                    selectedAccount.diagnostics[0].rawData.risk === 'SAFE' 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                }`}>
                                    <div className="flex items-center space-x-2 mb-1">
                                        {selectedAccount.diagnostics[0].rawData.risk === 'SAFE' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                        <span className="font-black text-xs uppercase tracking-tighter">AI CLASSIFICATION: {selectedAccount.diagnostics[0].rawData.risk}</span>
                                    </div>
                                    <p className="text-xs font-semibold leading-relaxed opacity-80">{selectedAccount.diagnostics[0].rawData.reason}</p>
                                </div>
                                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Adaptive Recommendation</span>
                                    <p className="text-xs font-bold text-slate-300">Daily Safe Limit: {selectedAccount.diagnostics[0].rawData.recommended_daily_limit} emails</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center text-slate-500 font-bold italic">Waiting for AI analysis...</div>
                        )}
                    </div>

                    {/* Send Status Inspector */}
                    {sendStatus && (
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <h3 className="text-lg font-black text-white flex items-center space-x-2">
                                <Terminal size={18} className="text-blue-500" />
                                <span>Send Inspector</span>
                            </h3>
                            <div className="space-y-4">
                                <StatusStep label="Initialization" status={sendStatus.state === 'QUEUED' ? 'loading' : 'complete'} />
                                <StatusStep label="Queue Processing" status={sendStatus.state === 'PROCESSING' ? 'loading' : (['SUCCESS', 'FAILED'].includes(sendStatus.state) ? 'complete' : 'pending')} />
                                <StatusStep label="SMTP Handshake" status={sendStatus.state === 'SUCCESS' ? 'complete' : (sendStatus.state === 'FAILED' ? 'failed' : 'pending')} />
                                
                                {sendStatus.smtpResponse && (
                                    <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">SMTP Response</span>
                                        <code className="text-[10px] font-mono text-blue-400 break-all leading-tight">{sendStatus.smtpResponse}</code>
                                    </div>
                                )}
                                {sendStatus.error && (
                                    <div className="mt-4 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Error Reason</span>
                                        <p className="text-xs font-bold text-rose-400">{sendStatus.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function HealthMetric({ label, value, color }: any) {
    const colors: any = {
        emerald: 'bg-emerald-500 shadow-emerald-500/40',
        blue: 'bg-blue-600 shadow-blue-600/40'
    };
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>{label}</span>
                <span className="text-white">{value}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className={`h-full ${colors[color]} shadow-[0_0_10px] transition-all duration-1000`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function AuthBadge({ label, active }: any) {
    return (
        <div className="space-y-1">
            <div className={`text-[10px] font-black tracking-tighter ${active ? 'text-emerald-500' : 'text-rose-500'}`}>{label}</div>
            <div className={`mx-auto w-1 h-1 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'} ${active ? 'animate-pulse' : ''}`} />
        </div>
    );
}

function StatusStep({ label, status }: { label: string, status: 'complete' | 'loading' | 'pending' | 'failed' }) {
    const configs = {
        complete: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        loading: { icon: <Loader2 size={14} className="animate-spin" />, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
        pending: { icon: <Clock size={14} />, color: 'text-slate-600', bg: 'bg-slate-950 border-slate-800' },
        failed: { icon: <AlertTriangle size={14} />, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' }
    };
    const config = configs[status];
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${config.bg}`}>
            <span className={`text-xs font-bold ${status === 'pending' ? 'text-slate-600' : 'text-slate-300'}`}>{label}</span>
            <span className={config.color}>{config.icon}</span>
        </div>
    );
}
