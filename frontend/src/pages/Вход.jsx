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

    if (!email.trim() || !пароль.trim()) {
      return setОшибка('Заполните все поля')
    }

    setОтправка(true)
    try {
      await api.вход(email, пароль)
      window.dispatchEvent(new Event('auth-change')) // Сообщаем шапке, что вошли
      navigate('/cabinet')
    } catch (e) {
      setОшибка(e.message)
    } finally {
      setОтправка(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <h1 className="h3 mb-4 fw-bold text-dark">Вход в систему</h1>

      {ошибка && <div className="alert alert-danger">{ошибка}</div>}

      <form onSubmit={войти} className="card card-campus p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label small fw-bold">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
        </div>

        <div className="mb-4">
          <label className="form-label small fw-bold">Пароль</label>
          <input
            type="password"
            className="form-control"
            value={пароль}
            onChange={(e) => setПароль(e.target.value)}
            required
            minLength={6}
            placeholder="••••••"
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={отправка}>
          {отправка ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="text-muted small mt-4 text-center">
        Демо-доступ: <strong>anna.kovaleva@example.com</strong> / <strong>demo1234</strong>
      </p>
    </div>
  )
}