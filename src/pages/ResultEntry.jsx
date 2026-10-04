import { useEffect, useState } from 'react';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';
import { Link, useNavigate } from 'react-router-dom';

export default function ResultEntry() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ORDERED');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [test, setTest] = useState(null);
  const [values, setValues] = useState({});
  const [remarks, setRemarks] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await api.get('/results/orders', {
      params: { search, status, dateFilter, page, limit: 15 },
    });
    setOrders(data.data);
    setMeta({ pages: data.pages });
  };
  useEffect(() => { load(); }, [search, status, dateFilter, page]);
  useEffect(() => { setPage(1); }, [search, status, dateFilter]);

  const openOrder = async (id) => {
    const { data } = await api.get(`/test-orders/${id}`);
    setSelectedOrder(data);
    setSelectedItem(null); setTest(null); setValues({}); setRemarks('');
  };

  const openItem = async (item) => {
    setSelectedItem(item);
    const { data } = await api.get(`/tests/${item.test}`);
    setTest(data); setValues({});
  };

  const submit = async (submitFlag, requestPerm) => {
    if (!selectedOrder || !selectedItem) return;
    const valueArr = (test.parameters || []).map((p) => ({
      parameterName: p.name, result: values[p.name] || '',
      unit: p.unit, referenceRange: p.referenceRange, group: p.group,
    }));
    try {
      await api.post('/results', {
        order: selectedOrder._id,
        orderItemId: selectedItem._id,
        values: valueArr, remarks, submit: submitFlag, requestPermission: requestPerm,
      });
      toast.success(submitFlag ? 'Submitted' : 'Draft saved');
      load(); openOrder(selectedOrder._id);
    } catch { toast.error('Error'); }
  };

  const requestPerm = async () => {
    if (!selectedOrder) return;
    // Submit all result first then request permission
    for (const item of selectedOrder.items) {
      if (!['SUBMITTED', 'PERMITTED', 'RELEASED'].includes(item.status)) {
        toast.error('Please submit result first');
        return;
      }
    }
    toast.success('Permission request sent to admin');
  };

  const grouped = {};
  (test?.parameters || []).forEach((p) => {
    const g = p.group || 'Parameters';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(p);
  });

  // Special CBC/ESR layout
  const isSpecialLayoutCBC = ['CBC'].some((x) =>
    test?.name?.toLowerCase().includes(x.toLowerCase())
  );
  // const isSpecialLayoutUrine = ['CBC', 'ESR', 'Urine R/E', 'Urine'].some((x) =>
  //   test?.name?.toLowerCase().includes(x.toLowerCase())
  // );
  const isSpecialLayoutUrine = ['Urine'].some((x) =>
    test?.name?.toLowerCase().includes(x.toLowerCase())
  );

  if (isSpecialLayoutCBC) {
   navigate("/cbc");
  }

  if (isSpecialLayoutUrine) {
   navigate("/urine");
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Orders</h2>
        <input placeholder="Search..." className="border p-2 rounded w-full mb-2 text-sm"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="border p-2 rounded w-full mb-2 text-sm" value={status}
          onChange={(e) => setStatus(e.target.value)}>
          <option value="ORDERED">Ordered</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="PERMITTED">Permitted</option>
          <option value="RELEASED">Released</option>
        </select>
        <DateFilter value={dateFilter} onChange={setDateFilter} />
        <div className="mt-3 max-h-[500px] overflow-auto">
          {orders.map((o) => (
            <div key={o._id} onClick={() => openOrder(o._id)}
              className={`p-2 rounded cursor-pointer hover:bg-slate-100 ${selectedOrder?._id === o._id ? 'bg-blue-100' : ''}`}>
              <div className="font-mono text-xs">{o.orderNo}</div>
              <div className="text-sm font-medium">{o.patient?.name}</div>
              <div className="text-xs text-slate-500">{o.patient?.patientId} • {o.patient?.phone}</div>
            </div>
          ))}
        </div>
        <Pagination page={page} pages={meta.pages} onChange={setPage} />
      </div>

      <div className="col-span-3 bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Tests</h2>
        {selectedOrder?.items.map((i) => (
          <div key={i._id} onClick={() => openItem(i)}
            className={`p-2 rounded cursor-pointer hover:bg-slate-100 ${selectedItem?._id === i._id ? 'bg-blue-100' : ''}`}>
            <div className="text-sm font-medium">{i.testName}</div>
            <div className="text-xs text-slate-500">{i.status}</div>
          </div>
        ))}
        {selectedOrder && (
          <button onClick={requestPerm} className="mt-4 w-full bg-purple-600 text-white py-2 rounded text-sm">
            ✉ Request Permission
          </button>
        )}
      </div>

      <div className="col-span-6 bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Result Entry</h2>
        {test ? (
          <div className="space-y-3">
            {isSpecialLayoutCBC|| isSpecialLayoutUrine && (
              <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                📋 Special layout for {test.name}
              </div>
            )}
            {Object.keys(grouped).map((g) => (
              <div key={g} className="border-t pt-2">
                {g !== 'Parameters' && (
                  <h3 className="font-bold text-sm bg-slate-200 px-2 py-1 mb-2">{g}</h3>
                )}
                {grouped[g].map((p) => (
                  <div key={p.name} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <label className="col-span-4 text-sm">{p.name}</label>
                    <input className="col-span-5 border p-1 rounded text-sm"
                      placeholder={p.referenceRange ? `Ref: ${p.referenceRange}` : ''}
                      value={values[p.name] || ''}
                      onChange={(e) => setValues({ ...values, [p.name]: e.target.value })} />
                    <span className="col-span-3 text-xs text-slate-500">
                      {p.unit && p.unit}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <textarea placeholder="Remarks" className="border p-2 rounded w-full text-sm"
              value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => submit(false)} className="bg-yellow-500 text-white py-2 rounded flex-1 text-sm">Save Draft</button>
              <button onClick={() => submit(true)} className="bg-blue-600 text-white py-2 rounded flex-1 text-sm">Submit</button>
              {selectedItem?.status === 'PERMITTED' && (
                <button onClick={() => openPDF(`/reports/${selectedOrder._id}/pdf`)}
                  className="bg-slate-700 text-white py-2 rounded flex-1 text-sm">🖨 Print</button>
              )}
            </div>
          </div>
        ) : <p className="text-sm text-slate-500">Select a test</p>}
      </div>
    </div>
  );
}