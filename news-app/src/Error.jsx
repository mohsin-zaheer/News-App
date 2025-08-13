import React from 'react'
import './App.css'

import {Link} from 'react-router-dom'


const Error = () => {
  return (
    <div className='errorBg'>
        <h3 className='errorTitle'>404</h3>
        <p className='errorInfo'>OOPS! Page you're looking for doesn't exist. Please use search for help</p>
        <Link to='/' className='errorBtn'>Go Back To Home</ Link>
    </div>
  )
}

export default Error;