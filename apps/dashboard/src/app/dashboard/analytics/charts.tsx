'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ChartProps {
  verified: number;
  tampered: number;
}

export function OutcomesChart({ verified, tampered }: ChartProps) {
  const data = [
    { name: 'Verified', value: verified, color: '#10b981' }, // emerald-500
    { name: 'Tampered', value: tampered, color: '#ef4444' }, // red-500
  ];

  if (verified === 0 && tampered === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
            contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
            itemStyle={{ color: 'var(--foreground)' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

