import { useEffect, useRef, useState } from 'react';

export default function LazySection({ children, label }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} aria-label={label} style={{ minHeight: visible ? undefined : 400 }}>
    {visible ? children : <p className="p-10 text-center text-gray-500">{label}</p>}
  </section>;
}
