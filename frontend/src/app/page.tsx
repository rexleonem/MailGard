import { StatCard } from "@/components/StatCard";
import { Mail, ShieldCheck, Zap, AlertTriangle } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">System Overview</h1>
        <p className="text-slate-400 mt-2">Real-time deliverability metrics and risk status across all monitored domains.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Domains" 
          value="12" 
          icon={<Mail size={24} />} 
          color="blue"
        />
        <StatCard 
          title="Active Warm-up" 
          value="8" 
          icon={<Zap size={24} />} 
          color="amber"
          description="+2 in last 24h"
        />
        <StatCard 
          title="Avg Health Score" 
          value="94%" 
          icon={<ShieldCheck size={24} />} 
          color="emerald"
        />
        <StatCard 
          title="Risk Alerts" 
          value="1" 
          icon={<AlertTriangle size={24} />} 
          color="rose"
          description="Action required"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button className="text-sm text-blue-500 hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800/50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Email sent via info@cryptofy.com</p>
                    <p className="text-xs text-slate-500">Recipient: user_{i}@gmail.com • 5m ago</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                  SUCCESS
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Risk Distribution</h2>
          <div className="space-y-6">
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-emerald-400">Safe Domains</span>
                    <span className="text-white">10</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '83%' }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-amber-400">Caution Required</span>
                    <span className="text-white">1</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: '8%' }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-rose-400">High Risk / Blocked</span>
                    <span className="text-white">1</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: '8%' }}></div>
                </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center">
                <ShieldCheck size={16} className="mr-2" />
                AI Recommendation
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
                System is performing optimally. We recommend increasing the daily limit for "cryptofy.com" by 5% as engagement rates are stable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
