import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => { api.get('/dashboard/stats').then((r) => setStats(r.data)); }, []);

  const cards = [
    { label: "Today's Patients", value: stats.todayPatients || 0, color: 'bg-blue-500' },
    { label: "Today's Tests", value: stats.todayTests || 0, color: 'bg-emerald-500' },
    { label: "Today's Revenue", value: `৳${stats.todayRevenue || 0}`, color: 'bg-green-600' },
    { label: "Today's Due", value: `৳${stats.todayDue || 0}`, color: 'bg-red-500' },
    { label: 'Pending Results', value: stats.pendingResults || 0, color: 'bg-yellow-500' },
    { label: 'Waiting Permission', value: stats.pendingPermit || 0, color: 'bg-purple-500' },
    { label: 'Admitted Patients', value: stats.admitted || 0, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.color} text-white p-5 rounded shadow`}>
            <p className="text-sm opacity-90">{c.label}</p>
            <p className="text-3xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}