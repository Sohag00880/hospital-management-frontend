import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Tests() {
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [testForm, setTestForm] = useState({ name: '', category: '', baseFee: 0, parameters: [] });
  const [editingCat, setEditingCat] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [showCat, setShowCat] = useState(false);
  const [showTest, setShowTest] = useState(false);

  const load = async () => {
    const [c, t] = await Promise.all([api.get('/tests/categories'), api.get('/tests')]);
    setCategories(c.data); setTests(t.data);
  };
  useEffect(() => { load(); }, []);

  const saveCat = async (e) => {
    e.preventDefault();
    if (editingCat) await api.put(`/tests/categories/${editingCat}`, catForm);
    else await api.post('/tests/categories', catForm);
    toast.success('Saved'); setCatForm({ name: '', description: '' }); setEditingCat(null); load();
  };
  const delCat = async (id) => {
    if (!confirm('Delete category?')) return;
    await api.delete(`/tests/categories/${id}`); load();
  };

  const addParam = () => setTestForm({
    ...testForm,
    parameters: [...testForm.parameters, { name: '', unit: '', referenceRange: '', normalValue: '', fee: 0, group: '', displayOrder: testForm.parameters.length }],
  });
  const updateParam = (i, k, v) => {
    const arr = [...testForm.parameters]; arr[i][k] = v;
    setTestForm({ ...testForm, parameters: arr });
  };
  const removeParam = (i) => setTestForm({
    ...testForm, parameters: testForm.parameters.filter((_, idx) => idx !== i),
  });

  const saveTest = async (e) => {
    e.preventDefault();
    try {
      if (editingTest) await api.put(`/tests/${editingTest}`, testForm);
      else await api.post('/tests', testForm);
      toast.success('Saved');
      setTestForm({ name: '', category: '', baseFee: 0, parameters: [] });
      setEditingTest(null); setShowTest(false); load();
    } catch { toast.error('Error'); }
  };

  const editTest = (t) => {
    setTestForm({
      name: t.name, category: t.category?._id || t.category, baseFee: t.baseFee,
      parameters: t.parameters || [],
    });
    setEditingTest(t._id); setShowTest(true);
  };

  const delTest = async (id) => {
    if (!confirm('Delete test?')) return;
    await api.delete(`/tests/${id}`); load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Test Management</h1>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Test Categories</h2>
          <button onClick={() => { setShowCat(!showCat); setEditingCat(null); setCatForm({ name: '', description: '' }); }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm">+ Add Category</button>
        </div>
        {showCat && (
          <form onSubmit={saveCat} className="grid grid-cols-3 gap-2 mb-3">
            <input placeholder="Category Name" className="border p-2 rounded" value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />
            <input placeholder="Description" className="border p-2 rounded" value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            <button className="bg-emerald-600 text-white rounded">
              {editingCat ? 'Update' : 'Create'}
            </button>
          </form>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {categories.map((c) => (
            <div key={c._id} className="border rounded p-3 bg-gradient-to-br from-blue-50 to-white flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.name}</div>
                {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setCatForm({ name: c.name, description: c.description }); setEditingCat(c._id); setShowCat(true); }}
                  className="text-blue-600 text-xs">✎</button>
                <button onClick={() => delCat(c._id)} className="text-red-600 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Tests</h2>
          <button onClick={() => { setShowTest(!showTest); setEditingTest(null); setTestForm({ name: '', category: '', baseFee: 0, parameters: [] }); }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm">+ Add Test</button>
        </div>

        {showTest && (
          <form onSubmit={saveTest} className="space-y-3 mb-4 border p-4 rounded bg-slate-50">
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Test Name (e.g. CBC)" className="border p-2 rounded" value={testForm.name}
                onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} required />
              <select className="border p-2 rounded" value={testForm.category}
                onChange={(e) => setTestForm({ ...testForm, category: e.target.value })} required>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input type="number" placeholder="Base Fee" className="border p-2 rounded" value={testForm.baseFee}
                onChange={(e) => setTestForm({ ...testForm, baseFee: Number(e.target.value) })} />
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Parameters</h3>
              <button type="button" onClick={addParam} className="bg-slate-700 text-white px-3 py-1 rounded text-xs">
                + Add Parameter
              </button>
            </div>

            {testForm.parameters.map((p, i) => (
              <div key={i} className="grid grid-cols-7 gap-2">
                <input placeholder="Name" className="border p-1 rounded text-sm" value={p.name}
                  onChange={(e) => updateParam(i, 'name', e.target.value)} required />
                <input placeholder="Unit" className="border p-1 rounded text-sm" value={p.unit}
                  onChange={(e) => updateParam(i, 'unit', e.target.value)} />
                <input placeholder="Reference Range" className="border p-1 rounded text-sm" value={p.referenceRange}
                  onChange={(e) => updateParam(i, 'referenceRange', e.target.value)} />
                <input placeholder="Normal Value" className="border p-1 rounded text-sm" value={p.normalValue}
                  onChange={(e) => updateParam(i, 'normalValue', e.target.value)} />
                <input placeholder="Group" className="border p-1 rounded text-sm" value={p.group}
                  onChange={(e) => updateParam(i, 'group', e.target.value)} />
                <input type="number" placeholder="Fee" className="border p-1 rounded text-sm" value={p.fee}
                  onChange={(e) => updateParam(i, 'fee', Number(e.target.value))} />
                <button type="button" onClick={() => removeParam(i)}
                  className="bg-red-600 text-white rounded text-xs">X</button>
              </div>
            ))}
            <button className="bg-emerald-600 text-white py-2 rounded w-full">
              {editingTest ? 'Update Test' : 'Create Test'}
            </button>
          </form>
        )}

        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Test Name</th><th className="p-3">Category</th>
              <th className="p-3">Parameters</th><th className="p-3">Base Fee</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t._id} className="border-t">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3">{t.category?.name || '-'}</td>
                <td className="p-3 text-xs">{t.parameters?.map((p) => p.name).join(', ')}</td>
                <td className="p-3">৳{t.baseFee}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => editTest(t)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                  <button onClick={() => delTest(t._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}