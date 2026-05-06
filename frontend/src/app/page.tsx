'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Activity, Shield, AlertTriangle, Plus, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/accounts')
            .then(res => setAccounts(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Deliverability Overview</h1>
                    <p className="text-slate-400 mt-1">Monitor and manage your SMTP sending reputation.</p>
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                    <Plus size={20} />
                    <span>Add Domain</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Shield className="text-emerald-500" />} label="Healthy Domains" value={accounts.filter(a => a.status === 'ACTIVE').length} color="emerald" />
                <StatCard icon={<AlertTriangle className="text-amber-500" />} label="At Risk" value={accounts.filter(a => a.status === 'RISK_BLOCKED').length} color="amber" />
                <StatCard icon={<Activity className="text-blue-500" />} label="Warm-up Active" value={accounts.filter(a => a.warmupState?.dayNumber > 1).length} color="blue" />
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Connected Domains</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search domains..." 
                            className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Domain</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Score</th>
                                <th className="px-6 py-4 font-medium">DNS Health</th>
                                <th className="px-6 py-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {accounts.map((account) => (
                                <tr key={account.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{account.domain}</span>
                                            <span className="text-xs text-slate-500">{account.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={account.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${account.diagnostics[0]?.ipScore > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                    style={{ width: `${account.diagnostics[0]?.ipScore || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-slate-300">{account.diagnostics[0]?.ipScore || '--'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-1">
                                            <DnsDot active={account.diagnostics[0]?.spf} label="SPF" />
                                            <DnsDot active={account.diagnostics[0]?.dkim} label="DKIM" />
                                            <DnsDot active={account.diagnostics[0]?.dmarc} label="DMARC" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/domains/${account.id}`}>
                                            <ChevronRight className="text-slate-600 group-hover:text-blue-500 transition-colors inline-block" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                    {icon}
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
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
        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${colors[status]}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

function DnsDot({ active, label }: { active: boolean, label: string }) {
    return (
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} title={label} />
    );
}
