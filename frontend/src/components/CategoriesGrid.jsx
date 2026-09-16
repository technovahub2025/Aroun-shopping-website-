import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package } from "lucide-react";
import productApi from "../../api/productApi";
export default function CategoriesCarousel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    productApi.getAll().then(({
      data
    }) => {
      const products = Array.isArray(data) ? data : data?.products || [];
      const groups = new Map();
      products.forEach(p => {
        if (p.category) {
          const group = groups.get(p.category) || {
            name: p.category,
            image: p.images?.[0]?.url || p.images?.[0] || p.image,
            count: 0
          };
          group.count++;
          groups.set(p.category, group);
        }
      });
      if (active) setCategories([...groups.values()]);
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  return <section className="catalog-section shell" id="categories"><div className="section-heading"><div><p className="eyebrow">FIND YOUR EVERYDAY FAVORITES</p><h2>A little of everything.</h2></div><Link className="text-link" to="/product">Browse all <ArrowUpRight size={18} /></Link></div><div className="category-grid">{loading ? Array.from({
        length: 6
      }, (_, i) => <div key={i} className="category-skeleton" />) : categories.length ? categories.map((cat, i) => <Link className={`category-tile tone-${i % 4}`} key={cat.name} to={`/product?category=${encodeURIComponent(cat.name)}`}><div className="category-image">{cat.image ? <img src={cat.image} alt="" loading="lazy" onError={e => {
            e.currentTarget.style.display = 'none';
          }} /> : <Package size={45} />}</div><h3>{cat.name}</h3><span>{cat.count} essentials <ArrowUpRight size={15} /></span></Link>) : <p className="catalog-message">Your next favorite is waiting. <Link to="/product">Explore the catalog</Link></p>}</div></section>;
}
