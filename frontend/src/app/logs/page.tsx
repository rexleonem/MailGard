'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
    Search, Filter, History, Mail, 
    CheckCircle2, XCircle, AlertCircle, 
    ChevronLeft, ChevronRight, Eye, 
    Download, Clock, Terminal, ShieldCheck,
    Loader2, User, Type, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    useEffect(() => {
        fetchLogs();
    }, [page, statusFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/accounts/logs', {
                params: { page, search, status: statusFilter }
            });
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const exportLogs = () => {
        const headers = ['Timestamp', 'Sender', 'Recipient', 'Subject', 'Status', 'Response'];
        const csv = [
            headers.join(','),
            ...logs.map(log => [
                format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                log.account?.email,
                log.recipient,
                `"${log.subject}"`,
                log.status,
                `"${log.smtpResponse || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mailgard-logs-${format(new Date(), 'yyyyMMdd')}.csv`;
        a.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tighter">Delivery History</h1>
                    <p className="text-slate-400 font-medium">Trace every email, audit SMTP responses, and debug deliverability events.</p>
                </div>
                <button 
                    onClick={exportLogs}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-black/20 active:scale-95"
                >
                    <Download size={18} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 flex flex-col md:flex-row gap-4 shadow-2xl">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search recipient, subject, or domain..."
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-600/50 outline-none transition-all font-medium"
                    />
                </form>
                <div className="flex gap-4">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white rounded-2xl py-3 px-6 focus:ring-2 focus:ring-blue-600/50 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="SENT">Sent</option>
                        <option value="FAILED">Failed</option>
                        <option value="QUEUED">Queued</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="BLOCKED">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                )}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Date</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sender</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {logs.map((log) => (
                                <tr key={log.id} className="group hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{log.id.slice(0, 8)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-slate-950 rounded-xl text-slate-500 group-hover:text-blue-500 transition-colors">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-300">{log.account?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-400">{log.recipient}</td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={log.status} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-3 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all shadow-inner active:scale-90"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && (
                    <div className="px-8 py-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/30">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Page {pagination.currentPage} of {pagination.pages}
                        </span>
                        <div className="flex space-x-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                disabled={page === pagination.pages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                            <div className="flex items-center space-x-4">
                                <div className={`p-4 rounded-[1.5rem] ${
                                    selectedLog.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                } shadow-inner`}>
                                    <History size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tighter">Log Inspection</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Job ID: {selectedLog.jobId || 'N/A'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Execution Timeline */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                                        <Clock size={16} className="text-blue-500 mr-2" />
                                        Execution Timeline
                                    </h3>
                                    <div className="space-y-4 border-l-2 border-slate-800 pl-6 ml-2">
                                        <TimelineStep label="Job Created" time={format(new Date(selectedLog.createdAt), 'HH:mm:ss')} active={true} />
                                        <TimelineStep label="Worker Handshake" time={format(new Date(selectedLog.createdAt), 'HH:mm:ss')} active={!!selectedLog.workerId} />
                                        <TimelineStep label="SMTP Execution" time={format(new Date(selectedLog.createdAt), 'HH:mm:ss')} active={selectedLog.status === 'SENT'} />
                                    </div>

                                    {selectedLog.smtpResponse && (
                                        <div className="p-6 bg-slate-950 rounded-[2rem] border border-slate-800 space-y-3">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                                                <Terminal size={14} className="mr-2" /> SMTP Server Response
                                            </span>
                                            <code className="text-xs font-mono text-emerald-400 break-all leading-relaxed bg-black/30 p-4 rounded-xl block border border-emerald-500/10">
                                                {selectedLog.smtpResponse}
                                            </code>
                                        </div>
                                    )}
                                </div>

                                {/* Metadata & Insights */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                                        <ShieldCheck size={16} className="text-purple-500 mr-2" />
                                        AI & Safety State
                                    </h3>
                                    
                                    <div className="bg-slate-950 rounded-[2rem] p-6 border border-slate-800 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Worker ID</span>
                                                <p className="text-xs font-bold text-white font-mono truncate">{selectedLog.workerId || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retries</span>
                                                <p className="text-xs font-bold text-white">{selectedLog.retryCount || 0}</p>
                                            </div>
                                        </div>

                                        {selectedLog.aiDecision && (
                                            <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">AI Risk Decision</span>
                                                    <span className="px-2 py-0.5 bg-purple-500 text-white text-[8px] font-black rounded-md">{selectedLog.aiDecision.risk}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">"{selectedLog.aiDecision.reason}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Email Header Snapshot */}
                                    <div className="bg-slate-950 rounded-[2rem] p-6 border border-slate-800 space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Headers Snapshot</h4>
                                        <div className="space-y-3">
                                            <HeaderItem label="From" value={selectedLog.account?.email} icon={<User size={12} />} />
                                            <HeaderItem label="To" value={selectedLog.recipient} icon={<User size={12} />} />
                                            <HeaderItem label="Subject" value={selectedLog.subject} icon={<Type size={12} />} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedLog.error && (
                                <div className="p-6 bg-rose-500/10 rounded-[2rem] border border-rose-500/20 flex items-start space-x-4">
                                    <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-rose-500 uppercase tracking-widest text-xs mb-1">Execution Failure Detected</h4>
                                        <p className="text-sm font-bold text-rose-200">{selectedLog.error}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-800 bg-slate-950/30 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3 rounded-2xl transition-all active:scale-95"
                            >
                                CLOSE INSPECTOR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: any = {
        SENT: { label: 'Sent', icon: <CheckCircle2 size={12} />, bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        FAILED: { label: 'Failed', icon: <XCircle size={12} />, bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        QUEUED: { label: 'Queued', icon: <Clock size={12} />, bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        PROCESSING: { label: 'Active', icon: <Loader2 size={12} className="animate-spin" />, bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        BLOCKED: { label: 'Blocked', icon: <ShieldCheck size={12} />, bg: 'bg-slate-800 text-slate-400 border-slate-700' }
    };
    const config = configs[status] || configs.FAILED;
    return (
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${config.bg}`}>
            {config.icon}
            <span>{config.label}</span>
        </div>
    );
}

function TimelineStep({ label, time, active }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{time}</span>
        </div>
    );
}

function HeaderItem({ label, value, icon }: any) {
    return (
        <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-500">
                {icon}
                <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
            </div>
            <span className="font-bold text-slate-300 max-w-[200px] truncate">{value}</span>
        </div>
    );
}
