import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from './api'
import Каталог from './pages/Каталог'
import Организация from './pages/Организация'
import ПодачаЗаявки from './pages/ПодачаЗаявки'
import Вход from './pages/Вход'
import ЛичныйКабинет from './pages/ЛичныйКабинет'
import УправлениеОрганизацией from './pages/УправлениеОрганизацией'
import СоздатьОрганизацию from './pages/СоздатьОрганизацию'
import Администрирование from './pages/Администрирование'

function Шапка() {
  const [профиль, setПрофиль] = useState(null)
  const navigate = useNavigate()

  const проверитьПрофиль = () => {
    if (localStorage.getItem('token')) {
      api.мой_профиль().then(setПрофиль).catch(() => setПрофиль(null))
    } else {
      setПрофиль(null)
    }
  }

  useEffect(() => {
    проверитьПрофиль()
    window.addEventListener('auth-change', проверитьПрофиль)
    return () => window.removeEventListener('auth-change', проверитьПрофиль)
  }, [])

  function выйти() {
    api.выход()
    window.dispatchEvent(new Event('auth-change'))
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-md navbar-dark navbar-campus sticky-top">
      <div className="container">
        <Link className="navbar-brand navbar-brand-campus" to="/">
          <span className="brand-plashka"><span>ИРИТ-РТФ</span></span>
          СтудПортал
        </Link>
        
        <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#менюНавигации">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="менюНавигации">
          <div className="navbar-nav ms-auto align-items-center gap-2">
            <Link className="nav-link" to="/">Каталог</Link>
            
            {/* Управление только для руководителей */}
            {профиль && профиль.role === 'руководитель' && (
              <Link className="nav-link" to="/manage">Управление</Link>
            )}

            {/* Администрирование только для администрации */}
            {профиль && профиль.role === 'администрация' && (
              <Link className="nav-link" to="/admin">Администрирование</Link>
            )}

            {профиль ? (
              <>
                <Link className="nav-link" to="/cabinet">Личный кабинет</Link>
                <button className="btn btn-outline-light btn-sm ms-2" onClick={выйти}>
                  Выйти
                </button>
              </>
            ) : (
              <Link className="btn btn-primary btn-sm ms-2" to="/login" style={{ backgroundColor: 'var(--campus-accent)', borderColor: 'var(--campus-accent)' }}>
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Шапка />
      <main>
        <Routes>
          <Route path="/" element={<Каталог />} />
          <Route path="/organizations/:id" element={<Организация />} />
          <Route path="/apply/:id" element={<ПодачаЗаявки />} />
          <Route path="/cabinet" element={<ЛичныйКабинет />} />
          <Route path="/manage" element={<УправлениеОрганизацией />} />
          <Route path="/create-organization" element={<СоздатьОрганизацию />} />
          <Route path="/admin" element={<Администрирование />} />
          <Route path="/login" element={<Вход />} />
        </Routes>
      </main>

      <footer className="footer-campus">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-6">
              <h5>СтудПортал ИРИТ-РТФ</h5>
              <p className="small mb-0">Единая платформа для управления студенческими организациями института.</p>
            </div>
            <div className="col-md-3">
              <h5>Разделы</h5>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><Link to="/">Каталог организаций</Link></li>
                <li><Link to="/cabinet">Личный кабинет</Link></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h5>Контакты</h5>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li>support@studportal.ru</li>
                <li>г. Екатеринбург, ул. Мира, 19</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">© {new Date().getFullYear()} СтудПортал ИРИТ-РТФ.</div>
        </div>
      </footer>
    </BrowserRouter>
  )
}

export default App