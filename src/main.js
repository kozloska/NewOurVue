// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// 🔹 Делаем router доступным для api-service (для редиректов при 401)
if (typeof window !== "undefined") {
  window.routerInstance = router;
}

// 🔹 Глобальный обработчик события авторизации
window.addEventListener("authChanged", () => {
  // Можно добавить тост-уведомление или логирование
  console.log("🔄 Auth state changed");
});

app.use(router);
app.mount("#app");
