import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function СоздатьОрганизацию() {
  const navigate = useNavigate()
  const [название, setНазвание] = useState('')
  const [описание, setОписание] = useState('')
  const [направление, setНаправление] = useState('Наука и техника')
  const [формат, setФормат] = useState('Очный')
  const [факультет, setФакультет] = useState('ИРИТ-РТФ')
  const [контакты, setКонтакты] = useState('')
  const [ошибка, setОшибка] = useState('')
  const [отправка, setОтправка] = useState(false)

  async function отправить(e) {
    e.preventDefault()
    setОшибка('')
    setОтправка(true)

    try {
      await api.создать_организацию({
        name: название,
        description: описание,
        direction: направление,
        format: формат,
        faculty: факультет,
        contacts: контакты,
        size: 1 // Создатель сразу считается первым участником
      })
      navigate('/manage')
    } catch (err) {
      setОшибка(err.message)
    } finally {
      setОтправка(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/manage">Управление</Link></li>
          <li className="breadcrumb-item active">Новая организация</li>
        </ol>
      </nav>

      <div className="card card-campus shadow-sm p-4 p-md-5">
        <h1 className="h3 fw-bold mb-4 text-dark">Регистрация организации</h1>
        {ошибка && <div className="alert alert-danger">{ошибка}</div>}

        <form onSubmit={отправить}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Название организации</label>
            <input type="text" className="form-control" value={название} onChange={e => setНазвание(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Описание</label>
            <textarea className="form-control" rows={3} value={описание} onChange={e => setОписание(e.target.value)} required />
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Направление</label>
              <select className="form-select" value={направление} onChange={e => setНаправление(e.target.value)}>
                <option>Наука и техника</option>
                <option>Спорт</option>
                <option>Творчество</option>
                <option>Досуг</option>
                <option>Студенческое самоуправление</option>
                <option>Экология</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Формат</label>
              <select className="form-select" value={формат} onChange={e => setФормат(e.target.value)}>
                <option>Очный</option>
                <option>Онлайн</option>
                <option>Смешанный</option>
              </select>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Факультет</label>
              <select className="form-select" value={факультет} onChange={e => setФакультет(e.target.value)}>
                <option>ИРИТ-РТФ</option>
                <option>ИНМТ</option>
                <option>Управление</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Контакты (соцсети, аудитория)</label>
              <input type="text" className="form-control" value={контакты} onChange={e => setКонтакты(e.target.value)} placeholder="vk.com/club, ауд. 412" />
            </div>
          </div>

          <div className="d-flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={отправка}>
              {отправка ? 'Создание...' : 'Создать организацию'}
            </button>
            <Link to="/manage" className="btn btn-outline-secondary">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  )
}