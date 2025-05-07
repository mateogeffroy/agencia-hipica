import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Admin from './Admin'
import Televisor from './Televisor'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/televisor" element={<Televisor />} />
      </Routes>
    </Router>
  )
}

export default App