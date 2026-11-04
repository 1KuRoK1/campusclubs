import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Каталог from './pages/Каталог'
import Организация from './pages/Организация'
import ПодачаЗаявки from './pages/ПодачаЗаявки'
import Вход from './pages/Вход'
import ЛичныйКабинет from './pages/ЛичныйКабинет'

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="container">
          <Link className="navbar-brand" to="/">CampusClubs</Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/">Каталог</Link>
            <Link className="nav-link" to="/cabinet">Личный кабинет</Link>
            <Link className="nav-link" to="/login">Вход</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Каталог />} />
        <Route path="/organizations/:id" element={<Организация />} />
        <Route path="/apply/:id" element={<ПодачаЗаявки />} />
        <Route path="/cabinet" element={<ЛичныйКабинет />} />
        <Route path="/login" element={<Вход />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App