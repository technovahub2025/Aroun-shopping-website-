import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBasket, HeartHandshake, MapPin } from 'lucide-react';
import Hero from '../components/Hero';
import CategoriesCarousel from '../components/CategoriesGrid';
import Producttohome from '../components/Producttohome';
export default function Home() {
  return <main className="home-page"><Hero /><div className="benefits shell"><div><ShoppingBasket /><span><strong>All your daily essentials</strong><small>A thoughtfully stocked store</small></span></div><div><HeartHandshake /><span><strong>Local store. Personal care.</strong><small>Shopping with a familiar face</small></span></div><div><MapPin /><span><strong>Rooted in your neighborhood</strong><small>From Lawspet, with love</small></span></div></div><CategoriesCarousel /><section className="everyday-banner shell"><div><p className="eyebrow">LESS RUNNING AROUND. MORE LIVING.</p><h2>Your daily list,<br />all in one place.</h2><p>Pantry staples, snack breaks, and a happier home.</p></div><Link to="/product" className="primary-button">Shop the essentials <ArrowUpRight size={19} /></Link><span className="banner-decoration" aria-hidden="true">a.</span></section><Producttohome /></main>;
}
