import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function Организация() {
  const { id } = useParams()
  const [организация, setОрганизация] = useState(null)
  const [рейтинг, setРейтинг] = useState({ average_rating: 0, reviews_count: 0 })
  const [отзывы, setОтзывы] = useState([])
  const [мероприятия, setМероприятия] = useState([])
  
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')
  
  // Состояния для нового отзыва
  const [оценка, setОценка] = useState(5)
  const [текстОтзыва, setТекстОтзыва] = useState('')
  const [отправкаОтзыва, setОтправкаОтзыва] = useState(false)

  const загрузитьДанные = () => {
    setЗагрузка(true)
    Promise.all([
      api.организация(id),
      api.рейтинг_организации(id),
      api.отзывы_организации(id),
      api.список_мероприятий(id)
    ])
      .then(([данныеОрг, данныеРейтинг, данныеОтзывы, данныеСобытия]) => {
        setОрганизация(данныеОрг)
        setРейтинг(данныеРейтинг)
        setОтзывы(данныеОтзывы)
        setМероприятия(данныеСобытия)
      })
      .catch((e) => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }

  useEffect(() => { загрузитьДанные() }, [id])

  async function отправитьОтзыв(e) {
    e.preventDefault()
    if (!localStorage.getItem('token')) return alert('Войдите, чтобы оставить отзыв')
    setОтправкаОтзыва(true)
    try {
      await api.оставить_отзыв(id, { rating: Number(оценка), text: текстОтзыва })
      setТекстОтзыва('')
      загрузитьДанные() // Обновляем список
    } catch (err) {
      alert(err.message)
    } finally {
      setОтправкаОтзыва(false)
    }
  }

  async function записаться(eventId) {
    if (!localStorage.getItem('token')) return alert('Войдите, чтобы записаться')
    try {
      await api.записаться_на_мероприятие(eventId)
      alert('Вы успешно записались!')
    } catch (err) {
      alert(err.message)
    }
  }

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

      {/* КАРТОЧКА ОРГАНИЗАЦИИ */}
      <div className="card card-campus shadow-sm mb-4 border-top-0">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge bg-light text-dark border">{организация.direction}</span>
            <span className="badge bg-light text-dark border">{организация.format}</span>
          </div>
          <h1 className="h2 fw-bold mb-3 text-dark">{организация.name}</h1>
          <p className="text-muted lead mb-4">{организация.description}</p>
          <div className="row g-4 mt-2">
            <div className="col-sm-4">
              <div className="text-muted small mb-1">Участников</div>
              <div className="fs-5 fw-semibold text-dark">{организация.size}</div>
            </div>
            <div className="col-sm-4">
              <div className="text-muted small mb-1">Рейтинг</div>
              <div className="fs-5 fw-semibold text-dark">
                {рейтинг.reviews_count > 0 ? `${рейтинг.average_rating} / 5` : 'Нет оценок'}
              </div>
            </div>
            <div className="col-sm-4">
              <div className="text-muted small mb-1">Контакты</div>
              <div className="text-dark text-break">{организация.contacts || '—'}</div>
            </div>
          </div>
          <hr className="my-4" />
          <Link to={`/apply/${организация.id}`} className="btn btn-primary btn-lg px-5">Подать заявку</Link>
        </div>
      </div>

      <div className="row g-4">
        {/* МЕРОПРИЯТИЯ */}
        <div className="col-md-6">
          <div className="card card-campus shadow-sm h-100">
            <div className="card-body p-4">
              <h4 className="mb-4 fw-bold text-dark">Мероприятия</h4>
              {мероприятия.length === 0 && <p className="text-muted small">Пока нет запланированных событий.</p>}
              <div className="d-flex flex-column gap-3">
                {мероприятия.map(м => (
                  <div key={м.id} className="border p-3 rounded bg-light">
                    <div className="fw-semibold mb-1">{м.title}</div>
                    <div className="small text-muted mb-2">
                      {new Date(м.starts_at).toLocaleString('ru-RU')} • {м.place}
                    </div>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => записаться(м.id)}>
                      Записаться
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ОТЗЫВЫ */}
        <div className="col-md-6">
          <div className="card card-campus shadow-sm h-100">
            <div className="card-body p-4">
              <h4 className="mb-4 fw-bold text-dark">Отзывы</h4>
              
              {/* Форма отзыва */}
              <form onSubmit={отправитьОтзыв} className="mb-4 pb-4 border-bottom">
                <label className="form-label small fw-bold">Оставить отзыв</label>
                <select className="form-select mb-2 form-select-sm" value={оценка} onChange={e => setОценка(e.target.value)}>
                  <option value="5">5 - Отлично</option>
                  <option value="4">4 - Хорошо</option>
                  <option value="3">3 - Нормально</option>
                  <option value="2">2 - Плохо</option>
                  <option value="1">1 - Ужасно</option>
                </select>
                <textarea className="form-control form-control-sm mb-2" rows="2" placeholder="Текст отзыва..." value={текстОтзыва} onChange={e => setТекстОтзыва(e.target.value)} />
                <button className="btn btn-sm btn-primary" disabled={отправкаОтзыва}>Отправить</button>
              </form>

              {отзывы.length === 0 && <p className="text-muted small">Отзывов пока нет.</p>}
              <div className="d-flex flex-column gap-3">
                {отзывы.map(отзыв => (
                  <div key={отзыв.id} className="border-bottom pb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-dark">Оценка: {отзыв.rating} / 5</span>
                      <span className="text-muted small">{new Date(отзыв.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {отзыв.text && <p className="mb-0 text-secondary small">{отзыв.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}