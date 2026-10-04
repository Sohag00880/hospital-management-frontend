import { useEffect, useState } from 'react';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import DateFilter from '../components/DateFilter';

export default function Permissions() {
  const { user } = useAuth();
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const [results, setResults] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState(0);

  const load = () => api.get('/results/permission-requests', { params: { dateFilter } })
    .then((r) => setResults(r.data));
  useEffect(() => { load(); }, [dateFilter]);

  const permit = async (id) => {
    try { await api.put(`/results/${id}/permit`); toast.success('Permission granted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };
  const release = async (id) => {
    try { await api.put(`/results/${id}/release`); toast.success('Released'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };
  const changeStatus = async (id, status) => {
    try { await api.put(`/results/${id}/change-status`, { status }); toast.success('Status changed'); load(); }
    catch { toast.error('Error'); }
  };
  const openPay = (r) => {
    setPayModal(r);
    // Find matching order and get due
    api.get(`/test-orders/${r.order}`).then((res) => {
      setPayAmount(res.data.dueAmount);
    });
  };
  const confirmPay = async () => {
    if (!payModal) return;
    try {
      await api.put(`/test-orders/${payModal.order}/payment`, { paidAmount: (payModal.orderPaid || 0) + Number(payAmount) });
      await api.put(`/results/${payModal._id}/confirm`);
      toast.success('Payment added & Confirmed');
      setPayModal(null); setPayAmount(0); load();
    } catch { toast.error('Error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports & Permission</h1>
      <div className="bg-white p-3 rounded shadow mb-4">
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Report No</th><th className="p-3">Patient ID</th>
              <th className="p-3">Patient</th><th className="p-3">Test</th>
              <th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-3 font-mono text-xs">{r.reportNo || '-'}</td>
                <td className="p-3 font-mono text-xs">{r.patient?.patientId}</td>
                <td className="p-3">{r.patient?.name}</td>
                <td className="p-3">{r.testName}</td>
                <td className="p-3 text-xs">{new Date(r.updatedAt).toLocaleDateString('en-GB')}</td>
                <td className="p-3 text-xs">{r.status}</td>
                <td className="p-3 flex gap-2 flex-wrap">
                  {r.status === 'SUBMITTED' && isAdmin && (
                    <>
                      <button onClick={() => permit(r._id)} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">✅ Permit</button>
                      <button onClick={() => openPay(r)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">💸 Add Pay</button>
                    </>
                  )}
                  {r.status === 'PERMITTED' && (
                    <>
                      <button onClick={() => release(r._id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Release</button>
                      <button onClick={() => openPDF(`/reports/${r._id}/pdf`)} className="bg-slate-700 text-white px-2 py-1 rounded text-xs">🖨 Print</button>
                      {isAdmin && (
                        <button onClick={() => changeStatus(r._id, 'SUBMITTED')} className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">↺ Revert</button>
                      )}
                    </>
                  )}
                  {r.status === 'RELEASED' && (
                    <>
                      <button onClick={() => openPDF(`/reports/${r._id}/pdf`)} className="bg-slate-700 text-white px-2 py-1 rounded text-xs">🖨 Print</button>
                      {isAdmin && (
                        <button onClick={() => changeStatus(r._id, 'SUBMITTED')} className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">↺ Revert</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="font-bold text-lg mb-3">Add Payment</h3>
            <p className="text-sm mb-2">Patient: {payModal.patient?.name}</p>
            <p className="text-sm mb-3">Test: {payModal.testName}</p>
            <input type="number" className="border p-2 rounded w-full mb-3"
              value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setPayModal(null)} className="flex-1 bg-slate-300 py-2 rounded">Cancel</button>
              <button onClick={confirmPay} className="flex-1 bg-green-600 text-white py-2 rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}