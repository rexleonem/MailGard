'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    Mail, Server, Key, ArrowLeft, ShieldCheck, 
    AlertCircle, CheckCircle, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';

export default function NewDomain() {
    const [formData, setFormData] = useState({
        email: '',
        smtpHost: '',
        smtpPort: '587',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/accounts', formData);
            setSuccess(true);
            setTimeout(() => router.push('/'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add domain');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Domain Added!</h1>
                    <p className="text-slate-400 mt-2">Running initial diagnostics and AI risk analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Overview</span>
            </Link>

            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-white tracking-tight">Add New Domain</h1>
                <p className="text-slate-400">Connect an SMTP account to start warming up and monitoring.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-3 text-rose-500">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sender Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                required 
                                placeholder="sender@yourdomain.com"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">SMTP Host</label>
                        <div className="relative">
                            <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                required 
                                placeholder="smtp.provider.com"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                value={formData.smtpHost}
                                onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 w-32">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Port</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                            value={formData.smtpPort}
                            onChange={(e) => setFormData({...formData, smtpPort: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">SMTP Password / App Key</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        <p className="text-[10px] text-slate-600 italic mt-1 ml-1">
                            * Your credentials are encrypted with AES-256-CTR and never stored in plain text.
                        </p>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 group"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            <span>Validating SMTP...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={20} />
                            <span>Securely Add Domain</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
