// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import authService from "@/services/auth";

const routes = [
  {
    path: "/",
    name: "Login",
    component: LoginView,
  },
  {
    path: "/homepage",
    name: "HomePage",
    component: () => import("../components/HomePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/uploadlist",
    name: "UploadList",
    component: () => import("../components/UploadList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/formcommission",
    name: "FormCommission",
    component: () => import("../components/FormCommission.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/uploadschedule",
    name: "UploadSchedule",
    component: () => import("../components/UploadSchedule.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/archiveprotocols",
    name: "ArchiveProtocols",
    component: () => import("../components/ArchiveProtocols.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/projectdefense",
    name: "ProjectDefense",
    component: () => import("../components/ProjectDefense.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/projectschedule",
    name: "ProjectSchedule",
    component: () => import("../components/ProjectSchedule.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/protocollist",
    name: "ProtocolList",
    component: () => import("../components/ProtocolList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/generateprotocols",
    name: "GenerateProtocols",
    component: () => import("../components/GenerateProtocols.vue"),
    meta: { requiresAuth: true }, // добавил защиту
  },
  {
    path: "/management",
    name: "ManagementPanel",
    component: () => import("../components/ManagementPanel.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("../views/ProfileView.vue"),
    meta: { requiresAuth: true },
  },

  // Catch-all — редирект на логин
  { path: "/:catchAll(.*)", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Глобальная защита маршрутов
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;

  // Если маршрут требует авторизации
  if (requiresAuth) {
    if (!authService.isAuthenticated()) {
      console.log("Доступ запрещён: не авторизован → редирект на /");
      next("/");
      return;
    }

    // Проверяем, жива ли сессия на сервере
    try {
      await authService.getCurrentUser();
      next(); // Всё хорошо — пропускаем
    } catch (error) {
      console.log("Сессия истекла или недействительна → редирект на /");
      next("/");
    }
  }
  // Если идём на страницу логина, но уже авторизованы
  else if (to.path === "/" && authService.isAuthenticated()) {
    console.log("Уже авторизован → редирект на homepage");
    next("/homepage");
  } else {
    next();
  }
});

export default router;
