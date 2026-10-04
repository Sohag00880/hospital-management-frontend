import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';

const empty = { name: '', title: '', designation: '', medicalCollege: '', department: '', specialization: '', phone: '', email: '', consultationFee: 0 };

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    const { data } = await api.get('/doctors', { params: { search, department: filterDept } });
    setDoctors(data);
  };
  useEffect(() => { api.get('/departments').then((r) => setDepartments(r.data)); }, []);
  useEffect(() => { load(); }, [search, filterDept]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/doctors/${editing}`, form);
      else await api.post('/doctors', form);
      toast.success('Saved');
      setForm(empty); setEditing(null); setShowForm(false); load();
    } catch { toast.error('Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/doctors/${id}`); load();
  };

  const perPage = 15;
  const totalPages = Math.ceil(doctors.length / perPage);
  const paged = doctors.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(empty); }}
          className="bg-blue-600 text-white px-4 py-2 rounded">+ Add Doctor</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-3 gap-3">
          <input placeholder="Name" className="border p-2 rounded" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Title (e.g. সহযোগী অধ্যাপক)" className="border p-2 rounded" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Designation" className="border p-2 rounded" value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <input placeholder="Medical College" className="border p-2 rounded" value={form.medicalCollege}
            onChange={(e) => setForm({ ...form, medicalCollege: e.target.value })} />
          <select className="border p-2 rounded" value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Select Department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input placeholder="Specialization" className="border p-2 rounded" value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <input placeholder="Phone" className="border p-2 rounded" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className="border p-2 rounded" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="number" placeholder="Consultation Fee" className="border p-2 rounded" value={form.consultationFee}
            onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} />
          <button className="bg-emerald-600 text-white py-2 rounded col-span-3">
            {editing ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div className="bg-white p-4 rounded shadow mb-4 flex gap-3 items-center flex-wrap">
        <input placeholder="Search by name..." className="border p-2 rounded flex-1 min-w-[200px]"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="border p-2 rounded" value={filterDept}
          onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded font-medium">
          Total: {doctors.length} doctors
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Title</th>
              <th className="p-3">Department</th><th className="p-3">Designation</th>
              <th className="p-3">Medical College</th><th className="p-3">Phone</th>
              <th className="p-3">Fee</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((d) => (
              <tr key={d._id} className="border-t">
                <td className="p-3">Dr. {d.name}</td>
                <td className="p-3 text-xs">{d.title}</td>
                <td className="p-3 text-xs">{d.department?.name || '-'}</td>
                <td className="p-3 text-xs">{d.designation}</td>
                <td className="p-3 text-xs">{d.medicalCollege}</td>
                <td className="p-3">{d.phone}</td>
                <td className="p-3">৳{d.consultationFee}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => { setForm(d); setEditing(d._id); setShowForm(true); }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                  <button onClick={() => del(d._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}