'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Mail, Shield, LogOut, ArrowLeft, Key } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Settings() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        api.get('/auth/me').then(res => setUser(res.data));
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (!user) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
            </Link>

            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-white tracking-tight">System Settings</h1>
                <p className="text-slate-400">Manage your profile and security credentials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                            <User size={20} className="text-blue-500" />
                            <span>Personal Information</span>
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white mt-1">
                                    {user.name}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white mt-1">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                            <Shield size={20} className="text-blue-500" />
                            <span>Security</span>
                        </h2>
                        <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-start space-x-4">
                            <Key className="text-blue-500 mt-1" size={24} />
                            <div>
                                <h3 className="text-white font-bold">API Security</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Your data is protected by the MailGard Zero-Trust architecture. Credentials are only decrypted during active delivery jobs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
                        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={40} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">{user.name}</h3>
                        <p className="text-sm text-slate-500 uppercase font-black tracking-widest mt-1">Pro Member</p>
                        
                        <div className="pt-6 border-t border-slate-800 mt-6">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center justify-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 py-3 rounded-xl transition-all font-bold"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
