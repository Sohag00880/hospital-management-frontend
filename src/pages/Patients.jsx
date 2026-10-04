import { useEffect, useState } from 'react';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';

// ⭐ আজকের তারিখ YYYY-MM-DD ফরম্যাটে (local timezone)
const getTodayString = () => {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

// ⭐ Form-এর খালি state — প্রতিবার নতুন date হবে
const getEmpty = () => ({
  name: '',
  gender: 'Male',
  age: '',
  phone: '',
  address: '',
  doctor: '',
  consultationFee: 0,
  appointmentDate: getTodayString(),   // ⭐ আজকের তারিখ default
});

export default function Patients() {
  const { user } = useAuth();
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(getEmpty());
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, totalFee: 0 });

  const load = async () => {
    const { data } = await api.get('/patients', {
      params: { search, doctor: doctorFilter, dateFilter, page, limit: 15 },
    });
    setPatients(data.data);
    setMeta({
      total: data.total,
      pages: data.pages,
      totalFee: data.totalFee,
    });
  };

  useEffect(() => {
    api.get('/doctors').then((r) => setDoctors(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [search, doctorFilter, dateFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, doctorFilter, dateFilter]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/patients/${editing}`, form);
        toast.success('Patient updated');
      } else {
        const res = await api.post('/patients', form);
        toast.success(`Patient created: ${res.data.patientId}`);
      }
      setForm(getEmpty());          // ⭐ আবার fresh today date
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const edit = (p) => {
    // ISO date → YYYY-MM-DD (input-এর জন্য)
    let dateVal = getTodayString();
    if (p.appointmentDate) {
      const d = new Date(p.appointmentDate);
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateVal = `${yy}-${mm}-${dd}`;
    }

    setForm({
      name: p.name,
      gender: p.gender,
      age: p.age,
      phone: p.phone,
      address: p.address,
      doctor: p.doctor?._id || p.doctor,
      consultationFee: p.consultationFee,
      appointmentDate: dateVal,     // ⭐ existing date
      serial: isAdmin ? p.serial : undefined,
    });
    setEditing(p._id);
    setShowForm(true);
  };

  const del = async (id) => {
    if (!confirm('Delete patient?')) return;
    await api.delete(`/patients/${id}`);
    load();
  };

  const printSlip = (id) => openPDF(`/reports/patient/${id}/slip`);

  const openNewForm = () => {
    setForm(getEmpty());            // ⭐ প্রতিবার fresh today date
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Patients</h1>
        <button
          onClick={openNewForm}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Patient
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white p-4 rounded shadow mb-6 grid grid-cols-3 gap-3"
        >
          <input
            placeholder="Name"
            className="border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <select
            className="border p-2 rounded"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <input
            type="number"
            placeholder="Age"
            className="border p-2 rounded"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
          />

          <input
            placeholder="Phone"
            className="border p-2 rounded"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            placeholder="Address"
            className="border p-2 rounded"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <select
            className="border p-2 rounded"
            value={form.doctor}
            onChange={(e) => {
              const d = doctors.find((x) => x._id === e.target.value);
              setForm({
                ...form,
                doctor: e.target.value,
                consultationFee: d?.consultationFee || 0,
              });
            }}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.name}
              </option>
            ))}
          </select>

          {/* ⭐ Date picker — calendar, default today */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Appointment Date
            </label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={form.appointmentDate}
              onChange={(e) =>
                setForm({ ...form, appointmentDate: e.target.value })
              }
              required
            />
          </div>

          <input
            type="number"
            placeholder="Consultation Fee"
            className="border p-2 rounded"
            value={form.consultationFee}
            onChange={(e) =>
              setForm({ ...form, consultationFee: Number(e.target.value) })
            }
          />

          {editing && isAdmin && (
            <input
              type="number"
              placeholder="Serial"
              className="border p-2 rounded"
              value={form.serial || ''}
              onChange={(e) =>
                setForm({ ...form, serial: Number(e.target.value) })
              }
            />
          )}

          <div className="col-span-3 flex gap-2">
            <button className="bg-emerald-600 text-white py-2 rounded flex-1">
              {editing ? 'Update Patient' : 'Create Patient'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setForm(getEmpty());
              }}
              className="bg-slate-300 py-2 rounded px-6"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-4 space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <input
            placeholder="Search by name / phone / patient ID"
            className="border p-2 rounded flex-1 min-w-[250px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.name}
              </option>
            ))}
          </select>
        </div>

        <DateFilter value={dateFilter} onChange={setDateFilter} />

        <div className="flex gap-3 flex-wrap">
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
            Total Patients: {meta.total}
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded font-bold">
            Total Fee: Tk. {meta.totalFee}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Serial</th>
              <th className="p-3">Patient ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Age/Gender</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Doctor</th>
              <th className="p-3">Date</th>
              <th className="p-3">Fee</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3 font-bold text-blue-600">{p.serial}</td>
                <td className="p-3 font-mono text-xs">{p.patientId}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">
                  {p.age}/{p.gender}
                </td>
                <td className="p-3">{p.phone}</td>
                <td className="p-3">
                  Dr. {p.doctor?.name}
                  {p.doctor?.title && (
                    <div className="text-xs text-slate-500">
                      {p.doctor.title}
                    </div>
                  )}
                </td>
                <td className="p-3 text-xs">
                  {p.appointmentDate
                    ? new Date(p.appointmentDate).toLocaleDateString('en-GB')
                    : '-'}
                </td>
                <td className="p-3">Tk. {p.consultationFee}</td>
                <td className="p-3 flex gap-1 flex-wrap">
                  <button
                    onClick={() => printSlip(p._id)}
                    className="bg-slate-700 text-white px-2 py-1 rounded text-xs"
                  >
                    🖨 Slip
                  </button>
                  <button
                    onClick={() => edit(p)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => del(p._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  )}
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