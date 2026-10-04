import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(form.username, form.password); toast.success('Welcome!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-96 space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">BOISHAKHI HOSPITAL</h1>
          <p className="text-sm text-slate-500">Management System</p>
        </div>
        <input placeholder="Username" className="border p-2 rounded w-full"
          value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input type="password" placeholder="Password" className="border p-2 rounded w-full"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button disabled={loading} className="bg-blue-600 text-white py-2 rounded w-full">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}