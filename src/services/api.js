// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Важно для отправки куки сессии
});

// === Интерцептор запроса: добавляем CSRF-токен ===
api.interceptors.request.use((config) => {
  // Получаем токен из cookie (Django по умолчанию хранит его в 'csrftoken')
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const csrftoken = getCookie("csrftoken");

  // Добавляем заголовок только для методов, изменяющих данные
  if (
    csrftoken &&
    ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())
  ) {
    config.headers["X-CSRFToken"] = csrftoken;
  }

  return config;
});

// Интерцептор ответа (ваш существующий)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    // Можно добавить редирект на логин при 401
    if (error.response && error.response.status === 401) {
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
