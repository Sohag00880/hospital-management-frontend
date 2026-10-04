// export default function DateFilter({ value, onChange }) {
//   const opts = [
//     { value: 'today', label: 'Today' },
//     { value: 'week', label: 'This Week' },
//     { value: 'month', label: 'This Month' },
//     { value: 'year', label: 'This Year' },
//     { value: 'all', label: 'All' },
//   ];
//   return (
//     <div className="flex gap-1 flex-wrap">
//       {opts.map((o) => (
//         <button key={o.value} onClick={() => onChange(o.value)}
//           className={`px-3 py-1 rounded text-xs font-medium ${
//             value === o.value ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
//           }`}>
//           {o.label}
//         </button>
//       ))}
//     </div>
//   );
// }


export default function DateFilter({
  value,
  onChange,
  from,
  to,
  onFromChange,
  onToChange,
  showCustomRange = true,
}) {
  const opts = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All' },
  ];

  const hasCustom = !!(from || to);

  const safeCall = (fn, val) => {
    if (typeof fn === 'function') fn(val);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Quick range buttons */}
      <div className="flex gap-1 flex-wrap">
        {opts.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              safeCall(onChange, o.value);
              // Quick filter click করলে custom range auto-clear
              safeCall(onFromChange, '');
              safeCall(onToChange, '');
            }}
            className={`px-3 py-1 rounded text-xs font-medium ${
              value === o.value && !hasCustom
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {showCustomRange && typeof onFromChange === 'function' && (
        <div className="flex gap-2 items-center border-l-2 border-slate-300 pl-3 ml-1">
          <label className="text-xs font-medium text-slate-600">From:</label>
          <input
            type="date"
            className={`border rounded px-2 py-1 text-xs ${
              from ? 'bg-yellow-50 border-yellow-500 font-semibold' : ''
            }`}
            value={from || ''}
            onChange={(e) => safeCall(onFromChange, e.target.value)}
          />
          <label className="text-xs font-medium text-slate-600">To:</label>
          <input
            type="date"
            className={`border rounded px-2 py-1 text-xs ${
              to ? 'bg-yellow-50 border-yellow-500 font-semibold' : ''
            }`}
            value={to || ''}
            onChange={(e) => safeCall(onToChange, e.target.value)}
          />
          {hasCustom && (
            <button
              type="button"
              onClick={() => {
                safeCall(onFromChange, '');
                safeCall(onToChange, '');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
              title="Clear custom range"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}