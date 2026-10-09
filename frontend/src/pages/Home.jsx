import React, { lazy, Suspense, useEffect } from 'react'
import productApi from '../../api/productApi'
import LazySection from '../components/LazySection'
import Hero from '../components/Hero'
const CategoriesCarousel = lazy(() => import('../components/CategoriesGrid'));

const CategoriesListView = lazy(() => import('../components/Categorieslistview'));


const Home = () => {
  useEffect(() => {
    // Warm the small homepage batches while the hero renders, independent of auth.
    Promise.allSettled([
      productApi.getCategoryPreviews({ limit: 6 }),
      productApi.getCategoryPreviews({ limit: 3 }),
    ]);
  }, []);
  return (
    <div>
        <Hero/>
        <LazySection label="Shop by Categories"><Suspense fallback={<p className="p-10 text-center">Loading...</p>}><CategoriesCarousel/></Suspense></LazySection>
        <LazySection label="List of Categories"><Suspense fallback={<p className="p-10 text-center">Loading...</p>}><CategoriesListView/></Suspense></LazySection>
        
    </div>
  )
}

export default Home
