import React from 'react'
import Hero from '../Components/Hero'
import CategoriesCarousel from '../components/CategoriesGrid'
import Producttohome from '../components/Producttohome'
import CategoriesListView from '../components/Categorieslistview'


const Home = () => {
  return (
    <div>
        <Hero/>
        <CategoriesCarousel/>
        <CategoriesListView/>
        <Producttohome/>
     
    </div>
  )
}

export default Home