// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import ProfileView from "../views/ProfileView.vue";
import authService from "@/services/auth";

const routes = [
  {
    path: "/",
    name: "Login",
    component: LoginView,
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfileView,
    meta: { requiresAuth: true },
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
  },
  {
    path: "/management",
    name: "ManagementPanel",
    component: () => import("../components/ManagementPanel.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/:catchAll(.*)", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth) {
    if (!authService.isAuthenticated()) {
      next("/");
      return;
    }

    try {
      await authService.getCurrentUser();
      next();
    } catch (error) {
      next("/");
    }
  } else if (to.path === "/" && authService.isAuthenticated()) {
    next("/homepage");
    return;
  } else {
    next();
  }
});

export default router;
