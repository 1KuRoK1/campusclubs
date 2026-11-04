import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Каталог from './pages/Каталог'

function Заглушка({ название }) {
  return (
    <div className="container py-5">
      <h1 className="h3 mb-3">{название}</h1>
      <p className="text-muted">Раздел в разработке.</p>
    </div>
  )
}

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
        <Route path="/cabinet" element={<Заглушка название="Личный кабинет" />} />
        <Route path="/login" element={<Заглушка название="Вход" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App