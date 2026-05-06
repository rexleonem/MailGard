'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            router.push('/');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl relative z-10">
                {/* Visual Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 text-white">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter">MailGard</span>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <h2 className="text-4xl font-bold text-white leading-tight">
                            Master Your Email <br /> 
                            <span className="text-blue-200">Deliverability.</span>
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed">
                            Stop landing in spam. Use AI-driven diagnostics and automated warm-ups to protect your sender reputation.
                        </p>
                        
                        <div className="space-y-4 pt-4">
                            {[
                                { icon: <Sparkles size={18} />, text: 'AI Risk Intelligence' },
                                { icon: <Activity size={18} />, text: 'Automated Warm-up' },
                                { icon: <ShieldCheck size={18} />, text: 'DNS Health Monitoring' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center space-x-3 text-white/90 font-medium">
                                    <div className="text-blue-300">{item.icon}</div>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-12">
                        <p className="text-blue-200/50 text-xs font-bold tracking-widest uppercase">Trusted by 1000+ senders</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10 lg:hidden">
                        <div className="flex items-center space-x-3 text-white mb-8">
                            <div className="p-2 bg-blue-600 rounded-xl">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter">MailGard</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-10">
                        <h1 className="text-3xl font-black text-white">Sign In</h1>
                        <p className="text-slate-500">Welcome back! Please enter your details.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-700"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-600" />
                                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</a>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 group"
                        >
                            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 mt-10 text-sm">
                        New to MailGard? <Link href="/register" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function Activity({ size, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
