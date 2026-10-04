import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function OperationCategories() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', defaultCharge: 0 });
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/admit-patients/categories').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admit-patients/categories/${editing}`, form);
      else await api.post('/admit-patients/categories', form);
      toast.success('Saved');
      setForm({ name: '', description: '', defaultCharge: 0 }); setEditing(null); load();
    } catch { toast.error('Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/admit-patients/categories/${id}`); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Operation Categories</h1>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-4 grid grid-cols-4 gap-3">
        <input placeholder="Operation Name (e.g. সিজার)" className="border p-2 rounded"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" className="border p-2 rounded"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" placeholder="Default Charge" className="border p-2 rounded"
          value={form.defaultCharge} onChange={(e) => setForm({ ...form, defaultCharge: Number(e.target.value) })} />
        <button className="bg-emerald-600 text-white rounded">{editing ? 'Update' : 'Add'}</button>
      </form>
      <div className="bg-white rounded shadow">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr><th className="p-3">Name</th><th className="p-3">Description</th>
              <th className="p-3">Default Charge</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id} className="border-t">
                <td className="p-3">{i.name}</td>
                <td className="p-3">{i.description}</td>
                <td className="p-3">৳{i.defaultCharge}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => { setForm(i); setEditing(i._id); }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                  <button onClick={() => del(i._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}