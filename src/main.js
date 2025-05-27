import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";

// Настройка axios
axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.timeout = 10000;

// Добавляем axios в глобальные свойства
const app = createApp(App);

app.config.globalProperties.$http = axios;
app.use(router);
app.mount("#app");

// import { createApp } from "vue";
// import App from "./App.vue";
// import router from "./router";

// const app = createApp(App);
// app.use(router);
// app.mount("#app");
