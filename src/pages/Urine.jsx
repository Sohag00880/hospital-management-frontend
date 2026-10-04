import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';

export default function Urine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');

  const load = async () => {
    try {
      const { data } = await api.get('/urine', { params: { search, dateFilter, page, limit: 15 } });
      setReports(data.data);
      setMeta({ total: data.total, pages: data.pages });
    } catch { toast.error('Failed to load'); }
  };

  useEffect(() => { load(); }, [search, dateFilter, page]);
  useEffect(() => { setPage(1); }, [search, dateFilter]);

  const del = async (id) => {
    if (!confirm('Delete this urine report?')) return;
    try { await api.delete(`/urine/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">🧪 Urine Reports</h1>
        <button onClick={() => navigate('/urine/new')} className="bg-blue-600 text-white px-4 py-2 rounded">
          + New Urine Report
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4 space-y-3">
        <input placeholder="Search by Patient ID / Name / Phone" className="border p-2 rounded w-full"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <DateFilter value={dateFilter} onChange={setDateFilter} />
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded inline-block">
          Total: {meta.total} reports
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Report No</th>
              <th className="p-3">Patient ID</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Age/Gender</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Test</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-3 font-mono text-xs">{r.reportNo}</td>
                <td className="p-3 font-mono text-xs">{r.patient?.patientId}</td>
                <td className="p-3">{r.patient?.name}</td>
                <td className="p-3 text-xs">{r.patient?.age}/{r.patient?.gender}</td>
                <td className="p-3 text-xs">{r.patient?.phone}</td>
                <td className="p-3 text-xs">{r.testName}</td>
                <td className="p-3 text-xs">{new Date(r.reportDate || r.createdAt).toLocaleDateString('en-GB')}</td>
                <td className="p-3 flex gap-1 flex-wrap">
                  <button onClick={() => navigate(`/urine/edit/${r._id}`)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">✎ Edit</button>
                  <button onClick={() => openPDF(`/reports/urine/${r._id}/pdf`)}
                    className="bg-slate-700 text-white px-2 py-1 rounded text-xs">🖨 Print</button>
                  <button onClick={() => del(r._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs">🗑 Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pages={meta.pages} onChange={setPage} />
      </div>
    </div>
  );
}