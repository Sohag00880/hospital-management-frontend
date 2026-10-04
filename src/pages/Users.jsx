import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'PATHOLOGIST'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'RECEPTIONIST' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/users/${editing}`, form);
      else await api.post('/users', form);
      toast.success('Saved');
      setForm({ name: '', username: '', email: '', password: '', role: 'RECEPTIONIST' });
      setEditing(null); setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const toggleBlock = async (id) => { await api.put(`/users/${id}/toggle-block`); load(); };
  const del = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`); load();
  };

  const edit = (u) => {
    setForm({ name: u.name, username: u.username, email: u.email || '', password: '', role: u.role });
    setEditing(u._id); setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded">+ Add User</button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-3">
          <input placeholder="Full Name" className="border p-2 rounded" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Username" className="border p-2 rounded" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!!editing} />
          <input type="email" placeholder="Email" className="border p-2 rounded" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder={editing ? 'New Password (optional)' : 'Password'}
            className="border p-2 rounded" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <select className="border p-2 rounded" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="bg-emerald-600 text-white py-2 rounded col-span-2">
            {editing ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Username</th>
              <th className="p-3">Email</th><th className="p-3">Role</th>
              <th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3 text-sm">{u.email}</td>
                <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{u.role}</span></td>
                <td className="p-3">
                  <span className={u.isBlocked ? 'text-red-600' : 'text-green-600'}>
                    {u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="p-3 flex gap-2 flex-wrap">
                  <button onClick={() => edit(u)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                  <button onClick={() => toggleBlock(u._id)} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button onClick={() => del(u._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}