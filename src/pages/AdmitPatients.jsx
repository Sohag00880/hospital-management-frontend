import { useEffect, useState } from 'react';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdmitPatients() {
  const { user } = useAuth();
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const [admits, setAdmits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient: '', doctor: '', operationCategory: '', operationName: '',
    admitDate: new Date().toISOString().slice(0, 10), cabinOrBed: '',
    paidAmount: 0, remarks: '', charges: [],
  });
  const [dischargeModal, setDischargeModal] = useState(null);
  const [dischargePaid, setDischargePaid] = useState(0);

  const load = async () => {
    const [a, p, d, c] = await Promise.all([
      api.get('/admit-patients'), api.get('/patients'),
      api.get('/doctors'), api.get('/admit-patients/categories'),
    ]);
    setAdmits(a.data); setPatients(p.data); setDoctors(d.data); setCats(c.data);
  };
  useEffect(() => { load(); }, []);

  const addCharge = () => setForm({ ...form, charges: [...form.charges, { title: '', amount: 0 }] });
  const updateCharge = (i, k, v) => {
    const arr = [...form.charges]; arr[i][k] = v; setForm({ ...form, charges: arr });
  };
  const removeCharge = (i) => setForm({ ...form, charges: form.charges.filter((_, idx) => idx !== i) });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admit-patients', form);
      toast.success('Patient admitted');
      setForm({ ...form, patient: '', charges: [], operationName: '', cabinOrBed: '', paidAmount: 0, remarks: '' });
      setShowForm(false); load();
    } catch { toast.error('Error'); }
  };

  const openDischarge = (a) => {
    setDischargeModal(a);
    setDischargePaid(a.paidAmount || 0);
  };

  const confirmDischarge = async () => {
    try {
      await api.put(`/admit-patients/${dischargeModal._id}/discharge`, {
        paidAmount: dischargePaid,
      });
      toast.success('Discharged');
      setDischargeModal(null); load();
    } catch { toast.error('Error'); }
  };

  const daysSince = (d) => Math.ceil((new Date() - new Date(d)) / (1000 * 60 * 60 * 24));

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Admitted Patients</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded">
            + Admit Patient
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <select className="border p-2 rounded" value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
              <option value="">Select Patient</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.patientId} - {p.name}</option>)}
            </select>
            <select className="border p-2 rounded" value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
              <option value="">Select Doctor</option>
              {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.name}</option>)}
            </select>
            <select className="border p-2 rounded" value={form.operationCategory}
              onChange={(e) => setForm({ ...form, operationCategory: e.target.value })} required>
              <option value="">Select Operation Category</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input placeholder="Operation Name (details)" className="border p-2 rounded" value={form.operationName}
              onChange={(e) => setForm({ ...form, operationName: e.target.value })} />
            <input type="date" className="border p-2 rounded" value={form.admitDate}
              onChange={(e) => setForm({ ...form, admitDate: e.target.value })} required />
            <input placeholder="Cabin / Bed" className="border p-2 rounded" value={form.cabinOrBed}
              onChange={(e) => setForm({ ...form, cabinOrBed: e.target.value })} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Charges</h3>
              <button type="button" onClick={addCharge}
                className="bg-slate-700 text-white px-3 py-1 rounded text-xs">+ Add Charge</button>
            </div>
            {form.charges.map((c, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 mb-2">
                <input placeholder="Title (e.g. Operation, Cabin, Medicine)" className="border p-1 rounded col-span-4"
                  value={c.title} onChange={(e) => updateCharge(i, 'title', e.target.value)} />
                <input type="number" placeholder="Amount" className="border p-1 rounded"
                  value={c.amount} onChange={(e) => updateCharge(i, 'amount', Number(e.target.value))} />
                <button type="button" onClick={() => removeCharge(i)}
                  className="bg-red-600 text-white rounded text-xs">X</button>
              </div>
            ))}
            <div className="text-right font-bold text-sm">
              Total: ৳{form.charges.reduce((s, c) => s + (c.amount || 0), 0)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Paid Amount" className="border p-2 rounded" value={form.paidAmount}
              onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} />
            <input placeholder="Remarks" className="border p-2 rounded" value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <button className="bg-emerald-600 text-white py-2 rounded w-full">Admit Patient</button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Admit ID</th><th className="p-3">Patient</th>
              <th className="p-3">Doctor</th><th className="p-3">Operation</th>
              <th className="p-3">Admit Date</th><th className="p-3">Days</th>
              <th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Due</th>
              <th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admits.map((a) => (
              <tr key={a._id} className="border-t">
                <td className="p-3 font-mono text-xs">{a.admitId}</td>
                <td className="p-3">{a.patientName}</td>
                <td className="p-3">Dr. {a.doctor?.name}</td>
                <td className="p-3 text-xs">{a.operationCategory?.name}<br />{a.operationName}</td>
                <td className="p-3 text-xs">{new Date(a.admitDate).toLocaleDateString('en-GB')}</td>
                <td className="p-3 font-bold">{a.status === 'ADMITTED' ? daysSince(a.admitDate) : '-'}</td>
                <td className="p-3">৳{a.totalAmount}</td>
                <td className="p-3">৳{a.paidAmount}</td>
                <td className="p-3 text-red-600">৳{a.dueAmount}</td>
                <td className="p-3 text-xs">{a.status}</td>
                <td className="p-3 flex gap-1 flex-wrap">
                  {isAdmin && a.status === 'ADMITTED' && (
                    <button onClick={() => openDischarge(a)}
                      className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Discharge</button>
                  )}
                  {isAdmin && (
                    <button onClick={() => openPDF(`/admit-patients/${a._id}/pdf`)}
                      className="bg-slate-700 text-white px-2 py-1 rounded text-xs">🖨 PDF</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dischargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="font-bold text-lg mb-3">Discharge Patient</h3>
            <p className="text-sm mb-2">{dischargeModal.patientName}</p>
            <p className="text-sm mb-2">Total: ৳{dischargeModal.totalAmount}</p>
            <label className="text-sm">Final Paid Amount:</label>
            <input type="number" className="border p-2 rounded w-full mb-3 mt-1"
              value={dischargePaid} onChange={(e) => setDischargePaid(Number(e.target.value))} />
            <div className="text-sm text-red-600 mb-3">
              Due: ৳{Math.max(dischargeModal.totalAmount - dischargePaid, 0)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDischargeModal(null)} className="flex-1 bg-slate-300 py-2 rounded">Cancel</button>
              <button onClick={confirmDischarge} className="flex-1 bg-yellow-600 text-white py-2 rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}