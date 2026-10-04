import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { openPDF } from '../api/axios';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATE = [
  { type: 'section', test: 'PHYSICAL EXAMINATION' },
  { type: 'row', test: 'Quantity', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Color', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Appearance', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Sediment', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Specific Gravity', result: '', reference: '', unit: '' },
  { type: 'section', test: 'CHEMICAL EXAMINATION' },
  { type: 'row', test: 'Reaction (PH)', result: '', reference: '', unit: '' },
  { type: 'row', test: 'B. J. Protein', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Ex. Phosphate', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Bilirubin', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Urobilinogen', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Nitrite', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Leukocyte Esterase', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Albumin', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Sugar', result: '', reference: '', unit: '' },
  { type: 'section', test: 'MICROSCOPIC EXAMINATION' },
  { type: 'row', test: 'Pus Cell', result: '', reference: '', unit: '/HPF' },
  { type: 'row', test: 'Epithelial Cells', result: '', reference: '', unit: '/HPF' },
  { type: 'row', test: 'RBC', result: '', reference: '', unit: '/HPF' },
];

export default function UrineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [patientIdInput, setPatientIdInput] = useState('');
  const [patient, setPatient] = useState(null);
  const [rows, setRows] = useState(DEFAULT_TEMPLATE);
  const [remarks, setRemarks] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/urine/${id}`).then(({ data }) => {
        setPatient(data.patient);
        setRows(data.rows?.length ? data.rows : DEFAULT_TEMPLATE);
        setRemarks(data.remarks || '');
        setSavedId(data._id);
      });
    }
  }, [id, isEdit]);

  // ─── Row/Section updaters ───
  const updateRow = (i, field, value) => {
    const n = [...rows];
    n[i] = { ...n[i], [field]: value };
    setRows(n);
  };

  const deleteRow = (i) => {
    if (!confirm('Delete this item?')) return;
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const addSection = () => {
    setRows([...rows, { type: 'section', test: 'NEW SECTION' }]);
  };

  // Add a new row after the given index (usually last row of current section)
  const addRowAfter = (i) => {
    const newRow = { type: 'row', test: 'New Test', result: '', reference: '', unit: '' };
    const n = [...rows];
    n.splice(i + 1, 0, newRow);
    setRows(n);
  };

  // Add row at very end
  const addRowAtEnd = () => {
    setRows([...rows, { type: 'row', test: 'New Test', result: '', reference: '', unit: '' }]);
  };

  // ─── Patient search ───
  const searchPatient = async () => {
    if (!patientIdInput.trim()) return;
    try {
      const { data } = await api.get(`/urine/find-patient/${patientIdInput.trim()}`);
      setPatient(data.patient);
      if (data.existingReport && !isEdit) {
        setRows(data.existingReport.rows);
        setRemarks(data.existingReport.remarks || '');
        setSavedId(data.existingReport._id);
        toast.success('Existing report loaded');
      } else {
        setRows(DEFAULT_TEMPLATE);
        setRemarks('');
        setSavedId(null);
        toast.success(`Patient: ${data.patient.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Patient not found');
      setPatient(null);
    }
  };

  // ─── Save ───
  const save = async (shouldPrint = false) => {
    if (!patient) return toast.error('Please search a patient first');
    setSaving(true);
    try {
      const payload = {
        patient: patient._id,
        doctor: patient.doctor?._id || patient.doctor,
        rows,
        remarks,
        status: 'SAVED',
      };
      let reportId = savedId;
      if (savedId) {
        await api.put(`/urine/${savedId}`, payload);
      } else {
        const { data } = await api.post('/urine', payload);
        reportId = data._id;
        setSavedId(data._id);
      }
      toast.success('Saved');
      if (shouldPrint) {
        setTimeout(() => openPDF(`/reports/urine/${reportId}/pdf`), 300);
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const viewPDF = () => {
    if (savedId) openPDF(`/reports/urine/${savedId}/pdf`);
    else toast.error('Please save first');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧪 {isEdit ? 'Edit' : 'New'} Urine Report</h1>
        <button onClick={() => navigate('/urine')} className="bg-slate-300 px-4 py-2 rounded text-sm">
          ← Back
        </button>
      </div>

      {/* Patient Search */}
      {!isEdit && !patient && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <label className="text-sm font-medium block mb-2">Patient ID দিয়ে search করুন</label>
          <div className="flex gap-2">
            <input
              placeholder="e.g. BH261003001"
              className="border p-2 rounded flex-1"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
            />
            <button onClick={searchPatient} className="bg-blue-600 text-white px-4 py-2 rounded">
              🔍 Search
            </button>
          </div>
        </div>
      )}

      {/* Patient Info */}
      {patient && (
        <div className="bg-gradient-to-br from-blue-50 to-white border rounded p-4 shadow mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-lg">Patient Information</h2>
              <div className="text-sm space-y-1 mt-2">
                <div>
                  <span className="text-slate-500">Patient ID:</span>{' '}
                  <span className="font-mono">{patient.patientId}</span>
                </div>
                <div><span className="text-slate-500">Name:</span> {patient.name}</div>
                <div>
                  <span className="text-slate-500">Age/Gender:</span> {patient.age} / {patient.gender}
                </div>
                <div><span className="text-slate-500">Phone:</span> {patient.phone || '-'}</div>
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-sm">Doctor</h3>
              <div className="text-sm mt-2 space-y-1">
                {patient.doctor?.title && (
                  <div className="text-xs text-slate-500">{patient.doctor.title}</div>
                )}
                <div>Dr. {patient.doctor?.name}</div>
                {patient.doctor?.designation && (
                  <div className="text-xs">{patient.doctor.designation}</div>
                )}
                {patient.doctor?.medicalCollege && (
                  <div className="text-xs text-slate-500">{patient.doctor.medicalCollege}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Table */}
      {patient && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Test: Urine R/E</h2>
            <div className="flex gap-2">
              <button
                onClick={addSection}
                className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium"
              >
                + Add Section
              </button>
              <button
                onClick={addRowAtEnd}
                className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium"
              >
                + Add Item
              </button>
            </div>
          </div>

          <div className="border rounded overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 bg-slate-700 text-white text-xs font-medium">
              <div className="col-span-4 p-2 border-r">Test</div>
              <div className="col-span-3 p-2 border-r">Result</div>
              <div className="col-span-2 p-2 border-r">Reference</div>
              <div className="col-span-2 p-2 border-r">Unit</div>
              <div className="col-span-1 p-2 text-center">Action</div>
            </div>

            {/* Rows */}
            {rows.map((row, idx) => {
              if (row.type === 'section') {
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 bg-blue-100 border-t items-center"
                  >
                    <div className="col-span-10 p-1">
                      <input
                        className="w-full bg-transparent font-bold text-sm text-blue-900 px-2 py-1 outline-none focus:bg-white focus:border focus:border-blue-400 rounded"
                        value={row.test}
                        onChange={(e) => updateRow(idx, 'test', e.target.value)}
                        placeholder="Section name"
                      />
                    </div>
                    <div className="col-span-2 p-1 flex gap-1 justify-end pr-2">
                      <button
                        onClick={() => addRowAfter(idx)}
                        title="Add item in this section"
                        className="bg-emerald-500 text-white px-2 py-0.5 rounded text-xs"
                      >
                        + Item
                      </button>
                      <button
                        onClick={() => deleteRow(idx)}
                        title="Delete section"
                        className="bg-red-500 text-white px-2 py-0.5 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 border-t items-center text-sm hover:bg-slate-50"
                >
                  <div className="col-span-4 p-1">
                    <input
                      className="w-full border rounded p-1 text-sm focus:border-blue-500 outline-none"
                      value={row.test || ''}
                      onChange={(e) => updateRow(idx, 'test', e.target.value)}
                      placeholder="Test name"
                    />
                  </div>
                  <div className="col-span-3 p-1">
                    <input
                      className="w-full border rounded p-1 text-sm focus:border-blue-500 outline-none"
                      value={row.result || ''}
                      onChange={(e) => updateRow(idx, 'result', e.target.value)}
                      placeholder="Result"
                    />
                  </div>
                  <div className="col-span-2 p-1">
                    <input
                      className="w-full border rounded p-1 text-xs focus:border-blue-500 outline-none"
                      value={row.reference || ''}
                      onChange={(e) => updateRow(idx, 'reference', e.target.value)}
                      placeholder="Ref"
                    />
                  </div>
                  <div className="col-span-2 p-1">
                    <input
                      className="w-full border rounded p-1 text-xs focus:border-blue-500 outline-none"
                      value={row.unit || ''}
                      onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                      placeholder="Unit"
                    />
                  </div>
                  <div className="col-span-1 p-1 text-center">
                    <button
                      onClick={() => deleteRow(idx)}
                      className="bg-red-500 text-white px-2 py-0.5 rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remarks */}
          <div className="mt-4">
            <label className="text-sm font-medium block mb-1">Remarks</label>
            <textarea
              className="border p-2 rounded w-full text-sm"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any remarks..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              disabled={saving}
              onClick={() => save(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              💾 Save
            </button>
            <button
              disabled={saving}
              onClick={() => save(true)}
              className="bg-emerald-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              💾🖨 Save & Print
            </button>
            <button
              onClick={viewPDF}
              disabled={!savedId}
              className="bg-slate-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              👁 View PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}