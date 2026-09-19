import { useEffect, useRef } from 'react';

export default function CatalogLoadMore({ loading, loadingMore, hasMore, error, loadMore, shown, label = 'products', auto = true }) {
  const sentinel = useRef(null);
  useEffect(() => {
    if (!auto || loading || loadingMore || error || !hasMore || !sentinel.current || !window.IntersectionObserver) return;
    let triggered = false;
    const observer = new IntersectionObserver(entries => {
      if (!triggered && entries.some(entry => entry.isIntersecting)) {
        triggered = true;
        loadMore();
      }
    }, { rootMargin: '250px 0px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [auto, loading, loadingMore, hasMore, error, loadMore, shown]);
  return (
    <div ref={sentinel} className="py-6 text-center">
      <p role="status" className="text-sm text-gray-500">
        {loading || loadingMore ? `Loading ${label}...` : `${shown} ${label} loaded`}
      </p>
      {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
      {(hasMore || error) && <button type="button" onClick={loadMore} disabled={loading || loadingMore}
        className="mt-3 rounded-lg bg-red-500 px-5 py-2 text-white disabled:opacity-50">
        {error ? 'Retry' : `Load more ${label}`}
      </button>}
    </div>
  );
}
