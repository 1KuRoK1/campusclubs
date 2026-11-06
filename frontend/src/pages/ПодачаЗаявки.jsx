import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function ПодачаЗаявки() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [организация, setОрганизация] = useState(null)
  const [комментарий, setКомментарий] = useState('')
  const [ответы, setОтветы] = useState([
    { question: 'Почему вы хотите вступить в организацию?', answer: '' },
    { question: 'Сколько времени готовы уделять в неделю?', answer: '' },
    { question: 'Есть ли у вас опыт в этой сфере?', answer: '' },
  ])
  const [ошибка, setОшибка] = useState('')
  const [отправка, setОтправка] = useState(false)
  const [успех, setУспех] = useState(false)

  useEffect(() => {
    api.организация(id)
      .then(setОрганизация)
      .catch((e) => setОшибка(e.message))
  }, [id])

  function изменитьОтвет(индекс, значение) {
    const новые = [...ответы]
    новые[индекс].answer = значение
    setОтветы(новые)
  }

  async function отправить(e) {
    e.preventDefault()
    setОшибка('')
    setОтправка(true)

    const заполненные = ответы.filter((о) => о.answer.trim() !== '')

    try {
      await api.подать_заявку({
        organization_id: Number(id),
        comment: комментарий || null,
        ответы: заполненные,
      })
      setУспех(true)
      setTimeout(() => navigate('/cabinet'), 1500)
    } catch (e) {
      setОшибка(e.message)
    } finally {
      setОтправка(false)
    }
  }

  if (!организация && !ошибка) {
    return <div className="container py-5 text-center text-muted">Загрузка...</div>
  }

  if (успех) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-success d-inline-block px-5">
          Заявка успешно отправлена. Переход в личный кабинет...
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Каталог</Link></li>
          {организация && (
            <li className="breadcrumb-item">
              <Link to={`/organizations/${id}`}>{организация.name}</Link>
            </li>
          )}
          <li className="breadcrumb-item active">Заявка</li>
        </ol>
      </nav>

      <div className="card card-campus shadow-sm p-4 p-md-5">
        <h1 className="h3 fw-bold mb-2 text-dark">Заявка на вступление</h1>
        {организация && (
          <p className="text-muted mb-4">Организация: <strong>{организация.name}</strong></p>
        )}

        {ошибка && <div className="alert alert-danger">{ошибка}</div>}

        <form onSubmit={отправить}>
          <div className="mb-4">
            <label className="form-label fw-semibold">Анкета кандидата</label>
            <p className="text-muted small mb-3">Ваши контакты и портфолио автоматически прикрепятся из профиля.</p>
            
            {ответы.map((ответ, индекс) => (
              <div className="mb-3" key={индекс}>
                <label className="form-label small text-muted">{ответ.question}</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={ответ.answer}
                  onChange={(e) => изменитьОтвет(индекс, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Дополнительный комментарий</label>
            <textarea
              className="form-control"
              rows={3}
              value={комментарий}
              onChange={(e) => setКомментарий(e.target.value)}
              placeholder="Необязательно"
            />
          </div>

          <div className="d-flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary" disabled={отправка}>
              {отправка ? 'Отправка...' : 'Отправить заявку'}
            </button>
            <Link to={`/organizations/${id}`} className="btn btn-outline-secondary">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}