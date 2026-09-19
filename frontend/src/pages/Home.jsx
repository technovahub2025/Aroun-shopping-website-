import React, { lazy, Suspense } from 'react'
import LazySection from '../components/LazySection'
import Hero from '../components/Hero'
const CategoriesCarousel = lazy(() => import('../components/CategoriesGrid'));
const Producttohome = lazy(() => import('../components/Producttohome'));
const CategoriesListView = lazy(() => import('../components/Categorieslistview'));


const Home = () => {
  return (
    <div>
        <Hero/>
        <LazySection label="Shop by Categories"><Suspense fallback={<p className="p-10 text-center">Loading...</p>}><CategoriesCarousel/></Suspense></LazySection>
        <LazySection label="List of Categories"><Suspense fallback={<p className="p-10 text-center">Loading...</p>}><CategoriesListView/></Suspense></LazySection>
        <LazySection label="Latest Products"><Suspense fallback={<p className="p-10 text-center">Loading...</p>}><Producttohome/></Suspense></LazySection>
     
    </div>
  )
}

export default Home
