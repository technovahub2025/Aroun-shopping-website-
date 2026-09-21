import { useEffect, useRef } from 'react';
import { LoaderCircle, RotateCcw } from 'lucide-react';

export default function CatalogLoadMore({ loading, loadingMore, hasMore, error, loadMore, shown, label = 'products', auto = true }) {
  const sentinel = useRef(null);
  useEffect(() => {
    if (!auto || loading || loadingMore || error || !hasMore || !sentinel.current) return;
    let triggered = false;
    if (!window.IntersectionObserver) {
      const checkPosition = () => {
        const bounds = sentinel.current?.getBoundingClientRect();
        if (!triggered && bounds && bounds.top <= window.innerHeight + 250 && bounds.bottom >= -250) {
          triggered = true;
          loadMore();
        }
      };
      window.addEventListener('scroll', checkPosition, { passive: true });
      window.addEventListener('resize', checkPosition);
      checkPosition();
      return () => {
        window.removeEventListener('scroll', checkPosition);
        window.removeEventListener('resize', checkPosition);
      };
    }
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
    <div ref={sentinel} className="flex min-h-10 items-center justify-center gap-2 py-2">
      {(loading || loadingMore) && <span role="status" className="inline-flex text-red-500">
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />
        <span className="sr-only">Loading {label}...</span>
      </span>}
      {error && !loading && !loadingMore && <>
        <p role="alert" className="text-sm text-red-600">{error}</p>
        <button type="button" onClick={loadMore} aria-label={`Retry loading ${label}`}
          title="Retry" className="rounded-full p-2 text-red-600 hover:bg-red-50">
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
        </button>
      </>}
    </div>
  );
}
