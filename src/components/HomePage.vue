<template>
  <div class="homepage">
    <div class="welcome-section">
      <h1>Добро пожаловать в систему защиты проектов</h1>
      <p class="welcome-subtitle">
        Здравствуйте, <strong>{{ userFullName }}</strong
        >! Вы успешно авторизованы в системе.
      </p>
    </div>

    <div class="quick-actions">
      <h2>Быстрые действия</h2>
      <div class="actions-grid">
        <router-link to="/generateprotocols" class="action-card">
          <div class="action-icon">📝</div>
          <h3>Протоколы</h3>
          <p>Список неподтвержденных протоколов</p>
        </router-link>
        <router-link to="/projectdefense" class="action-card">
          <div class="action-icon">🎓</div>
          <h3>Защита проектов</h3>
          <p>Проведение защиты выпускных работ</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      stats: {
        commissions: 3,
        protocols: 12,
        students: 45,
        defenses: 8,
      },
    };
  },
  computed: {
    userFullName() {
      const secretary = JSON.parse(localStorage.getItem("secretary"));
      if (!secretary) return "";
      return `${secretary.Surname} ${secretary.Name} ${secretary.Patronymic}`;
    },
  },
};
</script>

<style scoped>
.homepage {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    Helvetica, Arial, sans-serif;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: #64748b;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #4892b4 0%, #3a7a9a 100%);
  border-radius: 1rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #4892b4;
  margin: 0;
}

.stat-description {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.quick-actions,
.recent-activity {
  margin-bottom: 3rem;
}

.quick-actions h2,
.recent-activity h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  display: block;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.action-card p {
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.activity-list {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-text {
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.activity-time {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

@media (max-width: 768px) {
  .homepage {
    padding: 1rem;
  }

  .welcome-section h1 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
