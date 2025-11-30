import React from 'react'
import ReactDOM from 'react-dom/client'
import FamilyToDoApp from './FamilyToDoApp.jsx' // Import the component
import './index.css' // Import Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FamilyToDoApp />
  </React.StrictMode>,
)