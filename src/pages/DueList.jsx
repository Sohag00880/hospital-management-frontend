import { useEffect, useState } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';

export default function DueList() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, totalDue: 0 });
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    api.get('/patients/due-list', { params: { dateFilter, page, limit: 15 } })
      .then((r) => {
        setOrders(r.data.data);
        setMeta({ total: r.data.total, pages: r.data.pages, totalDue: r.data.totalDue });
      });
  }, [dateFilter, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Due List</h1>
      <div className="bg-white p-4 rounded shadow mb-4 space-y-3">
        <DateFilter value={dateFilter} onChange={(v) => { setDateFilter(v); setPage(1); }} />
        <div className="flex gap-3 flex-wrap">
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">Total Orders: {meta.total}</div>
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded font-bold">Total Due: ৳{meta.totalDue}</div>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Order No</th><th className="p-3">Patient ID</th>
              <th className="p-3">Patient</th><th className="p-3">Phone</th>
              <th className="p-3">Date</th><th className="p-3">Total</th>
              <th className="p-3">Paid</th><th className="p-3">Due</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-3 font-mono text-xs">{o.orderNo}</td>
                <td className="p-3 font-mono text-xs">{o.patient?.patientId}</td>
                <td className="p-3">{o.patient?.name}</td>
                <td className="p-3">{o.patient?.phone}</td>
                <td className="p-3 text-xs">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                <td className="p-3">৳{o.totalAmount}</td>
                <td className="p-3">৳{o.paidAmount}</td>
                <td className="p-3 text-red-600 font-bold">৳{o.dueAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pages={meta.pages} onChange={setPage} />
      </div>
    </div>
  );
}