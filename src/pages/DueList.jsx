import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';

export default function DueList() {
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, totalDue: 0 });
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('today');
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState(0);

  const load = () => {
    api
      .get('/patients/due-list', { params: { dateFilter, page, limit: 15 } })
      .then((r) => {
        setOrders(r.data.data);
        setMeta({
          total: r.data.total,
          pages: r.data.pages,
          totalDue: r.data.totalDue,
        });
      });
  };

  useEffect(() => {
    load();
  }, [dateFilter, page]);

  const openPay = (order) => {
    setPayModal(order);
    setPayAmount(order.dueAmount);
  };

  const confirmPay = async () => {
    if (!payModal) return;
    try {
      await api.put(`/test-orders/${payModal._id}/payment`, {
        paidAmount: (payModal.paidAmount || 0) + Number(payAmount),
      });
      toast.success('Payment added');
      setPayModal(null);
      setPayAmount(0);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Due List</h1>

      <div className="bg-white p-4 rounded shadow mb-4 space-y-3">
        <DateFilter
          value={dateFilter}
          onChange={(v) => {
            setDateFilter(v);
            setPage(1);
          }}
        />
        <div className="flex gap-3 flex-wrap">
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
            Total Orders: {meta.total}
          </div>
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded font-bold">
            Total Due: Tk. {meta.totalDue}
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Order No</th>
              <th className="p-3">Patient ID</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Due</th>
              {isAdmin && <th className="p-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-3 font-mono text-xs">{o.orderNo}</td>
                <td className="p-3 font-mono text-xs">
                  {o.patient?.patientId}
                </td>
                <td className="p-3">{o.patient?.name}</td>
                <td className="p-3">{o.patient?.phone}</td>
                <td className="p-3 text-xs">
                  {new Date(o.createdAt).toLocaleDateString('en-GB')}
                </td>
                <td className="p-3">Tk. {o.totalAmount}</td>
                <td className="p-3">Tk. {o.paidAmount}</td>
                <td className="p-3 text-red-600 font-bold">
                  Tk. {o.dueAmount}
                </td>
                {isAdmin && (
                  <td className="p-3">
                    <button
                      onClick={() => openPay(o)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                    >
                      💸 Add Pay
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pages={meta.pages} onChange={setPage} />
      </div>

      {payModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="font-bold text-lg mb-3">Add Payment</h3>
            <p className="text-sm mb-2">
              Patient: <strong>{payModal.patient?.name}</strong>
            </p>
            <p className="text-sm mb-2">
              Order: <span className="font-mono">{payModal.orderNo}</span>
            </p>
            <p className="text-sm mb-3">
              Current Due: <strong>Tk. {payModal.dueAmount}</strong>
            </p>
            <label className="text-xs text-slate-500">Amount to Pay:</label>
            <input
              type="number"
              className="border p-2 rounded w-full mt-1 mb-3"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPayModal(null)}
                className="flex-1 bg-slate-300 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmPay}
                className="flex-1 bg-green-600 text-white py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}