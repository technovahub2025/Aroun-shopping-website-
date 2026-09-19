import { useEffect, useState } from 'react';
import productApi from '../../api/productApi';

export default function useCatalogFacets() {
  const [facets, setFacets] = useState({ categories: [], types: [] });
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    productApi.getCatalogFacets({ signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setFacets(data);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Could not load filters.');
    });
    return () => controller.abort();
  }, [revision]);
  return { ...facets, error, reload: () => setRevision(value => value + 1) };
}
