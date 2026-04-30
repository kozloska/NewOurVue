<template>
  <div class="app-container">
    <aside v-if="isAuthenticated" class="sidebar">
      <div class="sidebar-header">
        <div class="user-info">{{ userFullName }}</div>
      </div>
      <nav class="menu">
        <!-- Всегда видно всем авторизованным -->
        <router-link to="/homepage" class="menu-item" active-class="active">
          <span class="menu-icon">🏠</span>
          <span class="menu-text">Главная</span>
        </router-link>

        <router-link
          to="/projectdefense"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">🎓</span>
          <span class="menu-text">Защита проектов</span>
        </router-link>

        <router-link
          to="/generateprotocols"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">📝</span>
          <span class="menu-text">Сформировать протоколы</span>
        </router-link>

        <!-- Видно только админу -->
        <router-link
          v-if="isAdmin"
          to="/uploadlist"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">📤</span>
          <span class="menu-text">Загрузка списка тем</span>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/uploadschedule"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">🔄</span>
          <span class="menu-text">Загрузка расписания</span>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/formcommission"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">👥</span>
          <span class="menu-text">Сформировать комиссию</span>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/projectschedule"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">📅</span>
          <span class="menu-text">Расписание проектов</span>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/archiveprotocols"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">🗄️</span>
          <span class="menu-text">Архив протоколов</span>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/management"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">⚙️</span>
          <span class="menu-text">Управление</span>
        </router-link>
      </nav>
      <button @click="logout" class="logout-btn">
        <span class="logout-icon">🚪</span>
        <span class="logout-text">Выйти</span>
      </button>
    </aside>

    <main :class="['content', { 'full-width': !isAuthenticated }]">
      <router-view></router-view>
    </main>
    <NotificationSystem />
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script>
import authService from "@/services/auth";

export default {
  data() {
    return {
      secretary: null,
    };
  },

  computed: {
    isAuthenticated() {
      return !!this.secretary;
    },
    userFullName() {
      if (!this.secretary) return "";
      return `${this.secretary.Surname || ""} ${this.secretary.Name || ""} ${
        this.secretary.Patronymic || ""
      }`.trim();
    },
    isAdmin() {
      // Проверка по логину (убедитесь, что поле называется именно Login)
      return this.secretary && this.secretary.login === "admin";
    },
  },

  created() {
    this.loadUser();
    window.addEventListener("authChanged", this.loadUser);
  },

  beforeUnmount() {
    window.removeEventListener("authChanged", this.loadUser);
  },

  methods: {
    loadUser() {
      this.secretary = authService.getUser();
    },

    async logout() {
      if (confirm("Вы уверены, что хотите выйти?")) {
        await authService.logout();
        this.$router.push("/"); // или "/login"
      }
    },
  },
};
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    Helvetica, Arial, sans-serif;
}

.sidebar {
  width: 280px;
  background-color: #4892b4;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 10;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.user-info {
  font-size: 1rem;
  opacity: 0.8;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin: 0.25rem 0;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: translateX(5px);
}

.menu-item.active {
  background-color: #42b983;
  color: #fff;
  border-left-color: #fff;
  font-weight: 500;
}

.menu-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
}

.content {
  flex: 1;
  margin-left: 280px;
  padding: 1.5rem;
  width: calc(100% - 280px);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.content.full-width {
  margin-left: 0;
  width: 100%;
  padding: 0;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 1rem;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.logout-icon {
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .menu-text,
  .logout-text,
  .user-info {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: 1rem;
  }

  .menu-icon {
    margin-right: 0;
    font-size: 1.5rem;
  }

  .content {
    margin-left: 70px;
    width: calc(100% - 70px);
  }

  .logo {
    font-size: 1.2rem;
  }

  .sidebar-header {
    padding: 1rem;
  }
}
</style>
