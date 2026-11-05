import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Каталог from './pages/Каталог'
import Организация from './pages/Организация'
import ПодачаЗаявки from './pages/ПодачаЗаявки'
import Вход from './pages/Вход'
import ЛичныйКабинет from './pages/ЛичныйКабинет'
import УправлениеОрганизацией from './pages/УправлениеОрганизацией'

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-md navbar-dark" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="container">
          <Link className="navbar-brand" to="/">CampusClubs</Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#менюНавигации"
            aria-controls="менюНавигации"
            aria-expanded="false"
            aria-label="Переключить навигацию"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="менюНавигации">
            <div className="navbar-nav ms-auto">
              <Link className="nav-link" to="/">Каталог</Link>
              <Link className="nav-link" to="/cabinet">Личный кабинет</Link>
              <Link className="nav-link" to="/manage">Управление</Link>
              <Link className="nav-link" to="/login">Вход</Link>
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Каталог />} />
        <Route path="/organizations/:id" element={<Организация />} />
        <Route path="/apply/:id" element={<ПодачаЗаявки />} />
        <Route path="/cabinet" element={<ЛичныйКабинет />} />
        <Route path="/manage" element={<УправлениеОрганизацией />} />
        <Route path="/login" element={<Вход />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App