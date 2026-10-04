import { useEffect, useState } from 'react';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';

export default function TestOrders() {
  const [tests, setTests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patient, setPatient] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, totalAmount: 0, totalPaid: 0, totalDue: 0 });

  const load = async () => {
    const { data } = await api.get('/test-orders', {
      params: { search, dateFilter, page, limit: 15 },
    });
    setOrders(data.data);
    setMeta({ total: data.total, pages: data.pages, totalAmount: data.totalAmount, totalPaid: data.totalPaid, totalDue: data.totalDue });
  };
  useEffect(() => { api.get('/tests').then((r) => setTests(r.data)); }, []);
  useEffect(() => { load(); }, [search, dateFilter, page]);
  useEffect(() => { setPage(1); }, [search, dateFilter]);

  const findPatient = async () => {
    if (!patientIdInput.trim()) return;
    try {
      const { data } = await api.get(`/test-orders/find-patient/${patientIdInput.trim()}`);
      setPatient(data);
      toast.success(`Patient: ${data.name}`);
    } catch { toast.error('Patient not found'); setPatient(null); }
  };

  const testFee = (t) => {
    const paramSum = (t.parameters || []).reduce((a, p) => a + (p.fee || 0), 0);
    return paramSum > 0 ? paramSum : t.baseFee;
  };

  const total = tests.filter((t) => selectedTests.includes(t._id)).reduce((s, t) => s + testFee(t), 0);

  const submit = async () => {
    if (!patient || selectedTests.length === 0) return toast.error('Select patient & tests');
    try {
      await api.post('/test-orders', {
        patient: patient._id, doctor: patient.doctor?._id, testIds: selectedTests, paidAmount,
      });
      toast.success('Order created');
      setPatient(null); setPatientIdInput(''); setSelectedTests([]); setPaidAmount(0); load();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Test Orders</h1>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex gap-2 mb-3">
          <input placeholder="Enter Patient ID (e.g. BH261003001)" className="border p-2 rounded flex-1"
            value={patientIdInput} onChange={(e) => setPatientIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && findPatient()} />
          <button onClick={findPatient} className="bg-blue-600 text-white px-4 py-2 rounded">Find</button>
        </div>

        {patient && (
          <div className="bg-blue-50 p-3 rounded mb-3 text-sm">
            <div className="font-bold">Patient ID: <span className="font-mono">{patient.patientId}</span></div>
            <div>{patient.name} • {patient.age}/{patient.gender} • {patient.phone}</div>
            {patient.doctor && <div className="text-xs">Doctor: Dr. {patient.doctor.name}</div>}
          </div>
        )}

        {patient && (
          <>
            <div className="border rounded p-3 max-h-72 overflow-auto mb-3">
              <div className="text-sm font-semibold mb-2">Select Tests</div>
              {tests.map((t) => (
                <div key={t._id} className="py-1 border-b last:border-0">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1"
                      checked={selectedTests.includes(t._id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTests([...selectedTests, t._id]);
                        else setSelectedTests(selectedTests.filter((x) => x !== t._id));
                      }} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-xs text-slate-600">৳{testFee(t)}</span>
                      </div>
                      {t.parameters?.length > 0 && (
                        <div className="text-xs text-slate-500 ml-2">
                          Parameters: {t.parameters.map((p) => p.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <input type="number" placeholder="Paid Amount" className="border p-2 rounded"
                value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} />
              <div className="flex items-center justify-end font-bold text-lg">Total: ৳{total}</div>
              <div className="flex items-center justify-end text-red-600">Due: ৳{Math.max(total - paidAmount, 0)}</div>
            </div>

            <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Create Order</button>
          </>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="mb-3 space-y-3">
          <input placeholder="Search by test name..." className="border p-2 rounded w-full"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <div className="flex gap-3 flex-wrap">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">Total: {meta.total}</div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">Amount: ৳{meta.totalAmount}</div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">Paid: ৳{meta.totalPaid}</div>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Due: ৳{meta.totalDue}</div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Order No</th><th className="p-3">Patient ID</th>
                <th className="p-3">Patient</th><th className="p-3">Tests</th>
                <th className="p-3">Total</th><th className="p-3">Paid</th>
                <th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t">
                  <td className="p-3 font-mono text-xs">{o.orderNo}</td>
                  <td className="p-3 font-mono text-xs">{o.patient?.patientId}</td>
                  <td className="p-3">{o.patient?.name}</td>
                  <td className="p-3 text-xs">{o.items.map((i) => i.testName).join(', ')}</td>
                  <td className="p-3">৳{o.totalAmount}</td>
                  <td className="p-3">৳{o.paidAmount}</td>
                  <td className="p-3 text-red-600">৳{o.dueAmount}</td>
                  <td className="p-3 text-xs">{o.paymentStatus}</td>
                  <td className="p-3">
                    <button onClick={() => openPDF(`/reports/order/${o._id}/invoice`)}
                      className="bg-slate-700 text-white px-2 py-1 rounded text-xs">🖨 Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={meta.pages} onChange={setPage} />
      </div>
    </div>
  );
}