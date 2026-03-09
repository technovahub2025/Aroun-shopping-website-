import React from 'react'
import Hero from '../Components/Hero'
import CategoriesCarousel from '../Components/CategoriesGrid'
import Producttohome from '../Components/Producttohome'
import CategoriesListView from '../Components/Categorieslistview'


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
