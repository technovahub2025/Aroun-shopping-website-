import React from 'react'
import Hero from '../components/Hero'
import CategoriesCarousel from '../components/CategoriesGrid'
import Producttohome from '../components/Producttohome'
import CategoriesListView from '../components/Categorieslistview'
import CategoryCounts from '../components/CategoryCounts'


const Home = () => {
  return (
    <div>
        <Hero/>
        <CategoriesCarousel/>
        <div className="max-w-7xl mx-auto px-4"><CategoryCounts /></div>
        <CategoriesListView/>
        <Producttohome/>
     
    </div>
  )
}

export default Home
