import './App.css'
import Footer from './components/Footer'
import Home from './components/Home'
import Navbar from './components/Navbar'
import {Routes, Route} from 'react-router'
import SinglePost from './components/SinglePost'
import ScrollToTop from './components/ScrollToTop'
import Category from './components/Category'
import About from './components/About'
import Contact from './components/Contact'
import Error from './Error'
import SavePosts from './components/SavePosts'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Profile from './components/Profile'
import Blogs from './components/Blogs'
import SearchResults from './components/SearchResults'

function App() {


  return (
    <>
     <Navbar/>

     <ScrollToTop/>
     <Routes>


       <Route path='/' element={<Home/>} />
       <Route path='/about' element={<About/> } />
       <Route path='/blogs' element={ <Blogs/> } />
       <Route path='/contact' element={<Contact/> } />
       <Route path='/savePosts' element={<SavePosts/> } />
       <Route path='/searchResults/:q' element={<SearchResults/> } />
       <Route path='/login' element={<Login/>} />
       <Route path='/signup' element={<Signup/>} />
       <Route path='/profile' element={<Profile/>} />
       <Route path='/posts/:id' element={<SinglePost/>} />
       <Route path='/category/:category' element={<Category/>} />

       <Route path='*' element={<Error />} />

     </Routes>
     <Footer/>
    </>
  )
}

export default App
