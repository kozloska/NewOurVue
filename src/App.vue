<template>
  <div class="app-container">
    <aside v-if="isAuthenticated" class="sidebar">
      <div class="sidebar-header">
        <div class="user-info">{{ userFullName }}</div>
      </div>
      <nav class="menu">
        <router-link to="/homepage" class="menu-item" active-class="active">
          <span class="menu-icon">🏠</span>
          <span class="menu-text">Главная</span>
        </router-link>

        <router-link to="/uploadlist" class="menu-item" active-class="active">
          <span class="menu-icon">📤</span>
          <span class="menu-text">Загрузка списка тем</span>
        </router-link>

        <router-link
          to="/uploadschedule"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">🔄</span>
          <span class="menu-text">Загрузка расписания</span>
        </router-link>

        <router-link
          to="/formcommission"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">👥</span>
          <span class="menu-text">Сформировать комиссию</span>
        </router-link>

        <router-link
          to="/generateprotocols"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">📝</span>
          <span class="menu-text">Сформировать протоколы</span>
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
          to="/projectschedule"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">📅</span>
          <span class="menu-text">Расписание проектов</span>
        </router-link>

        <router-link to="/protocollist" class="menu-item" active-class="active">
          <span class="menu-icon">📋</span>
          <span class="menu-text">Список протоколов</span>
        </router-link>

        <router-link to="/archive" class="menu-item" active-class="active">
          <span class="menu-icon">🗄️</span>
          <span class="menu-text">Архив протоколов</span>
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
  </div>
</template>

<script>
export default {
  computed: {
    isAuthenticated() {
      const secretary = JSON.parse(localStorage.getItem("secretary"));
      return !!secretary;
    },
    userFullName() {
      const secretary = JSON.parse(localStorage.getItem("secretary"));
      if (!secretary) return "";
      return `${secretary.Surname} ${secretary.Name} ${secretary.Patronymic}`;
    },
  },
  methods: {
    logout() {
      if (confirm("Вы уверены, что хотите выйти?")) {
        localStorage.removeItem("secretary");
        this.$router.push("/login");
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
