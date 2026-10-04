import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import DateFilter from '../components/DateFilter';

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
  const [existingResult, setExistingResult] = useState(null);

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
    setSelectedItem(null);
    setTest(null);
    setValues({});
    setRemarks('');
    setExistingResult(null);
  };

  const openItem = async (item) => {
    setSelectedItem(item);
    const { data } = await api.get(`/tests/${item.test}`);
    setTest(data);

    // ⭐ CBC / ESR / Urine — auto redirect
    const tname = (data?.name || '').toLowerCase();
    if (tname.includes('cbc') || tname.includes('esr')) {
      navigate('/cbc');
      return;
    }
    if (tname.includes('urine')) {
      navigate('/urine');
      return;
    }

    // Load existing result
    try {
      const res = await api.get('/results');
      const match = (res.data || []).find(
        (r) =>
          String(r.orderItemId) === String(item._id) &&
          String(r.order) === String(selectedOrder?._id)
      );
      if (match) {
        setExistingResult(match);
        const vals = {};
        (match.values || []).forEach((v) => {
          vals[v.parameterName] = v.result;
        });
        setValues(vals);
        setRemarks(match.remarks || '');
      } else {
        setExistingResult(null);
        setValues({});
        setRemarks('');
      }
    } catch {
      setExistingResult(null);
      setValues({});
      setRemarks('');
    }
  };

  // ⭐ Submit only
  const submit = async () => {
    if (!selectedOrder || !selectedItem) return;
    const valueArr = (test.parameters || []).map((p) => ({
      parameterName: p.name,
      result: values[p.name] || '',
      unit: p.unit,
      referenceRange: p.referenceRange,
      group: p.group,
    }));
    try {
      await api.post('/results', {
        order: selectedOrder._id,
        orderItemId: selectedItem._id,
        values: valueArr,
        remarks,
        submit: true,
      });
      toast.success('Result submitted');
      load();
      openOrder(selectedOrder._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    }
  };

  // ⭐ View / Print PDF
  const viewPDF = async () => {
    try {
      const res = await api.get('/results');
      const match = (res.data || []).find(
        (r) =>
          String(r.orderItemId) === String(selectedItem?._id) &&
          String(r.order) === String(selectedOrder?._id)
      );
      if (match) {
        openPDF(`/reports/${match._id}/pdf`);
      } else {
        toast.error('Please submit result first');
      }
    } catch {
      toast.error('Failed to load report');
    }
  };

  const grouped = {};
  (test?.parameters || []).forEach((p) => {
    const g = p.group || 'Parameters';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(p);
  });

  const canEdit =
    !existingResult ||
    ['DRAFT', 'RESULT_ENTERED', 'REJECTED'].includes(existingResult.status);

  const isSubmitted =
    existingResult &&
    ['SUBMITTED', 'PERMITTED', 'RELEASED'].includes(existingResult.status);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Orders Panel */}
      <div className="col-span-3 bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Orders</h2>
        <input
          placeholder="Search..."
          className="border p-2 rounded w-full mb-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded w-full mb-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ORDERED">Ordered</option>
          <option value="SUBMITTED">Submitted</option>
        </select>
        <DateFilter value={dateFilter} onChange={setDateFilter} />

        <div className="mt-3 max-h-[500px] overflow-auto">
          {orders.map((o) => (
            <div
              key={o._id}
              onClick={() => openOrder(o._id)}
              className={`p-2 rounded cursor-pointer hover:bg-slate-100 ${
                selectedOrder?._id === o._id ? 'bg-blue-100' : ''
              }`}
            >
              <div className="font-mono text-xs">{o.orderNo}</div>
              <div className="text-sm font-medium">{o.patient?.name}</div>
              <div className="text-xs text-slate-500">
                {o.patient?.patientId} • {o.patient?.phone}
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} pages={meta.pages} onChange={setPage} />
      </div>

      {/* Tests Panel */}
      <div className="col-span-3 bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Tests</h2>
        {selectedOrder?.items.map((i) => (
          <div
            key={i._id}
            onClick={() => openItem(i)}
            className={`p-2 rounded cursor-pointer hover:bg-slate-100 ${
              selectedItem?._id === i._id ? 'bg-blue-100' : ''
            }`}
          >
            <div className="text-sm font-medium">{i.testName}</div>
            <div className="text-xs text-slate-500">{i.status}</div>
          </div>
        ))}
      </div>

      {/* Result Entry Form */}
      <div className="col-span-6 bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Result Entry</h2>
        {test ? (
          <div className="space-y-3">
            {Object.keys(grouped).map((g) => (
              <div key={g} className="border-t pt-2">
                {g !== 'Parameters' && (
                  <h3 className="font-bold text-sm bg-slate-200 px-2 py-1 mb-2">
                    {g}
                  </h3>
                )}
                {grouped[g].map((p) => (
                  <div
                    key={p.name}
                    className="grid grid-cols-12 gap-2 mb-3 items-center"
                  >
                    <label className="col-span-3 text-sm font-medium">
                      {p.name}
                    </label>
                    <input
                      className="col-span-3 border p-1 rounded text-sm focus:border-blue-500 outline-none disabled:bg-slate-100"
                      placeholder="Result"
                      value={values[p.name] || ''}
                      onChange={(e) =>
                        setValues({ ...values, [p.name]: e.target.value })
                      }
                      disabled={!canEdit}
                    />
                    <div className="col-span-6 text-xs">
                      {p.referenceRange && (
                        <div className="text-slate-600">
                          <span className="font-semibold">Ref:</span>{' '}
                          {p.referenceRange}
                          {p.unit ? ` ${p.unit}` : ''}
                        </div>
                      )}
                      {p.normalValue && (
                        <div className="text-slate-500">
                          <span className="font-semibold">Normal:</span>{' '}
                          {p.normalValue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <textarea
              placeholder="Remarks"
              className="border p-2 rounded w-full text-sm disabled:bg-slate-100"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!canEdit}
            />

            <div className="flex gap-2 flex-wrap">
              {canEdit && (
                <button
                  onClick={submit}
                  className="bg-blue-600 text-white py-2 px-6 rounded font-medium flex-1"
                >
                  ✓ Submit
                </button>
              )}
              {isSubmitted && (
                <>
                  <button
                    onClick={viewPDF}
                    className="bg-slate-700 text-white py-2 px-6 rounded font-medium flex-1"
                  >
                    👁 View Report
                  </button>
                  <button
                    onClick={viewPDF}
                    className="bg-emerald-600 text-white py-2 px-6 rounded font-medium flex-1"
                  >
                    🖨 Print Report
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a test from middle panel</p>
        )}
      </div>
    </div>
  );
}