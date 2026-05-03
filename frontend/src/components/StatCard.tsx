import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color = 'blue' }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
                    {description && <p className="text-slate-500 text-xs mt-2">{description}</p>}
                </div>
                {icon && (
                    <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};
