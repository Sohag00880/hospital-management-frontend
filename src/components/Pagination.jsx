export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const arr = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) arr.push(i);
    else if (arr[arr.length - 1] !== '...') arr.push('...');
  }
  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50 text-sm">Prev</button>
      {arr.map((p, i) => p === '...' ? (
        <span key={i} className="px-2">...</span>
      ) : (
        <button key={i} onClick={() => onChange(p)}
          className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
          {p}
        </button>
      ))}
      <button disabled={page === pages} onClick={() => onChange(page + 1)}
        className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50 text-sm">Next</button>
    </div>
  );
}