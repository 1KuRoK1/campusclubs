const БАЗОВЫЙ_АДРЕС = '/api'

function получить_токен() {
  return localStorage.getItem('token')
}

function сохранить_токен(токен) {
  localStorage.setItem('token', токен)
}

function удалить_токен() {
  localStorage.removeItem('token')
}

async function запрос(путь, опции = {}) {
  const заголовки = {
    'Content-Type': 'application/json',
    ...(опции.headers || {}),
  }

  const токен = получить_токен()
  if (токен) {
    заголовки['Authorization'] = `Bearer ${токен}`
  }

  const ответ = await fetch(`${БАЗОВЫЙ_АДРЕС}${путь}`, {
    ...опции,
    headers: заголовки,
  })

  if (ответ.status === 401) {
    удалить_токен()
  }

  if (!ответ.ok) {
    let текст = `Ошибка ${ответ.status}`
    try {
      const данные = await ответ.json()
      if (данные.detail) текст = данные.detail
    } catch {
      // тело не JSON
    }
    throw new Error(текст)
  }

  if (ответ.status === 204) return null
  return ответ.json()
}

export const api = {
  // аутентификация
  вход: async (email, password) => {
    const тело = new URLSearchParams()
    тело.append('username', email)
    тело.append('password', password)

    const ответ = await fetch(`${БАЗОВЫЙ_АДРЕС}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: тело.toString(),
    })

    if (!ответ.ok) {
      throw new Error('Неверный email или пароль')
    }

    const данные = await ответ.json()
    сохранить_токен(данные.access_token)
    return данные
  },

  выход: () => {
    удалить_токен()
  },

  мой_профиль: () => запрос('/auth/me'),

  // организации
  список_организаций: (параметры = {}) => {
    const часть = new URLSearchParams()
    Object.entries(параметры).forEach(([ключ, значение]) => {
      if (значение !== undefined && значение !== null && значение !== '') {
        часть.append(ключ, значение)
      }
    })
    const строка = часть.toString()
    return запрос(`/organizations${строка ? '?' + строка : ''}`)
  },

  организация: (id) => запрос(`/organizations/${id}`),

  фильтры_организаций: () => запрос('/organizations/filters'),

  отзывы_организации: (id) => запрос(`/organizations/${id}/reviews`),

  рейтинг_организации: (id) => запрос(`/organizations/${id}/rating`),

  // заявки
  подать_заявку: (данные) =>
    запрос('/applications', {
      method: 'POST',
      body: JSON.stringify(данные),
    }),

  мои_заявки: () => запрос('/me/applications'),

  история_заявки: (id) => запрос(`/me/applications/${id}/history`),

  мои_членства: () => запрос('/me/memberships'),

  мои_уведомления: () => запрос('/me/notifications'),
}