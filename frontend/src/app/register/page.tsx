'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { email, password, name });
            localStorage.setItem('token', res.data.token);
            router.push('/');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl relative z-10">
                {/* Visual Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 relative overflow-hidden">
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
                            Build Your <br /> 
                            <span className="text-blue-200">Sender Legacy.</span>
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed">
                            Join thousands of elite senders who trust MailGard to keep their infrastructure pristine and their emails in the primary inbox.
                        </p>
                        
                        <div className="space-y-4 pt-4">
                            {[
                                { icon: <User size={18} />, text: 'Multi-account Management' },
                                { icon: <Sparkles size={18} />, text: 'Real-time Risk Scoring' },
                                { icon: <ShieldCheck size={18} />, text: 'Production-ready SMTP' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center space-x-3 text-white/90 font-medium">
                                    <div className="text-blue-300">{item.icon}</div>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 text-blue-200/50">
                        <p className="text-xs font-bold tracking-widest uppercase italic">"The gold standard for deliverability."</p>
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
                        <h1 className="text-3xl font-black text-white">Create Account</h1>
                        <p className="text-slate-500">Get started for free. No credit card required.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="John Doe"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-700"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

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

                        <div className="pt-2">
                            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                                By clicking "Create Account", you agree to our <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 group mt-4"
                        >
                            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 mt-8 text-sm">
                        Already have an account? <Link href="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
