import { useEffect, useState } from "react";
import productApi from "../../api/productApi";

export default function CategoryCounts({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSummary(null);
    setError(false);
    productApi.getCategoryCounts({ signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setSummary(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [refreshKey, attempt]);

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Products by category</h2>
      {error ? (
        <p role="alert" className="text-red-700">
          Unable to load category counts.
          <button type="button" className="ml-2 underline" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
        </p>
      ) : !summary ? (
        <p role="status" className="text-gray-600">Loading category counts...</p>
      ) : summary.categories.length === 0 ? (
        <p className="text-gray-600">No products yet. Total: 0</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="border-b"><th scope="col" className="py-2">Category</th><th scope="col" className="py-2 text-right">Product count</th></tr></thead>
            <tbody>
              {summary.categories.map(({ category, count }) => (
                <tr key={category ?? ""} className="border-b border-gray-100">
                  <th scope="row" className="py-2 font-normal">{category || "Uncategorized"}</th>
                  <td className="py-2 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="font-semibold"><th scope="row" className="pt-3">Total products</th><td className="pt-3 text-right tabular-nums">{summary.total}</td></tr></tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
