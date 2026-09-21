export default function NumberedPagination({ page, totalPages, onPageChange, loading = false }) {
  const pages = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [...new Set([1, 2, page - 1, page, page + 1, totalPages].filter(value => value >= 1 && value <= totalPages))].sort((a, b) => a - b);
  const buttons = [];
  pages.forEach((value, index) => {
    if (index && value - pages[index - 1] > 1) buttons.push(<span key={`gap-${value}`} aria-hidden="true" className="px-1">…</span>);
    buttons.push(<button key={value} type="button" aria-label={`Page ${value}`} aria-current={value === page ? 'page' : undefined}
      disabled={loading || value === page} onClick={() => onPageChange(value)}
      className={`min-w-10 rounded-lg border px-3 py-2 ${value === page ? 'border-red-500 bg-red-500 text-white' : 'hover:bg-gray-100 disabled:opacity-40'}`}>{value}</button>);
  });
  return <nav aria-label="Product pages" className="flex flex-wrap items-center justify-center gap-2 text-sm">
    <button type="button" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}
      className="rounded-lg border px-3 py-2 hover:bg-gray-100 disabled:opacity-40">Prev</button>
    {buttons}
    <button type="button" disabled={loading || page >= totalPages} onClick={() => onPageChange(page + 1)}
      className="rounded-lg border px-3 py-2 hover:bg-gray-100 disabled:opacity-40">Next</button>
  </nav>;
}
