import NumberedPagination from "../../components/NumberedPagination";

export default function AdminPagination({ shown, page, pageSize, setPageSize, totalPages, goToPage, loading, error, retry }) {
  return (
    <div className="py-4 text-sm text-gray-600">
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
        <NumberedPagination page={page} totalPages={totalPages} onPageChange={goToPage} loading={loading} />
      </div>
    </div>
  );
}
