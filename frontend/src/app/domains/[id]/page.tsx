import React from 'react';
import { DNSStatusCard } from '@/components/DNSStatusCard';
import { StatCard } from '@/components/StatCard';
import { Shield, Activity, BarChart3, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DomainDetailPage({ params }: { params: { id: string } }) {
  // Mock data for now
  const domain = {
    email: 'info@cryptofy.digital',
    domain: 'cryptofy.digital',
    status: 'ACTIVE',
    healthScore: 88,
    diagnostics: {
        spf: true,
        dkim: true,
        dmarc: false,
        ipScore: 12
    },
    warmup: {
        currentCount: 8,
        dailyLimit: 10,
        dayNumber: 5
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Link href="/" className="flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">{domain.email}</h1>
          <p className="text-slate-400 mt-1">Status: <span className="text-emerald-500 font-semibold">{domain.status}</span></p>
        </div>
        <div className="flex space-x-4">
            <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700">
                Run Diagnostic
            </button>
            <button className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors">
                Pause Warming
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Health Score Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle 
                        cx="80" cy="80" r="70" 
                        stroke="currentColor" strokeWidth="12" fill="transparent" 
                        className="text-slate-800" 
                    />
                    <circle 
                        cx="80" cy="80" r="70" 
                        stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * domain.healthScore) / 100}
                        className="text-blue-500 transition-all duration-1000" 
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{domain.healthScore}%</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Health Score</span>
                </div>
            </div>
            <p className="mt-6 text-sm text-slate-400">
                Excellent reputation. Domain is safe for standard operations.
            </p>
        </div>

        {/* DNS Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
                <Shield size={20} className="mr-2 text-blue-500" />
                DNS Diagnostics
            </h3>
            <DNSStatusCard label="SPF Record" status={domain.diagnostics.spf} description="v=spf1 include:spf.cpanel.net ..." />
            <DNSStatusCard label="DKIM Record" status={domain.diagnostics.dkim} description="default._domainkey.cryptofy.digital" />
            <DNSStatusCard label="DMARC Record" status={domain.diagnostics.dmarc} description="Policy not found" />
            
            <div className="pt-2">
                <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded border border-slate-800">
                    <span className="text-sm text-slate-400">IP Reputation Score</span>
                    <span className="text-sm font-bold text-emerald-400">{domain.diagnostics.ipScore}/100</span>
                </div>
            </div>
        </div>

        {/* Warm-up Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center">
                <Activity size={20} className="mr-2 text-amber-500" />
                Warm-up Progress
            </h3>
            
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Daily Progress</span>
                    <span className="text-white font-bold">{domain.warmup.currentCount} / {domain.warmup.dailyLimit}</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                        className="bg-amber-500 h-full transition-all duration-1000" 
                        style={{ width: `${(domain.warmup.currentCount / domain.warmup.dailyLimit) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/30 rounded border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Day Number</p>
                    <p className="text-lg font-bold text-white">{domain.warmup.dayNumber}</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Send Interval</p>
                    <p className="text-lg font-bold text-white">~45 mins</p>
                </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start">
                <Clock size={16} className="text-amber-500 mr-3 mt-1 shrink-0" />
                <p className="text-xs text-slate-400">
                    Gradual ramp-up active. AI has set today's limit based on historical deliverability data.
                </p>
            </div>
        </div>
      </div>

      {/* AI Reasoning Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Shield size={24} className="mr-3 text-indigo-500" />
            Gemini AI Risk Assessment
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-lg">
                    <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-widest">Reasoning</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        "The domain has strong SPF and DKIM signatures, which are essential for authentication. However, the absence of a DMARC policy represents a minor risk for spoofing. The IP reputation is excellent (12/100), and historical engagement is high. Recommending a safe increase in daily volume."
                    </p>
                </div>
                <div className="flex space-x-4">
                    <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Action Plan</span>
                        <p className="text-white font-bold mt-1 uppercase">PROCEED</p>
                    </div>
                    <div className="flex-1 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">Recommended Limit</span>
                        <p className="text-white font-bold mt-1">20 emails/day</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-6 border border-slate-800 font-mono text-xs overflow-auto">
                <pre className="text-slate-500">
                    {JSON.stringify({
                        risk: "SAFE",
                        score: 88,
                        recommended_daily_limit: 20,
                        action: "PROCEED",
                        reason: "Strong authentication and clean IP history."
                    }, null, 2)}
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
}
