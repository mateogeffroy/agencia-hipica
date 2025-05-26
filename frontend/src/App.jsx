import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Admin from './Admin'
import Televisor from './Televisor'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/celular" element={<Admin />} />
        <Route path="/tv" element={<Televisor />} />
      </Routes>
    </Router>
  )
}

export default App