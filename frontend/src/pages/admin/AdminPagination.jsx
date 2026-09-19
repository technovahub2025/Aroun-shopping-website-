export default function AdminPagination({ shown, page, pageSize, setPageSize, hasNext, nextPage, previousPage, loading, error, retry }) {
  return (
    <nav aria-label="Product pagination" className="py-4 text-sm text-gray-600">
      {error && <div role="alert" className="mb-3 text-red-600">
        {error} <button type="button" onClick={retry} disabled={loading} className="ml-2 underline">Retry</button>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2">
          Products per page
          <select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}
            className="rounded border bg-white px-3 py-2">
            {[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <p role="status">{loading ? 'Loading products...' : `Page ${page} · ${shown} products`}</p>
        <div className="flex gap-2">
          <button type="button" onClick={previousPage} disabled={loading || page === 1}
            className="rounded border px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <button type="button" onClick={nextPage} disabled={loading || !hasNext}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      </div>
    </nav>
  );
}
