import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function УправлениеОрганизацией() {
  const navigate = useNavigate()
  const [профиль, setПрофиль] = useState(null)
  const [организации, setОрганизации] = useState([])
  const [выбранная, setВыбранная] = useState(null)
  
  const [заявки, setЗаявки] = useState([])
  const [участники, setУчастники] = useState([])
  const [роли, setРоли] = useState([])
  const [отчет, setОтчет] = useState(null) // Состояние для цифр

  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    Promise.all([api.мой_профиль(), api.список_организаций()])
      .then(([п, орги]) => {
        setПрофиль(п)
        // Оставляем только те организации, где текущий юзер - лидер
        const мои = орги.filter((о) => о.lead_id === п.id)
        setОрганизации(мои)
        if (мои.length > 0) setВыбранная(мои[0].id)
      })
      .catch((e) => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }, [navigate])

  useEffect(() => {
    if (!выбранная) return
    загрузитьДанныеОрганизации(выбранная)
  }, [выбранная])

  function загрузитьДанныеОрганизации(orgId) {
    Promise.all([
      api.заявки_организации(orgId),
      api.участники_организации(orgId),
      api.роли_организации(orgId),
      api.отчет_организации(orgId) // Запрашиваем сводку
    ]).then(([з, у, р, о]) => {
      setЗаявки(з)
      setУчастники(у)
      setРоли(р)
      setОтчет(о)
    })
  }

  async function сменитьСтатус(id, новыйСтатус) {
    try {
      await api.сменить_статус(id, новыйСтатус)
      загрузитьДанныеОрганизации(выбранная)
    } catch (e) {
      alert(e.message)
    }
  }

  async function изменитьРоль(участникId, roleId) {
    try {
      await api.сменить_роль_участника(выбранная, участникId, Number(roleId))
      загрузитьДанныеОрганизации(выбранная)
    } catch (e) {
      alert(e.message)
    }
  }

  if (загрузка) return <div className="container py-5 text-center text-muted">Загрузка...</div>
  if (ошибка) return <div className="container py-5"><div className="alert alert-danger">{ошибка}</div></div>

  if (организации.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h3 mb-3 text-dark">Управление организацией</h1>
        <div className="alert alert-warning mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
          Вы не являетесь руководителем ни одной организации.
        </div>
        <Link to="/create-organization" className="btn btn-primary">
          Создать свою организацию
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <h1 className="h3 fw-bold mb-0 text-dark">Управление</h1>
        <Link to="/create-organization" className="btn btn-outline-primary btn-sm">
          + Создать организацию
        </Link>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold">Выберите организацию</label>
        <select
          className="form-select"
          value={выбранная || ''}
          onChange={(e) => setВыбранная(Number(e.target.value))}
        >
          {организации.map((о) => (
            <option key={о.id} value={о.id}>{о.name}</option>
          ))}
        </select>
      </div>

      {/* ДАШБОРД ОТЧЕТНОСТИ */}
      {отчет && (
        <div className="row g-3 mb-5">
          <div className="col-md-4">
            <div className="card card-campus p-4 text-center h-100">
              <div className="text-muted small mb-1 text-uppercase fw-semibold">Участники</div>
              <div className="display-5 fw-bold" style={{ color: 'var(--campus-primary)' }}>
                {отчет.members_count}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card card-campus p-4 text-center h-100">
              <div className="text-muted small mb-1 text-uppercase fw-semibold">Мероприятия</div>
              <div className="display-5 fw-bold" style={{ color: 'var(--campus-primary)' }}>
                {отчет.events_count}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card card-campus p-4 text-center h-100">
              <div className="text-muted small mb-1 text-uppercase fw-semibold">Документы</div>
              <div className="display-5 fw-bold" style={{ color: 'var(--campus-primary)' }}>
                {отчет.documents_count}
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="h5 mb-3 fw-bold">Входящие заявки</h2>
      {заявки.length === 0 && <p className="text-muted">Новых заявок нет.</p>}
      <div className="list-group mb-5">
        {заявки.map((з) => (
          <div key={з.id} className="list-group-item p-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">Заявка №{з.id} от пользователя #{з.user_id}</div>
                {з.comment && <div className="small text-muted mt-1">«{з.comment}»</div>}
              </div>
              <span className="badge bg-secondary">{з.status}</span>
            </div>

            {з.ответы && з.ответы.length > 0 && (
              <div className="bg-light p-3 rounded mb-3 small">
                <div className="fw-semibold mb-2">Ответы на анкету:</div>
                {з.ответы.map((о, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-muted">{о.question}</span><br/>{о.answer}
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 align-items-center mt-3 pt-3 border-top">
              {з.status === 'подана' && (
                <button className="btn btn-sm btn-primary" onClick={() => сменитьСтатус(з.id, 'рассмотрение')}>
                  Взять на рассмотрение
                </button>
              )}
              
              {з.status === 'рассмотрение' && (
                <button className="btn btn-sm btn-info text-white" onClick={() => сменитьСтатус(з.id, 'собеседование')}>
                  Назначить собеседование
                </button>
              )}

              {з.status === 'собеседование' && (
                <>
                  <button className="btn btn-sm btn-success" onClick={() => сменитьСтатус(з.id, 'решение')}>
                    Принять в организацию
                  </button>
                  <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => сменитьСтатус(з.id, 'подана')}>
                    Отклонить (вернуть)
                  </button>
                </>
              )}
              
              {з.status === 'решение' && (
                <span className="text-success fw-bold small">Студент зачислен в состав</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="h5 mb-3 fw-bold">Участники организации</h2>
      {участники.length === 0 && <p className="text-muted">В организации пока нет участников.</p>}
      <div className="list-group">
        {участники.map((у) => (
          <div key={у.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="fw-semibold">{у.user ? у.user.full_name : 'Студент'}</div>
              <div className="text-muted small">{у.user ? у.user.email : ''}</div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Должность:</span>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={у.role_id || ''}
                onChange={(e) => изменитьРоль(у.id, e.target.value)}
              >
                <option value="">Без должности</option>
                {роли.map(р => (
                  <option key={р.id} value={р.id}>{р.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}