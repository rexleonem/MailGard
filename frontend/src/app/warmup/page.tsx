'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ShieldCheck, Plus, Trash2, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Recipient {
    id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

export default function WarmupPoolPage() {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPool();
    }, []);

    const fetchPool = async () => {
        try {
            const response = await api.get('/warmup');
            setRecipients(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load recipients');
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        
        setSubmitting(true);
        setError(null);
        try {
            await api.post('/warmup', { email: newEmail });
            setNewEmail('');
            fetchPool();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add recipient');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/warmup/${id}`, { isActive: !currentStatus });
            fetchPool();
        } catch (err) {
            setError('Failed to update recipient');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this recipient?')) return;
        try {
            await api.delete(`/warmup/${id}`);
            fetchPool();
        } catch (err) {
            setError('Failed to delete recipient');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                            <ShieldCheck size={32} />
                        </div>
                        Warmup Pool
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Manage seed accounts for automated daily warming sequences.</p>
                </div>
            </div>

            {/* Add Recipient Form */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Mail size={120} />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Plus className="text-blue-500" size={20} />
                    Add New Seed Account
                </h2>

                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input 
                            type="email" 
                            placeholder="e.g. seeds@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-slate-600"
                            required
                        />
                    </div>
                    <button 
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        Add to Pool
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                        <XCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Pool List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-40 bg-slate-900/30 border border-slate-800 rounded-3xl animate-pulse" />
                    ))
                ) : recipients.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-flex p-6 bg-slate-900 rounded-full text-slate-700 mb-4">
                            <Mail size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500">Your seed pool is empty</h3>
                        <p className="text-slate-600 mt-1">Add your first recipient above to start diversifying your warmup traffic.</p>
                    </div>
                ) : (
                    recipients.map((item) => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all shadow-xl group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-blue-500">
                                    <Mail size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleToggle(item.id, item.isActive)}
                                        className={`p-2 rounded-xl transition-all ${item.isActive ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-slate-500 bg-slate-800 hover:bg-slate-700'}`}
                                        title={item.isActive ? 'Active' : 'Paused'}
                                    >
                                        {item.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        title="Remove"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white truncate mb-1">{item.email}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                Added {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
