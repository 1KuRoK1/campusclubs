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

  if (загрузка) return <div className="container py-4"><p className="text-muted">Загрузка...</p></div>
  if (ошибка) return <div className="container py-4"><div className="alert alert-danger">{ошибка}</div></div>
  if (!организация) return null

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Каталог</Link></li>
          <li className="breadcrumb-item active">{организация.name}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <h1 className="h3 mb-3">{организация.name}</h1>
          <p className="text-muted mb-4">
            {организация.direction} · {организация.format} · {организация.faculty}
          </p>

          <p>{организация.description}</p>

          <dl className="row mt-4">
            <dt className="col-sm-4">Участников</dt>
            <dd className="col-sm-8">{организация.size}</dd>

            <dt className="col-sm-4">Контакты</dt>
            <dd className="col-sm-8">{организация.contacts || '—'}</dd>

            <dt className="col-sm-4">Рейтинг</dt>
            <dd className="col-sm-8">
              {рейтинг.reviews_count > 0
                ? `${рейтинг.average_rating} из 5 (отзывов: ${рейтинг.reviews_count})`
                : 'Пока нет отзывов'}
            </dd>
          </dl>

          <Link to={`/apply/${организация.id}`} className="btn btn-primary mt-3">
            Подать заявку на вступление
          </Link>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Отзывы</h5>
              {отзывы.length === 0 && <p className="text-muted small mb-0">Отзывов пока нет.</p>}
              <ul className="list-unstyled mb-0">
                {отзывы.map((отзыв) => (
                  <li key={отзыв.id} className="mb-3 pb-3 border-bottom">
                    <div className="small text-muted">Оценка: {отзыв.rating} из 5</div>
                    {отзыв.text && <p className="mb-0">{отзыв.text}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}