// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // если нужны куки/авторизация
});

// Можно добавить интерцепторы для токенов, логирования ошибок и т.д.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
