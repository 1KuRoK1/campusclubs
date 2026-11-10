import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Администрирование() {
  const navigate = useNavigate()
  const [пользователи, setПользователи] = useState([])
  const [организации, setОрганизации] = useState([])
  const [загрузка, setЗагрузка] = useState(true)
  const [ошибка, setОшибка] = useState('')
  const [вкладка, setВкладка] = useState('пользователи')

  // Состояния для поиска
  const [поискПольз, setПоискПольз] = useState('')
  const [рольФильтр, setРольФильтр] = useState('')
  const [поискОрг, setПоискОрг] = useState('')

  const загрузить = () => {
    setЗагрузка(true)
    if (вкладка === 'пользователи') {
      api.все_пользователи({ q: поискПольз, role: рольФильтр })
        .then(setПользователи)
        .catch((e) => setОшибка(e.message))
        .finally(() => setЗагрузка(false))
    } else {
      api.все_организации_админ({ q: поискОрг })
        .then(setОрганизации)
        .catch((e) => setОшибка(e.message))
        .finally(() => setЗагрузка(false))
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    const таймер = setTimeout(загрузить, 300)
    return () => clearTimeout(таймер)
  }, [navigate, вкладка, поискПольз, рольФильтр, поискОрг])

  async function сменитьРоль(id, role) {
    try {
      await api.сменить_роль_пользователя(id, role)
      загрузить()
    } catch (e) {
      alert(e.message)
    }
  }

  async function удалитьПользователя(id) {
    if (!window.confirm('Удалить пользователя? Это действие необратимо.')) return
    try {
      await api.удалить_пользователя(id)
      загрузить()
    } catch (e) {
      alert(e.message)
    }
  }

  async function удалитьОрганизацию(id) {
    if (!window.confirm('Удалить организацию? Это действие необратимо.')) return
    try {
      await api.удалить_организацию_админ(id)
      загрузить()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="container py-5">
      <h1 className="h3 fw-bold mb-4 text-dark">Панель администратора</h1>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${вкладка === 'пользователи' ? 'active' : ''}`} onClick={() => setВкладка('пользователи')}>Пользователи</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${вкладка === 'организации' ? 'active' : ''}`} onClick={() => setВкладка('организации')}>Организации</button>
        </li>
      </ul>

      {вкладка === 'пользователи' && (
        <>
          <div className="row mb-3 g-2">
            <div className="col-md-6">
              <input type="text" className="form-control" placeholder="Поиск по ФИО или Email..." value={поискПольз} onChange={e => setПоискПольз(e.target.value)} />
            </div>
            <div className="col-md-4">
              <select className="form-select" value={рольФильтр} onChange={e => setРольФильтр(e.target.value)}>
                <option value="">Все роли</option>
                <option value="студент">Студенты</option>
                <option value="руководитель">Руководители</option>
                <option value="администрация">Администрация</option>
              </select>
            </div>
          </div>

          <div className="card card-campus shadow-sm">
            <div className="card-body p-0">
              {загрузка ? <p className="p-4 text-center text-muted">Загрузка...</p> : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ФИО</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th className="text-end">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {пользователи.map(u => (
                        <tr key={u.id}>
                          <td>{u.full_name}</td>
                          <td className="text-muted">{u.email}</td>
                          <td>
                            <select className="form-select form-select-sm" style={{ width: '150px' }} value={u.role} onChange={(e) => сменитьРоль(u.id, e.target.value)}>
                              <option value="студент">Студент</option>
                              <option value="руководитель">Руководитель</option>
                              <option value="администрация">Администрация</option>
                            </select>
                          </td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => удалитьПользователя(u.id)}>Удалить</button>
                          </td>
                        </tr>
                      ))}
                      {пользователи.length === 0 && <tr><td colSpan="4" className="text-center text-muted py-3">Ничего не найдено</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {вкладка === 'организации' && (
        <>
          <div className="row mb-3">
            <div className="col-md-6">
              <input type="text" className="form-control" placeholder="Поиск по названию..." value={поискОрг} onChange={e => setПоискОрг(e.target.value)} />
            </div>
          </div>

          <div className="card card-campus shadow-sm">
            <div className="card-body p-0">
              {загрузка ? <p className="p-4 text-center text-muted">Загрузка...</p> : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Название</th>
                        <th>Направление</th>
                        <th>Участников</th>
                        <th className="text-end">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {организации.map(o => (
                        <tr key={o.id}>
                          <td>{o.name}</td>
                          <td className="text-muted">{o.direction}</td>
                          <td>{o.size}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => удалитьОрганизацию(o.id)}>Удалить</button>
                          </td>
                        </tr>
                      ))}
                      {организации.length === 0 && <tr><td colSpan="4" className="text-center text-muted py-3">Ничего не найдено</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}