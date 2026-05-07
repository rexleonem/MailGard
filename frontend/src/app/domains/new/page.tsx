'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
    Mail, Server, Key, ArrowLeft, ShieldCheck, 
    AlertCircle, CheckCircle, RefreshCw, Loader2,
    ShieldAlert, Globe, Lock
} from 'lucide-react';
import Link from 'next/link';

type VerificationStep = 'IDLE' | 'CONNECTING' | 'AUTHENTICATING' | 'VERIFYING' | 'SUCCESS' | 'FAILED';

export default function NewDomain() {
    const [formData, setFormData] = useState({
        email: '',
        smtpHost: '',
        smtpPort: '587',
        password: ''
    });
    const [step, setStep] = useState<VerificationStep>('IDLE');
    const [error, setError] = useState({ message: '', code: '' });
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('CONNECTING');
        setError({ message: '', code: '' });

        // Simulate progress for UX
        const steps: VerificationStep[] = ['AUTHENTICATING', 'VERIFYING'];
        let currentStepIndex = 0;

        const interval = setInterval(() => {
            if (currentStepIndex < steps.length) {
                setStep(steps[currentStepIndex]);
                currentStepIndex++;
            } else {
                clearInterval(interval);
            }
        }, 1500);

        try {
            const res = await api.post('/accounts', formData);
            clearInterval(interval);
            setStep('SUCCESS');
            setTimeout(() => router.push('/'), 2000);
        } catch (err: any) {
            clearInterval(interval);
            console.error('Verification failed:', err.response?.data);
            setStep('FAILED');
            setError({
                message: err.response?.data?.reason || err.response?.data?.error || 'Verification failed. Please check your credentials and server settings.',
                code: err.response?.data?.code || 'AUTH_FAILURE'
            });
        }
    };

    const getStatusText = () => {
        switch (step) {
            case 'CONNECTING': return 'Handshaking with server...';
            case 'AUTHENTICATING': return 'Verifying credentials...';
            case 'VERIFYING': return 'Testing server response...';
            default: return '';
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]">
                    <CheckCircle size={48} className="text-emerald-500" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tight">Verified & Active</h1>
                    <p className="text-slate-400 max-w-sm mx-auto">SMTP handshake successful. Your domain is now secured and ready for the warm-up engine.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Overview</span>
            </Link>

            <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-widest">
                    <Lock size={12} />
                    <span>Secure Verification Gate</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter">Connect Domain</h1>
                <p className="text-slate-400 text-lg leading-relaxed">Only accounts that pass the 3-point SMTP authentication gate can be added to the platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                {step !== 'IDLE' && step !== 'FAILED' && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-10 flex flex-col items-center justify-center space-y-6 transition-all">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                            <Loader2 className="animate-spin text-blue-500 relative z-20" size={64} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-bold text-white">{getStatusText()}</p>
                            <p className="text-slate-500 text-sm font-medium italic">Establishing secure TLS tunnel...</p>
                        </div>
                    </div>
                )}

                {step === 'FAILED' && (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex flex-col space-y-3">
                        <div className="flex items-center space-x-3 text-rose-500">
                            <ShieldAlert size={24} />
                            <span className="text-lg font-black tracking-tight uppercase">{error.code}</span>
                        </div>
                        <p className="text-slate-300 font-medium pl-9">{error.message}</p>
                        <button 
                            type="button"
                            onClick={() => setStep('IDLE')}
                            className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest pl-9 w-fit"
                        >
                            Try Different Credentials →
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input 
                                type="email" 
                                required 
                                placeholder="sender@yourdomain.com"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl pl-14 pr-6 py-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-lg font-medium"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">SMTP Server</label>
                            <div className="relative group">
                                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="smtp.gmail.com"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl pl-14 pr-6 py-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-lg font-medium"
                                    value={formData.smtpHost}
                                    onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Port</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-lg font-medium text-center"
                                value={formData.smtpPort}
                                onChange={(e) => setFormData({...formData, smtpPort: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">App Password / Secret Key</label>
                        <div className="relative group">
                            <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl pl-14 pr-6 py-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-lg font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        <div className="flex items-start space-x-2 p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50 mt-4">
                            <ShieldCheck size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                We utilize AES-256-CTR encryption at rest. Your credentials are only ever decrypted in an isolated worker memory space during authorized sending operations.
                            </p>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={step !== 'IDLE' && step !== 'FAILED'}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_60px_-12px_rgba(37,99,235,0.6)] transition-all flex items-center justify-center space-x-3 text-xl group"
                >
                    <ShieldCheck size={28} className="group-hover:scale-110 transition-transform" />
                    <span>Run Verification & Connect</span>
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                    <Server size={24} className="text-blue-500" />
                    <h3 className="text-white font-bold text-sm tracking-tight">Auto-Port Detection</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Supports 587, 465, 25</p>
                </div>
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                    <ShieldCheck size={24} className="text-blue-500" />
                    <h3 className="text-white font-bold text-sm tracking-tight">Handshake Audit</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">TLS 1.2+ Required</p>
                </div>
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                    <RefreshCw size={24} className="text-blue-500" />
                    <h3 className="text-white font-bold text-sm tracking-tight">Zero-Dry Run</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Passive Connection Only</p>
                </div>
            </div>
        </div>
    );
}
