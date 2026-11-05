import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const СТАТУСЫ = ['подана', 'рассмотрение', 'собеседование', 'решение']

export default function УправлениеОрганизацией() {
  const navigate = useNavigate()
  const [профиль, setПрофиль] = useState(null)
  const [организации, setОрганизации] = useState([])
  const [выбранная, setВыбранная] = useState(null)
  const [заявки, setЗаявки] = useState([])
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
        const мои = орги.filter((о) => о.lead_id === п.id)
        setОрганизации(мои)
        if (мои.length > 0) setВыбранная(мои[0].id)
      })
      .catch((e) => setОшибка(e.message))
      .finally(() => setЗагрузка(false))
  }, [navigate])

  useEffect(() => {
    if (!выбранная) return
    api.заявки_организации(выбранная)
      .then(setЗаявки)
      .catch(() => {})
  }, [выбранная])

  async function сменитьСтатус(id, новыйСтатус) {
    try {
      await api.сменить_статус(id, новыйСтатус)
      const обновленные = await api.заявки_организации(выбранная)
      setЗаявки(обновленные)
    } catch (e) {
      alert(e.message)
    }
  }

  if (загрузка) return <div className="container py-4"><p className="text-muted">Загрузка...</p></div>
  if (ошибка) return <div className="container py-4"><div className="alert alert-danger">{ошибка}</div></div>

  if (организации.length === 0) {
    return (
      <div className="container py-4">
        <h1 className="h3 mb-3">Управление организацией</h1>
        <div className="alert alert-warning">
          Вы не являетесь руководителем ни одной организации.
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Управление организацией</h1>

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

      <h2 className="h5 mb-3">Входящие заявки</h2>
      {заявки.length === 0 && <p className="text-muted">Новых заявок нет.</p>}

      <div className="list-group">
        {заявки.map((з) => (
          <div key={з.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">Заявка №{з.id}</div>
                <div className="text-muted small">
                  Подана: {new Date(з.created_at).toLocaleString('ru-RU')}
                </div>
                {з.comment && <div className="small mt-1">Комментарий: {з.comment}</div>}
              </div>
              <span className="badge bg-secondary">{з.status}</span>
            </div>

            {з.ответы && з.ответы.length > 0 && (
              <div className="bg-light p-2 rounded mb-2 small">
                <div className="fw-semibold mb-1">Ответы на анкету:</div>
                {з.ответы.map((о, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-muted">{о.question}</span>
                    <br />{о.answer}
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex gap-2 align-items-center">
              <span className="small text-muted">Перевести в:</span>
              {СТАТУСЫ.filter((с) => с !== з.status).map((с) => (
                <button
                  key={с}
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => сменитьСтатус(з.id, с)}
                >
                  {с}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}