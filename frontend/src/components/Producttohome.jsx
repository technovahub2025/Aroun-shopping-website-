import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package } from "lucide-react";
import productApi from "../../api/productApi";
export default function Producttohome() {
  const [products, setProducts] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [filter, setFilter] = useState('');
  useEffect(() => {
    let active = true;
    productApi.getAll().then(({
      data
    }) => {
      if (active) setProducts(Array.isArray(data) ? data : data?.products || []);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const visible = products.filter(p => !filter || p.category === filter).slice(0, 8);
  return <section className="catalog-section shell"><div className="section-heading"><div><p className="eyebrow">GOOD FINDS FOR YOUR EVERYDAY</p><h2>Make room in your basket.</h2></div><Link to="/product" className="text-link">Shop all products <ArrowUpRight size={18} /></Link></div>{categories.length > 0 && <div className="filter-tabs" aria-label="Filter featured products">{['', ...categories].map(cat => <button key={cat} className={filter === cat ? 'selected' : ''} aria-pressed={filter === cat} onClick={() => setFilter(cat)}>{cat || 'All essentials'}</button>)}</div>}<div className="featured-grid">{loading ? Array.from({
        length: 4
      }, (_, i) => <div key={i} className="product-skeleton" aria-label="Loading product" />) : visible.map(p => <Link to={`/products/${p._id}`} className="product-card" key={p._id}><div className="product-image">{p.images?.[0] || p.image ? <img src={p.images?.[0]?.url || p.images?.[0] || p.image} alt={p.name || p.title} loading="lazy" onError={e => {
            e.currentTarget.style.display = 'none';
          }} /> : <Package size={48} />} {Number(p.mrp) > Number(p.price) && <span className="saving-badge">{Math.round((1 - p.price / p.mrp) * 100)}% off</span>}</div><div className="product-info"><p>{p.category || 'Daily essentials'}</p><h3>{p.name || p.title}</h3><div className="product-price"><span>&#8377;{Number(p.price || 0).toLocaleString('en-IN')} {Number(p.mrp) > Number(p.price) && <del>&#8377;{p.mrp}</del>}</span><span className="product-arrow"><ArrowUpRight size={19} /></span></div></div></Link>)}</div>{!loading && !visible.length && <div className="catalog-message"><Package size={30} /><h3>{error ? 'Our shelves are taking a moment to load.' : 'More everyday favorites are on their way.'}</h3><p>{error ? 'Please try the catalog again in a moment.' : 'Check back soon for new products.'}</p><Link to="/product" className="text-link">Visit the catalog <ArrowUpRight size={16} /></Link></div>}</section>;
}
