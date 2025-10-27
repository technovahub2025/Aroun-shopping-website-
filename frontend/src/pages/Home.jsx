import React from 'react'
import Hero from '../Components/Hero'
import CategoriesCarousel from '../components/CategoriesGrid'
import Producttohome from '../components/Producttohome'


const Home = () => {
  return (
    <div>
        <Hero/>
        <CategoriesCarousel/>
        <Producttohome/>
     
    </div>
  )
}

export default Home