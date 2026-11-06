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

  // Состояния для редактирования профиля
  const [форма, setФорма] = useState({
    full_name: '',
    faculty: '',
    group: '',
    bio: '',
    portfolio_url: ''
  })
  const [редактирование, setРедактирование] = useState(false)

  const загрузитьДанные = () => {
    Promise.all([
      api.мой_профиль(),
      api.мои_заявки(),
      api.мои_уведомления(),
      api.мои_членства(),
    ])
      .then(([п, з, у, ч]) => {
        setПрофиль(п)
        setФорма({
          full_name: п.full_name || '',
          faculty: п.faculty || '',
          group: п.group || '',
          bio: п.bio || '',
          portfolio_url: п.portfolio_url || ''
        })
        
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

  function изменитьПоле(поле, значение) {
    setФорма(prev => ({ ...prev, [поле]: значение }))
  }

  async function сохранитьПрофиль(e) {
    e.preventDefault()
    try {
      await api.обновить_профиль(форма)
      setРедактирование(false)
      загрузитьДанные()
    } catch (e) {
      alert(e.message)
    }
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
              {!редактирование ? (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">{профиль.full_name}</h5>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setРедактирование(true)}>Редактировать</button>
                  </div>
                  <div className="text-muted small mb-3">{профиль.email} • {профиль.role}</div>
                  
                  <div className="mb-2"><strong className="text-dark">О себе:</strong> {форма.bio || 'Не заполнено'}</div>
                  <div className="mb-2"><strong className="text-dark">Портфолио:</strong> {форма.portfolio_url ? <a href={форма.portfolio_url} target="_blank" rel="noreferrer">{форма.portfolio_url}</a> : 'Не заполнено'}</div>
                  
                  <div className="row g-3 mt-1 text-muted small">
                    <div className="col-sm-6"><span className="fw-semibold text-dark">Факультет:</span> {форма.faculty || '—'}</div>
                    <div className="col-sm-6"><span className="fw-semibold text-dark">Группа:</span> {форма.group || '—'}</div>
                  </div>
                </>
              ) : (
                <form onSubmit={сохранитьПрофиль}>
                  <h5 className="mb-3">Редактирование профиля</h5>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold">ФИО</label>
                    <input className="form-control" value={форма.full_name} onChange={e => изменитьПоле('full_name', e.target.value)} required />
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Факультет</label>
                      <select className="form-select" value={форма.faculty} onChange={e => изменитьПоле('faculty', e.target.value)}>
                        <option value="">Выберите...</option>
                        <option value="ИРИТ-РТФ">ИРИТ-РТФ</option>
                        <option value="ИНМТ">ИНМТ</option>
                        <option value="Управление">Управление</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Группа</label>
                      <input className="form-control" value={форма.group} onChange={e => изменитьПоле('group', e.target.value)} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">О себе (это уйдет в анкеты)</label>
                    <textarea className="form-control" rows={2} value={форма.bio} onChange={e => изменитьПоле('bio', e.target.value)} placeholder="Расскажите о своих навыках..." />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Ссылка на портфолио</label>
                    <input type="url" className="form-control" value={форма.portfolio_url} onChange={e => изменитьПоле('portfolio_url', e.target.value)} placeholder="https://github.com/..." />
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" type="submit">Сохранить</button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setРедактирование(false)}>Отмена</button>
                  </div>
                </form>
              )}
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