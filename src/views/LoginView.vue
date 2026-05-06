<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">🎓</div>
        <h1 class="app-title">Вход в систему</h1>
        <p class="app-subtitle">Система защиты проектов ЦК</p>
      </div>

      <div v-if="errorMessage" class="error-message">⚠️ {{ errorMessage }}</div>

      <div class="input-group">
        <label>Логин</label>
        <input
          v-model="form.login"
          type="text"
          @keyup.enter="handleLogin"
          :disabled="isLoading"
        />
      </div>

      <div class="input-group">
        <label>Пароль</label>
        <input
          v-model="form.password"
          type="password"
          @keyup.enter="handleLogin"
          :disabled="isLoading"
        />
      </div>

      <button
        class="login-button"
        @click="handleLogin"
        :disabled="isLoading || !form.login || !form.password"
      >
        {{ isLoading ? "Вход..." : "Войти" }}
      </button>
    </div>
  </div>
</template>

<script>
import authService from "@/services/auth";

export default {
  data() {
    return {
      form: { login: "", password: "" },
      isLoading: false,
      errorMessage: "",
    };
  },

  async created() {
    if (authService.isAuthenticated()) {
      this.$router.push("/homepage");
    }
  },

  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        await authService.login(this.form);
        // Небольшая задержка, чтобы все компоненты успели обновиться
        await new Promise((resolve) => setTimeout(resolve, 80));
        this.$router.push("/homepage");
      } catch (error) {
        this.errorMessage =
          error.response?.data?.error || "Неверный логин или пароль";
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>
<style scoped>
/* --- Основные стили контейнера --- */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  position: relative;
  overflow: hidden;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 10;
  transition: transform 0.3s ease;
}

/* --- Заголовок --- */
.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  font-size: 3rem;
  margin-bottom: 10px;
}

.app-title {
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0;
  font-weight: 700;
}

.app-subtitle {
  font-size: 0.9rem;
  color: #718096;
  margin-top: 5px;
}

/* --- Форма --- */
.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box; /* Важно для padding */
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-group input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

/* --- Кнопка --- */
.login-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* --- Сообщения об ошибках --- */
.error-message {
  background-color: #fff5f5;
  color: #c53030;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  text-align: center;
  border: 1px solid #feb2b2;
}

/* --- Статусы (Загрузка/Успех) --- */
.status-container {
  text-align: center;
  padding: 20px 0;
}

.status-title {
  font-size: 1.2rem;
  color: #2d3748;
  margin: 15px 0 5px;
}

.status-message {
  color: #718096;
  font-size: 0.9rem;
}

.success-icon {
  color: #48bb78;
  width: 60px;
  height: 60px;
  margin: 0 auto;
  animation: scaleIn 0.5s ease-out;
}

.spinner-large svg {
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  color: #667eea;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-dasharray: 60;
  stroke-dashoffset: 20;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

/* --- Анимации фона --- */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  animation: float 10s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -50px;
  left: -100px;
  animation-delay: 0s;
}
.shape-2 {
  width: 200px;
  height: 200px;
  bottom: 50px;
  right: -50px;
  animation-delay: 2s;
}
.shape-3 {
  width: 150px;
  height: 150px;
  top: 40%;
  left: 60%;
  animation-delay: 4s;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, 40px);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Адаптивность */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    margin: 20px;
  }
}
</style>
