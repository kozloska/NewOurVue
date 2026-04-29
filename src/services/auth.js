// src/services/auth.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

// Настройка CSRF для Django
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if ([401, 403].includes(error.response?.status)) {
      localStorage.removeItem("secretary");
      window.dispatchEvent(new Event("authChanged"));
    }
    return Promise.reject(error);
  }
);

const authService = {
  async login(credentials) {
    const { data } = await api.post("/api/auth/login/", credentials);

    if (data.user) {
      localStorage.setItem("secretary", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChanged"));
    }
    return data;
  },

  async logout() {
    try {
      await api.post("/api/auth/logout/");
    } catch (err) {
      console.warn("Server logout failed");
    } finally {
      localStorage.removeItem("secretary");
      window.dispatchEvent(new Event("authChanged"));
    }
  },

  async getCurrentUser() {
    const { data } = await api.get("/api/auth/me/");
    localStorage.setItem("secretary", JSON.stringify(data));
    window.dispatchEvent(new Event("authChanged"));
    return data;
  },

  getUser() {
    const str = localStorage.getItem("secretary");
    return str ? JSON.parse(str) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("secretary");
  },
};

// Экспорт по умолчанию — чтобы import authService from '@/services/auth' работал
export default authService;
