import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'cyan';
}

const colorMap: Record<StatCardProps['color'], { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-400' },
  green: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400' },
  yellow: { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400' },
  purple: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-400' },
  red: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400' },
  cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-700', text: 'text-cyan-400' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color }) => {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-lg p-4 flex items-center space-x-4`}>
      <div className={`${c.text} text-2xl flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        {subValue && <p className="text-xs text-gray-500 truncate">{subValue}</p>}
      </div>
    </div>
  );
};
