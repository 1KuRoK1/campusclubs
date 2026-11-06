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
      // Тело ответа не JSON
    }
    throw new Error(текст)
  }

  if (ответ.status === 204) return null
  return ответ.json()
}

export const api = {
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

  обновить_профиль: (данные) => 
    запрос('/me/profile', { method: 'PATCH', body: JSON.stringify(данные) }),

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

  подать_заявку: (данные) =>
    запрос('/applications', {
      method: 'POST',
      body: JSON.stringify(данные),
    }),

  мои_заявки: () => запрос('/me/applications'),

  отозвать_заявку: (appId) => 
    запрос(`/me/applications/${appId}`, { method: 'DELETE' }),

  история_заявки: (id) => запрос(`/me/applications/${id}/history`),

  мои_членства: () => запрос('/me/memberships'),

  мои_уведомления: () => запрос('/me/notifications'),

  заявки_организации: (orgId) => запрос(`/applications/organization/${orgId}`),

  сменить_статус: (appId, newStatus) =>
    запрос(`/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ new_status: newStatus, comment: 'Изменено руководителем' }),
    }),

  сохранить_приоритеты: (applicationIds) =>
    запрос('/applications/priorities', {
      method: 'PUT',
      body: JSON.stringify({ application_ids: applicationIds }),
    }),
    
  оставить_отзыв: (orgId, данные) =>
    запрос(`/organizations/${orgId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(данные),
    }),

  участники_организации: (orgId) => запрос(`/organizations/${orgId}/members`),

  роли_организации: (orgId) => запрос(`/organizations/${orgId}/roles`),

  сменить_роль_участника: (orgId, memberId, roleId) =>
    запрос(`/organizations/${orgId}/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role_id: roleId }),
    }),

  создать_организацию: (данные) =>
    запрос('/organizations', {
      method: 'POST',
      body: JSON.stringify(данные),
    }),

  список_мероприятий: (orgId) => запрос(`/events?organization_id=${orgId}`),

  записаться_на_мероприятие: (eventId) =>
    запрос(`/events/${eventId}/register`, {
      method: 'POST',
    }),

  отчет_организации: (orgId) => запрос(`/organizations/${orgId}/report`),
}