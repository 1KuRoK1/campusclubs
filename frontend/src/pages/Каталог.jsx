import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Каталог() {
  const [организации, setОрганизации] = useState([])
  const [фильтры, setФильтры] = useState({ направления: [], форматы: [], факультеты: [] })
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')

  const [поиск, setПоиск] = useState('')
  const [направление, setНаправление] = useState('')
  const [формат, setФормат] = useState('')
  const [факультет, setФакультет] = useState('')
  const [размер, setРазмер] = useState('')

  useEffect(() => {
    api.фильтры_организаций().then(setФильтры).catch(() => {})
  }, [])

  useEffect(() => {
    setЗагрузка(true)
    const параметры = { q: поиск, direction: направление, format: формат, faculty: факультет }
    if (размер === 'малые') параметры.size_max = 15
    if (размер === 'средние') { параметры.size_min = 16; параметры.size_max = 30 }
    if (размер === 'крупные') параметры.size_min = 31

    const таймер = setTimeout(() => {
      api.список_организаций(параметры)
        .then(setОрганизации)
        .catch((e) => setОшибка(e.message))
        .finally(() => setЗагрузка(false))
    }, 300)
    return () => clearTimeout(таймер)
  }, [поиск, направление, формат, факультет, размер])

  return (
    <div className="container py-5">
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-2" style={{ color: 'var(--campus-primary)' }}>
          Студенческие организации
        </h1>
        <p className="text-muted">Найдите сообщество по интересам, науке или спорту</p>
      </div>

      <div className="card card-campus p-4 mb-5 shadow-sm">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Поиск по названию..."
              value={поиск}
              onChange={(e) => setПоиск(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={направление} onChange={(e) => setНаправление(e.target.value)}>
              <option value="">Направление</option>
              {фильтры.направления.map((н) => <option key={н} value={н}>{н}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={формат} onChange={(e) => setФормат(e.target.value)}>
              <option value="">Формат</option>
              {фильтры.форматы.map((ф) => <option key={ф} value={ф}>{ф}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={факультет} onChange={(e) => setФакультет(e.target.value)}>
              <option value="">Факультет</option>
              {фильтры.факультеты.map((ф) => <option key={ф} value={ф}>{ф}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={размер} onChange={(e) => setРазмер(e.target.value)}>
              <option value="">Размер</option>
              <option value="малые">до 15</option>
              <option value="средние">16–30</option>
              <option value="крупные">31+</option>
            </select>
          </div>
        </div>
      </div>

      {загрузка && <div className="text-center py-5 text-muted">Загрузка...</div>}
      {ошибка && <div className="alert alert-danger">{ошибка}</div>}
      
      {!загрузка && организации.length === 0 && (
        <div className="text-center py-5 text-muted">По вашему запросу ничего не найдено.</div>
      )}

      <div className="row g-4">
        {организации.map((о) => (
          <div className="col-12 col-md-6 col-lg-4" key={о.id}>
            <div className="card card-campus h-100">
              <div className="card-body d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span className="badge bg-light text-dark border fw-normal">{о.direction}</span>
                  <span className="text-muted small">{о.format}</span>
                </div>
                <h5 className="card-title mb-3">{о.name}</h5>
                <p className="card-text text-muted small flex-grow-1">
                  {о.description}
                </p>
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <span className="text-muted small">
                    {о.size} участников · {о.faculty}
                  </span>
                  <Link to={`/organizations/${о.id}`} className="btn btn-primary btn-sm px-3">
                    Подробнее
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}