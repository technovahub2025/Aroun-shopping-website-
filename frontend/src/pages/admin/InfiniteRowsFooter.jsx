import { useEffect, useRef } from "react";

export default function InfiniteRowsFooter({ shown, total, hasMore, loadMore, loading, loadingMore, error }) {
  const sentinel = useRef(null);

  useEffect(() => {
    if (loading || loadingMore || error || !hasMore || !sentinel.current || !window.IntersectionObserver) return;
    let triggered = false;
    const observer = new IntersectionObserver(entries => {
      if (!triggered && entries.some(entry => entry.isIntersecting)) {
        triggered = true;
        loadMore();
      }
    }, {
      root: sentinel.current.closest("[data-admin-scroll]"),
      rootMargin: "200px 0px",
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, error, loadMore, shown]);

  if (loading) return null;
  return (
    <div ref={sentinel} className="py-4 text-center text-sm text-gray-500">
      <p role="status">{total === undefined ? `${shown} products loaded` : `Showing ${shown} of ${total} products`}</p>
      {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
      {(hasMore || error) && (
        <button type="button" onClick={loadMore} disabled={loadingMore}
          className="mt-2 rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-100">
          {loadingMore ? "Loading more products..." : error ? "Retry" : "Load more products"}
        </button>
      )}
    </div>
  );
}
