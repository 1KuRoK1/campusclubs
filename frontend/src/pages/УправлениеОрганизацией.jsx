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
  const [отчет, setОтчет] = useState(null)
  const [новости, setНовости] = useState([])

  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')

  // Состояния для редактирования
  const [описание, setОписание] = useState('')
  const [аватар, setАватар] = useState(null)
  const [обложка, setОбложка] = useState(null)
  const [сохранение, setСохранение] = useState(false)

  // Состояния для новостей
  const [заголовокНовости, setЗаголовокНовости] = useState('')
  const [текстНовости, setТекстНовости] = useState('')
  const [файлНовости, setФайлНовости] = useState(null)

  // Состояния для событий
  const [названиеСобытия, setНазваниеСобытия] = useState('')
  const [место, setМесто] = useState('')
  const [дата, setДата] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) return navigate('/login')
    Promise.all([api.мой_профиль(), api.список_организаций()]).then(([п, орги]) => {
      setПрофиль(п)
      const мои = орги.filter((о) => о.lead_id === п.id)
      setОрганизации(мои)
      if (мои.length > 0) { setВыбранная(мои[0].id); setОписание(мои[0].description || '') }
    }).catch((e) => setОшибка(e.message)).finally(() => setЗагрузка(false))
  }, [navigate])

  useEffect(() => {
    if (выбранная) загрузитьДанныеОрганизации(выбранная)
  }, [выбранная])

  function загрузитьДанныеОрганизации(orgId) {
    Promise.all([
      api.заявки_организации(orgId), api.участники_организации(orgId),
      api.роли_организации(orgId), api.отчет_организации(orgId), api.новости_организации(orgId)
    ]).then(([з, у, р, о, н]) => { setЗаявки(з); setУчастники(у); setРоли(р); setОтчет(о); setНовости(н) })
  }

  async function сохранитьОрганизацию(e) {
    e.preventDefault()
    setСохранение(true)
    try {
      let avatarUrl = организации.find(o => o.id === выбранная).avatar_url
      let coverUrl = организации.find(o => o.id === выбранная).cover_url

      if (аватар) { const r = await api.загрузить_картинку(аватар); avatarUrl = r.url }
      if (обложка) { const r = await api.загрузить_картинку(обложка); coverUrl = r.url }

      await api.редактировать_организацию(выбранная, {
        ...организации.find(o => o.id === выбранная),
        description: описание, avatar_url: avatarUrl, cover_url: coverUrl
      })
      alert('Сохранено!')
      window.location.reload()
    } catch (err) { alert(err.message) } finally { setСохранение(false) }
  }

  async function добавитьНовость(e) {
    e.preventDefault()
    if (!заголовокНовости.trim() || !текстНовости.trim()) return alert('Заполните поля')
    try {
      let url = null
      if (файлНовости) { const r = await api.загрузить_фото_новости(выбранная, файлНовости); url = r.url }
      await api.создать_новость(выбранная, { title: заголовокНовости, content: текстНовости, image_url: url })
      setЗаголовокНовости(''); setТекстНовости(''); setФайлНовости(null)
      загрузитьДанныеОрганизации(выбранная)
      alert('Новость опубликована!')
    } catch (err) { alert(err.message) }
  }

  async function добавитьСобытие(e) {
    e.preventDefault()
    if (!названиеСобытия || !дата) return alert('Заполните поля')
    try {
      await api.создать_мероприятие({
        organization_id: выбранная, title: названиеСобытия, place: место, starts_at: new Date(дата).toISOString()
      })
      setНазваниеСобытия(''); setМесто(''); setДата('')
      alert('Событие создано!')
    } catch (err) { alert(err.message) }
  }

  if (загрузка) return <div className="container py-5 text-center">Загрузка...</div>
  if (организации.length === 0) return <div className="container py-5 text-center"><h3>Вы не руководитель</h3><Link to="/create-organization" className="btn btn-primary mt-3">Создать</Link></div>

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between mb-4">
        <h1 className="h3 fw-bold text-dark">Управление</h1>
        <select className="form-select w-auto" value={выбранная} onChange={(e) => { setВыбранная(Number(e.target.value)); setОписание(организации.find(o=>o.id===Number(e.target.value)).description) }}>
          {организации.map((о) => <option key={о.id} value={о.id}>{о.name}</option>)}
        </select>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {отчет && <div className="row g-3 mb-4"><div className="col-4"><div className="card p-3 text-center"><small>Участники</small><h2>{отчет.members_count}</h2></div></div><div className="col-4"><div className="card p-3 text-center"><small>События</small><h2>{отчет.events_count}</h2></div></div><div className="col-4"><div className="card p-3 text-center"><small>Документы</small><h2>{отчет.documents_count}</h2></div></div></div>}

          <div className="card mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Редактирование страницы</h5>
              <form onSubmit={сохранитьОрганизацию}>
                <div className="mb-2"><label className="small">Аватарка (файл)</label><input type="file" className="form-control form-control-sm" accept="image/*" onChange={e => setАватар(e.target.files[0])} /></div>
                <div className="mb-2"><label className="small">Обложка (файл)</label><input type="file" className="form-control form-control-sm" accept="image/*" onChange={e => setОбложка(e.target.files[0])} /></div>
                <div className="mb-2"><label className="small">Описание</label><textarea className="form-control" rows="3" value={описание} onChange={e => setОписание(e.target.value)} /></div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={сохранение}>{сохранение ? 'Загрузка...' : 'Сохранить'}</button>
              </form>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Создать событие</h5>
              <form onSubmit={добавитьСобытие} className="row g-2">
                <div className="col-12"><input type="text" className="form-control form-control-sm" placeholder="Название события" value={названиеСобытия} onChange={e => setНазваниеСобытия(e.target.value)} required /></div>
                <div className="col-md-6"><input type="text" className="form-control form-control-sm" placeholder="Место" value={место} onChange={e => setМесто(e.target.value)} required /></div>
                <div className="col-md-6"><input type="datetime-local" className="form-control form-control-sm" value={дата} onChange={e => setДата(e.target.value)} required /></div>
                <div className="col-12"><button type="submit" className="btn btn-success btn-sm">Добавить</button></div>
              </form>
            </div>
          </div>

          <h5 className="fw-bold mb-3">Заявки</h5>
          <div className="list-group">
            {заявки.map(з => (
              <div key={з.id} className="list-group-item d-flex justify-content-between">
                 <span>Заявка #{з.id} ({з.status})</span>
                 <div className="d-flex gap-1">
                   {з.status === 'подана' && <button className="btn btn-sm btn-primary" onClick={() => api.сменить_статус(з.id, 'рассмотрение').then(()=>загрузитьДанныеОрганизации(выбранная))}>На рассмотрение</button>}
                   {з.status === 'рассмотрение' && <button className="btn btn-sm btn-info" onClick={() => api.сменить_статус(з.id, 'собеседование').then(()=>загрузитьДанныеОрганизации(выбранная))}>Собеседование</button>}
                   {з.status === 'собеседование' && <button className="btn btn-sm btn-success" onClick={() => api.сменить_статус(з.id, 'решение').then(()=>загрузитьДанныеОрганизации(выбранная))}>Принять</button>}
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Новый пост</h5>
              <form onSubmit={добавитьНовость}>
                <input type="text" className="form-control form-control-sm mb-2" placeholder="Заголовок" value={заголовокНовости} onChange={e => setЗаголовокНовости(e.target.value)} required />
                <textarea className="form-control form-control-sm mb-2" rows="3" placeholder="Текст поста..." value={текстНовости} onChange={e => setТекстНовости(e.target.value)} required />
                <input type="file" className="form-control form-control-sm mb-2" accept="image/*" onChange={e => setФайлНовости(e.target.files[0])} />
                <button type="submit" className="btn btn-primary btn-sm w-100">Опубликовать</button>
              </form>
            </div>
          </div>
          <h5 className="fw-bold mb-3">Мои посты</h5>
          {новости.map(н => (
            <div key={н.id} className="card p-2 mb-2 d-flex flex-row justify-content-between align-items-center">
               <small className="text-truncate" style={{maxWidth: '80%'}}>{н.title}</small>
               <button className="btn btn-sm btn-outline-danger" onClick={() => api.удалить_новость(выбранная, н.id).then(()=>загрузитьДанныеОрганизации(выбранная))}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}