import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface DNSStatusCardProps {
    label: string;
    status: boolean;
    description?: string;
}

export const DNSStatusCard: React.FC<DNSStatusCardProps> = ({ label, status, description }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-300">{label}</span>
                {description && <span className="text-xs text-slate-500">{description}</span>}
            </div>
            {status ? (
                <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    VALID
                </div>
            ) : (
                <div className="flex items-center text-rose-500 bg-rose-500/10 px-2 py-1 rounded text-xs font-bold">
                    <XCircle className="w-4 h-4 mr-1" />
                    MISSING
                </div>
            )}
        </div>
    );
};
