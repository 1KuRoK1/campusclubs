import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Вход() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [пароль, setПароль] = useState('')
  const [ошибка, setОшибка] = useState('')
  const [отправка, setОтправка] = useState(false)

  async function войти(e) {
    e.preventDefault()
    setОшибка('')
    setОтправка(true)

    try {
      await api.вход(email, пароль)
      navigate('/cabinet')
    } catch (e) {
      setОшибка(e.message)
    } finally {
      setОтправка(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <h1 className="h3 mb-4">Вход в систему</h1>

      {ошибка && <div className="alert alert-danger">{ошибка}</div>}

      <form onSubmit={войти}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Пароль</label>
          <input
            type="password"
            className="form-control"
            value={пароль}
            onChange={(e) => setПароль(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={отправка}>
          {отправка ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="text-muted small mt-4">
        Для проверки: anna.kovaleva@example.com / demo1234
      </p>
    </div>
  )
}