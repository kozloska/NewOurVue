<template>
  <div>
    <p v-if="secretary">Авторизация успешна! Перенаправление...</p>
    <p v-else-if="errorMessage">{{ errorMessage }}</p>
    <p v-else>Обрабатываем авторизацию...</p>
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
          this.$router.push("/profile");
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
        // Автоматический редирект на авторизацию
        window.location.href =
          "https://int.istu.edu/oauth/authorize?client_id=local.65581f0597f2b3.73164583&redirect_uri=http://localhost:9000/api/accounts/bitrix-auth/&response_type=code";
      } else {
        this.$router.push("/profile");
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
p {
  font-size: 18px;
  color: #333;
}
</style>
