import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const СТАТУСЫ = {
  'подана': 'bg-status-submitted',
  'рассмотрение': 'bg-status-review',
  'собеседование': 'bg-status-interview',
  'решение': 'bg-status-decision',
}

export default function ЛичныйКабинет() {
  const navigate = useNavigate()
  const [профиль, setПрофиль] = useState(null)
  const [заявки, setЗаявки] = useState([])
  const [уведомления, setУведомления] = useState([])
  const [членства, setЧленства] = useState([])
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')

  const загрузитьДанные = () => {
    Promise.all([
      api.мой_профиль(),
      api.мои_заявки(),
      api.мои_уведомления(),
      api.мои_членства(),
    ])
      .then(([п, з, у, ч]) => {
        setПрофиль(п)
        const отсортированные = з.sort((a, b) => a.priority - b.priority)
        setЗаявки(отсортированные)
        setУведомления(у)
        setЧленства(ч)
      })
      .catch((e) => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    загрузитьДанные()
  }, [navigate])

  function выйти() {
    api.выход()
    navigate('/login')
  }

  async function переместитьЗаявку(индекс, направление) {
    const новыеЗаявки = [...заявки]
    const новыйИндекс = индекс + направление
    
    if (новыйИндекс < 0 || новыйИндекс >= новыеЗаявки.length) return

    const temp = новыеЗаявки[индекс]
    новыеЗаявки[индекс] = новыеЗаявки[новыйИндекс]
    новыеЗаявки[новыйИндекс] = temp

    setЗаявки(новыеЗаявки)

    const ids = новыеЗаявки.map(з => з.id)
    try {
      await api.сохранить_приоритеты(ids)
    } catch (e) {
      alert('Не удалось сохранить приоритет: ' + e.message)
      загрузитьДанные()
    }
  }

  if (загрузка) return <div className="container py-5 text-center text-muted">Загрузка...</div>
  if (ошибка) return <div className="container py-5"><div className="alert alert-danger">{ошибка}</div></div>

  return (
    <div className="container py-5">
      <div className="mx-auto" style={{ maxWidth: '800px' }}>
        
        <div className="d-flex justify-content-between align-items-end mb-4">
          <h1 className="h3 fw-bold mb-0 text-dark">Личный кабинет</h1>
          <button className="btn btn-outline-danger btn-sm" onClick={выйти}>
            Выйти из аккаунта
          </button>
        </div>

        {профиль && (
          <div className="card card-campus shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">{профиль.full_name}</h5>
              <div className="row g-3 text-muted small">
                <div className="col-sm-6">
                  <span className="fw-semibold text-dark">Email:</span> {профиль.email}
                </div>
                <div className="col-sm-6">
                  <span className="fw-semibold text-dark">Роль:</span> <span className="text-capitalize">{профиль.role}</span>
                </div>
                <div className="col-sm-6">
                  <span className="fw-semibold text-dark">Факультет:</span> {профиль.faculty || '—'}
                </div>
                <div className="col-sm-6">
                  <span className="fw-semibold text-dark">Группа:</span> {профиль.group || '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card card-campus shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">Мои заявки</h5>
              <small className="text-muted">Стрелки меняют приоритет</small>
            </div>
            
            {заявки.length === 0 && <p className="text-muted small mb-0">Вы еще не подавали заявок.</p>}
            
            {заявки.length > 0 && (
              <div className="list-group list-group-campus">
                {заявки.map((з, индекс) => (
                  <div key={з.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex flex-column gap-1">
                        <button 
                          className="btn btn-sm btn-light border p-0 px-1" 
                          style={{ fontSize: '10px', lineHeight: '1' }}
                          onClick={() => переместитьЗаявку(индекс, -1)}
                          disabled={индекс === 0}
                        >
                          ▲
                        </button>
                        <button 
                          className="btn btn-sm btn-light border p-0 px-1" 
                          style={{ fontSize: '10px', lineHeight: '1' }}
                          onClick={() => переместитьЗаявку(индекс, 1)}
                          disabled={индекс === заявки.length - 1}
                        >
                          ▼
                        </button>
                      </div>

                      <div>
                        <div className="fw-bold mb-1" style={{ color: 'var(--campus-primary)' }}>
                          Приоритет {индекс + 1}
                        </div>
                        
                        {/* ВЫВОДИМ НАЗВАНИЕ ОРГАНИЗАЦИИ И НАПРАВЛЕНИЕ */}
                        <Link to={`/organizations/${з.organization_id}`} className="fw-semibold text-decoration-none text-dark d-block">
                          {з.organization ? з.organization.name : `Организация #${з.organization_id}`}
                        </Link>
                        {з.organization && з.organization.direction && (
                          <div className="text-muted small mb-1">
                            {з.organization.direction}
                          </div>
                        )}

                        <div className="text-muted small mt-1">
                          Подана: {new Date(з.created_at).toLocaleDateString('ru-RU')}
                        </div>
                        {з.comment && <div className="small mt-1 text-secondary">«{з.comment}»</div>}
                      </div>
                    </div>

                    <span className={`badge badge-status ${СТАТУСЫ[з.status] || 'bg-secondary text-white'} align-self-start align-self-md-center`}>
                      {з.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card card-campus shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="card-title mb-4">Мои организации</h5>
            {членства.length === 0 && <p className="text-muted small mb-0">Вы пока не состоите ни в одной организации.</p>}
            
            {членства.length > 0 && (
              <div className="list-group list-group-campus">
                {членства.map((ч) => (
                  <div key={ч.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <Link to={`/organizations/${ч.organization_id}`} className="fw-semibold text-decoration-none" style={{ color: 'var(--campus-primary)' }}>
                      Организация #{ч.organization_id}
                    </Link>
                    <span className="text-muted small">
                      В составе с {new Date(ч.joined_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card card-campus shadow-sm">
          <div className="card-body p-4">
            <h5 className="card-title mb-4">Уведомления</h5>
            {уведомления.length === 0 && <p className="text-muted small mb-0">Новых уведомлений нет.</p>}
            
            {уведомления.length > 0 && (
              <div className="list-group list-group-campus">
                {уведомления.map((у) => (
                  <div key={у.id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div className={у.is_read ? 'text-muted' : 'fw-semibold'}>
                      {у.message}
                    </div>
                    <span className="text-muted small text-nowrap ms-3">
                      {new Date(у.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}