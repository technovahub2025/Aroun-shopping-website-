import { useCallback, useEffect, useRef, useState } from "react";
import productApi from "../../../api/productApi";

export default function useAdminProducts({ search = "", deleted = false } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const sessionRef = useRef(null);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const loadMore = useCallback(() => sessionRef.current?.fetch(), []);

  useEffect(() => {
    const controller = new AbortController();
    const session = { busy: false, cursor: null, more: true, first: true };
    setProducts([]);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setError("");
    session.fetch = async () => {
      if (session.busy || !session.more || controller.signal.aborted) return;
      session.busy = true;
      setError("");
      if (session.first) setLoading(true);
      else setLoadingMore(true);
      try {
        const { data } = await productApi.getAdminBatch({
          limit: 20, search: search.trim(), deleted,
          ...(session.cursor ? { cursor: session.cursor } : {}),
        }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.items) || (data.hasMore && !data.nextCursor)) {
          throw new Error("Invalid product list response");
        }
        setProducts(previous => {
          const seen = new Set(previous.map(product => product._id));
          return [...previous, ...data.items.filter(product => !seen.has(product._id))];
        });
        session.cursor = data.nextCursor;
        session.more = data.hasMore;
        session.first = false;
        setHasMore(data.hasMore);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.response?.data?.message || "Could not load products. Please retry.");
        }
      } finally {
        session.busy = false;
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    sessionRef.current = session;
    const timer = setTimeout(session.fetch, search ? 300 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
      sessionRef.current = null;
    };
  }, [search, deleted, revision]);

  return { products, loading, loadingMore, hasMore, error, loadMore, reload };
}
