import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function Организация() {
  const { id } = useParams()
  const [организация, setОрганизация] = useState(null)
  const [рейтинг, setРейтинг] = useState({ average_rating: 0, reviews_count: 0 })
  const [отзывы, setОтзывы] = useState([])
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')

  useEffect(() => {
    setЗагрузка(true)
    Promise.all([
      api.организация(id),
      api.рейтинг_организации(id),
      api.отзывы_организации(id),
    ])
      .then(([данныеОрг, данныеРейтинг, данныеОтзывы]) => {
        setОрганизация(данныеОрг)
        setРейтинг(данныеРейтинг)
        setОтзывы(данныеОтзывы)
      })
      .catch((e) => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }, [id])

  if (загрузка) return <div className="container py-5 text-center text-muted">Загрузка...</div>
  if (ошибка) return <div className="container py-5"><div className="alert alert-danger">{ошибка}</div></div>
  if (!организация) return null

  return (
    <div className="container py-5" style={{ maxWidth: '900px' }}>
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Каталог</Link></li>
          <li className="breadcrumb-item active">{организация.name}</li>
        </ol>
      </nav>

      <div className="card card-campus shadow-sm mb-4 border-top-0">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge bg-light text-dark border">{организация.direction}</span>
            <span className="badge bg-light text-dark border">{организация.format}</span>
            <span className="badge bg-light text-dark border">{организация.faculty}</span>
          </div>
          
          <h1 className="h2 fw-bold mb-3 text-dark">{организация.name}</h1>
          <p className="text-muted lead mb-4">{организация.description}</p>

          <div className="row g-4 mt-2">
            <div className="col-sm-6 col-md-4">
              <div className="text-muted small mb-1">Участников</div>
              <div className="fs-5 fw-semibold text-dark">{организация.size}</div>
            </div>
            <div className="col-sm-6 col-md-4">
              <div className="text-muted small mb-1">Рейтинг</div>
              <div className="fs-5 fw-semibold text-dark">
                {рейтинг.reviews_count > 0 ? `${рейтинг.average_rating} / 5` : 'Нет оценок'}
                {рейтинг.reviews_count > 0 && <span className="fs-6 text-muted fw-normal ms-2">({рейтинг.reviews_count})</span>}
              </div>
            </div>
            <div className="col-sm-6 col-md-4">
              <div className="text-muted small mb-1">Контакты</div>
              <div className="text-dark text-break">{организация.contacts || '—'}</div>
            </div>
          </div>

          <hr className="my-4" />

          <Link to={`/apply/${организация.id}`} className="btn btn-primary btn-lg px-5">
            Подать заявку на вступление
          </Link>
        </div>
      </div>

      <div className="card card-campus shadow-sm">
        <div className="card-body p-4 p-md-5">
          <h4 className="mb-4 fw-bold text-dark">Отзывы участников</h4>
          
          {отзывы.length === 0 && (
            <p className="text-muted mb-0">Пока нет отзывов. Станьте первым, кто поделится впечатлениями!</p>
          )}

          <div className="d-flex flex-column gap-4">
            {отзывы.map((отзыв) => (
              <div key={отзыв.id} className="border-bottom pb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold text-dark">Оценка: {отзыв.rating} из 5</span>
                  <span className="text-muted small">
                    {new Date(отзыв.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                {отзыв.text && <p className="mb-0 text-secondary">{отзыв.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}