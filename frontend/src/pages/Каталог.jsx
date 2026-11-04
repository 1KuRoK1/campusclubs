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
    setОшибка('')

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
    <div className="container py-4">
      <h1 className="h3 mb-4">Каталог студенческих организаций</h1>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Поиск по названию или описанию"
            value={поиск}
            onChange={(e) => setПоиск(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={направление} onChange={(e) => setНаправление(e.target.value)}>
            <option value="">Направление</option>
            {фильтры.направления.map((н) => (
              <option key={н} value={н}>{н}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={формат} onChange={(e) => setФормат(e.target.value)}>
            <option value="">Формат</option>
            {фильтры.форматы.map((ф) => (
              <option key={ф} value={ф}>{ф}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={факультет} onChange={(e) => setФакультет(e.target.value)}>
            <option value="">Факультет</option>
            {фильтры.факультеты.map((ф) => (
              <option key={ф} value={ф}>{ф}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={размер} onChange={(e) => setРазмер(e.target.value)}>
            <option value="">Размер</option>
            <option value="малые">до 15 человек</option>
            <option value="средние">16–30 человек</option>
            <option value="крупные">более 30 человек</option>
          </select>
        </div>
      </div>

      {ошибка && <div className="alert alert-danger">{ошибка}</div>}
      {загрузка && <p className="text-muted">Загрузка...</p>}

      {!загрузка && организации.length === 0 && (
        <p className="text-muted">По заданным условиям ничего не найдено.</p>
      )}

      <div className="row g-3">
        {организации.map((о) => (
          <div className="col-12 col-md-6 col-lg-4" key={о.id}>
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{о.name}</h5>
                <p className="card-text text-muted small mb-2">
                  {о.direction} · {о.format}
                </p>
                <p className="card-text flex-grow-1">{о.description}</p>
                <p className="card-text small text-muted mb-3">
                  Участников: {о.size} · {о.faculty}
                </p>
                <Link to={`/organizations/${о.id}`} className="btn btn-primary btn-sm">
                  Подробнее
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}