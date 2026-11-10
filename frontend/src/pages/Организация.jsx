import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

export default function Организация() {
  const { id } = useParams()
  const [организация, setОрганизация] = useState(null)
  const [рейтинг, setРейтинг] = useState({ average_rating: 0, reviews_count: 0 })
  const [отзывы, setОтзывы] = useState([])
  const [мероприятия, setМероприятия] = useState([])
  const [новости, setНовости] = useState([])
  
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')
  
  const [оценка, setОценка] = useState(5)
  const [текстОтзыва, setТекстОтзыва] = useState('')
  const [отправкаОтзыва, setОтправкаОтзыва] = useState(false)

  const загрузитьДанные = () => {
    setЗагрузка(true)
    Promise.all([
      api.организация(id), 
      api.рейтинг_организации(id), 
      api.отзывы_организации(id),
      api.список_мероприятий(id), 
      api.новости_организации(id)
    ])
      .then(([дОрг, дРейтинг, дОтзывы, дСобытия, дНовости]) => {
        setОрганизация(дОрг)
        setРейтинг(дРейтинг)
        setОтзывы(дОтзывы)
        setМероприятия(дСобытия)
        setНовости(дНовости)
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
      загрузитьДанные()
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
    <div className="container py-4">
      {/* Обложка и Шапка */}
      <div className="card card-campus shadow-sm mb-4 border-0 overflow-hidden">
        <div style={{ 
          height: '240px', 
          backgroundColor: 'var(--campus-primary)', 
          backgroundImage: организация.cover_url ? `url(${организация.cover_url})` : 'none', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }} />
        <div className="card-body p-4 position-relative">
          <div className="position-absolute bg-white rounded shadow-sm d-flex align-items-center justify-content-center" style={{ 
            width: '120px', 
            height: '120px', 
            top: '-60px', 
            left: '30px', 
            border: '4px solid white', 
            overflow: 'hidden' 
          }}>
            {организация.avatar_url ? (
              <img src={организация.avatar_url} alt="Аватар" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="h1 mb-0 text-muted">{организация.name[0]}</span>
            )}
          </div>
          <div className="ms-3 mt-4 pt-3 d-flex justify-content-between align-items-end">
            <div>
              <h1 className="h2 fw-bold mb-1 text-dark">{организация.name}</h1>
              <p className="text-muted mb-0">{организация.direction} • {организация.faculty} • {организация.size} участников</p>
            </div>
            <Link to={`/apply/${организация.id}`} className="btn btn-primary px-4">Подать заявку</Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* ЛЕВАЯ И ЦЕНТРАЛЬНАЯ ЧАСТЬ: Информация и Лента */}
        <div className="col-lg-8">
          <div className="card card-campus shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3 text-dark">Описание</h5>
              <p className="text-secondary mb-0">{организация.description}</p>
              <hr className="my-3" />
              <div className="text-muted small"><strong>Контакты:</strong> {организация.contacts || '—'}</div>
            </div>
          </div>

          <div className="card card-campus shadow-sm">
            <div className="card-body p-4">
              <h4 className="mb-4 fw-bold text-dark">Лента новостей</h4>
              {новости.length === 0 && <p className="text-muted small">Пока нет записей.</p>}
              <div className="d-flex flex-column gap-4">
                {новости.map(н => (
                  <div key={н.id} className="border-bottom pb-3">
                    <h5 className="fw-bold text-dark mb-2">{н.title}</h5>
                    <div className="text-muted small mb-2">{new Date(н.created_at).toLocaleString('ru-RU')}</div>
                    
                    {/* ИСПРАВЛЕННЫЙ БЛОК С КАРТИНКОЙ (contain вместо cover) */}
                    {н.image_url && (
                      <div className="mb-3 rounded overflow-hidden text-center" style={{ width: '100%', backgroundColor: '#f8f9fa' }}>
                        <img 
                          src={н.image_url} 
                          alt="Фото новости" 
                          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
                        />
                      </div>
                    )}
                    
                    <p className="mb-0 text-secondary">{н.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: События и Отзывы */}
        <div className="col-lg-4">
          <div className="card card-campus shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3 text-dark">События</h5>
              {мероприятия.length === 0 && <p className="text-muted small">Нет событий.</p>}
              <div className="d-flex flex-column gap-3">
                {мероприятия.map(м => (
                  <div key={м.id} className="border p-3 rounded bg-light">
                    <div className="fw-semibold text-dark mb-1">{м.title}</div>
                    <div className="small text-muted mb-2">{new Date(м.starts_at).toLocaleDateString('ru-RU')} • {м.place}</div>
                    <button className="btn btn-sm btn-outline-primary w-100" onClick={() => записаться(м.id)}>Записаться</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card card-campus shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold text-dark">Отзывы</h5>
                <span className="badge bg-primary rounded-pill">{рейтинг.average_rating} ★</span>
              </div>
              
              <form onSubmit={отправитьОтзыв} className="mb-4 bg-light p-3 rounded">
                <select className="form-select form-select-sm mb-2" value={оценка} onChange={e => setОценка(e.target.value)}>
                  <option value="5">5 - Отлично</option>
                  <option value="4">4 - Хорошо</option>
                  <option value="3">3 - Нормально</option>
                  <option value="2">2 - Плохо</option>
                  <option value="1">1 - Ужасно</option>
                </select>
                <textarea className="form-control form-control-sm mb-2" rows="2" placeholder="Текст отзыва..." value={текстОтзыва} onChange={e => setТекстОтзыва(e.target.value)} />
                <button className="btn btn-sm btn-primary w-100" disabled={отправкаОтзыва}>Отправить</button>
              </form>

              {отзывы.length === 0 && <p className="text-muted small">Пока нет отзывов.</p>}
              
              <div className="accordion accordion-flush" id="аккордеонОтзывов">
                {отзывы.map((отзыв, индекс) => (
                  <div className="accordion-item" key={отзыв.id}>
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button ${индекс !== 0 ? 'collapsed' : ''} px-0 bg-white shadow-none`} 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target={`#отзыв-${отзыв.id}`}
                      >
                        <span className="fw-semibold">{отзыв.rating} ★</span>
                        <span className="text-muted small ms-auto me-2">{new Date(отзыв.created_at).toLocaleDateString('ru-RU')}</span>
                      </button>
                    </h2>
                    <div id={`отзыв-${отзыв.id}`} className={`accordion-collapse collapse ${индекс === 0 ? 'show' : ''}`} data-bs-parent="#аккордеонОтзывов">
                      <div className="accordion-body px-0 text-secondary small">
                        {отзыв.text || 'Без текста'}
                      </div>
                    </div>
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