import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const СТАТУСЫ = {
  'подана': 'secondary',
  'рассмотрение': 'info',
  'собеседование': 'warning',
  'решение': 'success',
}

export default function ЛичныйКабинет() {
  const navigate = useNavigate()
  const [профиль, setПрофиль] = useState(null)
  const [заявки, setЗаявки] = useState([])
  const [уведомления, setУведомления] = useState([])
  const [членства, setЧленства] = useState([])
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    Promise.all([
      api.мой_профиль(),
      api.мои_заявки(),
      api.мои_уведомления(),
      api.мои_членства(),
    ])
      .then(([п, з, у, ч]) => {
        setПрофиль(п)
        setЗаявки(з)
        setУведомления(у)
        setЧленства(ч)
      })
      .catch((e) => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }, [navigate])

  function выйти() {
    api.выход()
    navigate('/login')
  }

  if (загрузка) return <div className="container py-4"><p className="text-muted">Загрузка...</p></div>
  if (ошибка) return <div className="container py-4"><div className="alert alert-danger">{ошибка}</div></div>

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Личный кабинет</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={выйти}>
          Выйти
        </button>
      </div>

      {профиль && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">{профиль.full_name}</h5>
            <p className="text-muted mb-1">{профиль.email}</p>
            <p className="text-muted mb-0 small">
              Роль: {профиль.role}
              {профиль.faculty && ` · ${профиль.faculty}`}
              {профиль.group && ` · ${профиль.group}`}
            </p>
          </div>
        </div>
      )}

      <h2 className="h5 mb-3">Мои заявки</h2>
      {заявки.length === 0 && <p className="text-muted">Заявок пока нет.</p>}
      <div className="list-group mb-4">
        {заявки.map((з) => (
          <div key={з.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <Link to={`/organizations/${з.organization_id}`} className="fw-semibold text-decoration-none">
                  Заявка №{з.id} в организацию #{з.organization_id}
                </Link>
                <div className="text-muted small">
                  Подана: {new Date(з.created_at).toLocaleDateString('ru-RU')}
                </div>
                {з.comment && <div className="small mt-1">{з.comment}</div>}
              </div>
              <span className={`badge bg-${СТАТУСЫ[з.status] || 'secondary'}`}>
                {з.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="h5 mb-3">Членства</h2>
      {членства.length === 0 && <p className="text-muted">Вы пока не состоите ни в одной организации.</p>}
      <div className="list-group mb-4">
        {членства.map((ч) => (
          <div key={ч.id} className="list-group-item">
            <Link to={`/organizations/${ч.organization_id}`} className="text-decoration-none">
              Организация #{ч.organization_id}
            </Link>
            <span className="text-muted small ms-2">
              с {new Date(ч.joined_at).toLocaleDateString('ru-RU')} · {ч.status}
            </span>
          </div>
        ))}
      </div>

      <h2 className="h5 mb-3">Уведомления</h2>
      {уведомления.length === 0 && <p className="text-muted">Уведомлений нет.</p>}
      <div className="list-group">
        {уведомления.map((у) => (
          <div
            key={у.id}
            className={`list-group-item ${у.is_read ? '' : 'list-group-item-light fw-semibold'}`}
          >
            <div>{у.message}</div>
            <div className="text-muted small">
              {new Date(у.created_at).toLocaleString('ru-RU')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}