import { useCallback, useEffect, useState } from "react";
import productApi from "../../../api/productApi";

export default function useAdminProducts({ search = "", deleted = false } = {}) {
  const [pageSize, setPageSize] = useState(20);
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const filterKey = JSON.stringify([search, deleted, pageSize, revision]);
  const [navigation, setNavigation] = useState({ key: filterKey, index: 0, cursors: [null] });
  const current = navigation.key === filterKey ? navigation : { key: filterKey, index: 0, cursors: [null] };
  if (navigation.key !== filterKey) setNavigation(current);
  const requestKey = JSON.stringify({ search, deleted, limit: pageSize, cursor: current.cursors[current.index], revision, attempt, page: current.index });
  const [result, setResult] = useState({ key: null, products: [], hasMore: false, nextCursor: null, error: "", pending: true });
  const loading = result.key !== requestKey || result.pending;
  const products = result.key === requestKey ? result.products : [];
  const error = result.key === requestKey ? result.error : "";
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const { search, deleted, limit, cursor } = JSON.parse(requestKey);
    setResult({ key: requestKey, products: [], hasMore: false, nextCursor: null, error: "", pending: true });
    const timer = setTimeout(async () => {
      try {
        const { data } = await productApi.getAdminBatch({
          limit, search: search.trim(), deleted, ...(cursor ? { cursor } : {}),
        }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.items) || (data.hasMore && !data.nextCursor)) throw new Error("Invalid product list response");
        setResult({ key: requestKey, products: data.items, hasMore: data.hasMore, nextCursor: data.nextCursor, error: "", pending: false });
      } catch (err) {
        if (!controller.signal.aborted) setResult({ key: requestKey, products: [], hasMore: false, nextCursor: null,
          error: err.response?.data?.message || "Could not load products. Please retry.", pending: false });
      }
    }, search ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [requestKey]);

  const nextPage = () => {
    if (loading || error || !result.hasMore) return;
    setNavigation({ key: filterKey, index: current.index + 1,
      cursors: [...current.cursors.slice(0, current.index + 1), result.nextCursor] });
  };
  const previousPage = () => {
    if (loading || current.index === 0) return;
    setNavigation({ ...current, index: current.index - 1 });
  };

  return { products, loading, error, reload, retry, page: current.index + 1, pageSize, setPageSize,
    hasNext: !loading && !error && result.hasMore, nextPage, previousPage };
}
