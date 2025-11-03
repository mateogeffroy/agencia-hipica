import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Admin from './Admin'
import Televisor from './Televisor'
import Home from './Home'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/celular" element={<Admin />} />
        <Route path="/tv" element={<Televisor />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default App