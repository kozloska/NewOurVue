<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo">🎓</div>
          <h1 class="app-title">Система защиты проектов</h1>
        </div>
      </div>

      <div class="login-content">
        <div v-if="secretary" class="status-container success">
          <div class="status-icon success-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
          </div>
          <h2 class="status-title">Авторизация успешна!</h2>
          <p class="status-message">Перенаправление...</p>
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div v-else-if="errorMessage" class="status-container error">
          <div class="status-icon error-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 class="status-title">Ошибка авторизации</h2>
          <p class="status-message">{{ errorMessage }}</p>
          <button class="retry-button" @click="checkRedirectUrl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Попробовать снова
          </button>
        </div>

        <div v-else class="status-container processing">
          <div class="status-icon processing-icon">
            <div class="spinner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56"></path>
              </svg>
            </div>
          </div>
          <h2 class="status-title">Обрабатываем авторизацию</h2>
          <p class="status-message">Пожалуйста, подождите...</p>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>

      <div class="login-footer">
        <p class="footer-text">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </p>
      </div>
    </div>

    <div class="background-animation">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      secretary: JSON.parse(localStorage.getItem("secretary")) || null,
      fullName: "",
      errorMessage: "",
    };
  },
  methods: {
    log(message, type = "info") {
      console.log(`[${type === "error" ? "Error" : "BitrixAuth"}] ${message}`);
    },
    showStatus(message) {
      console.log(message);
    },
    showError(message) {
      this.errorMessage = message;
      console.log(message);
    },
    async exchangeForToken(authCode) {
      try {
        this.log("Выполняется обмен кода на токен...");
        const response = await fetch(
          "http://localhost:8000/api/accounts/bitrix-auth/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: authCode,
              client_id: process.env.VUE_APP_BITRIX_CLIENT_ID,
              client_secret: process.env.VUE_APP_BITRIX_CLIENT_SECRET,
              redirect_uri: process.env.VUE_APP_BITRIX_REDIRECT_URI,
            }),
          }
        );

        const responseBody = await response.json();
        this.log(`Ответ токена: ${JSON.stringify(responseBody)}`);
        this.log(`Длина responseBody: ${responseBody.length}`);

        if (!response.ok) {
          throw new Error(
            responseBody.error || `Ошибка сервера (код ${response.status})`
          );
        }

        if (responseBody.length > 0) {
          this.secretary = responseBody[0];
          this.fullName = `${this.secretary.Surname} ${this.secretary.Name} ${this.secretary.Patronymic}`;
          localStorage.setItem("secretary", JSON.stringify(this.secretary));
          window.dispatchEvent(new Event("authChanged"));
          this.$router.push("/homepage");
        } else {
          this.secretary = null;
          this.fullName = "";
          this.showError("Секретарь не найден.");
        }

        const url = new URL(window.location);
        url.searchParams.delete("code");
        window.history.replaceState({}, document.title, url);
      } catch (error) {
        this.log(`Детали ошибки: ${error.message}`, "error");
        this.showError(`Ошибка при обмене токена: ${error.message}`);
      }
    },
    checkRedirectUrl() {
      this.log("Проверка URL на наличие кода...");
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get("code");
      this.log(`Найден код: ${authCode}`);
      if (authCode) {
        this.exchangeForToken(authCode);
      } else if (!this.secretary) {
        window.location.href =
          "https://int.istu.edu/oauth/authorize?client_id=local.65581f0597f2b3.73164583&redirect_uri=http://localhost:9000/api/accounts/bitrix-auth/&response_type=code";
      } else {
        this.$router.push("/homepage");
      }
    },
  },
  mounted() {
    this.checkRedirectUrl();
  },
  watch: {
    $route() {
      this.checkRedirectUrl();
    },
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.app-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-content {
  margin-bottom: 30px;
}

.status-container {
  text-align: center;
  padding: 30px 20px;
}

.status-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.success-icon {
  color: #48bb78;
  animation: successPulse 2s ease-in-out infinite;
}

.error-icon {
  color: #f56565;
  animation: errorShake 0.5s ease-in-out;
}

.processing-icon {
  color: #4299e1;
}

.spinner {
  animation: spin 1s linear infinite;
}

.status-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2d3748;
}

.status-message {
  font-size: 1rem;
  color: #718096;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #48bb78;
  animation: loadingDots 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #667eea);
  border-radius: 2px;
  animation: progressFill 2s ease-in-out infinite;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.retry-button:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
}

/* Фоновая анимация */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 10%;
  right: 30%;
  animation-delay: 1s;
}

/* Анимации */
@keyframes successPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes loadingDots {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes progressFill {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .login-container {
    padding: 15px;
  }

  .login-card {
    padding: 30px 25px;
    border-radius: 16px;
  }

  .logo {
    font-size: 3rem;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .status-title {
    font-size: 1.3rem;
  }

  .status-message {
    font-size: 0.95rem;
  }

  .floating-shape {
    opacity: 0.5;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 25px 20px;
  }

  .logo {
    font-size: 2.5rem;
  }

  .app-title {
    font-size: 1.3rem;
  }

  .status-container {
    padding: 20px 10px;
  }
}
</style>
