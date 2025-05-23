<template>
  <div v-if="secretary" class="header">
    <span class="user-info">
      <div class="user-icon" @click="showLogoutConfirm">👤</div>
      <span class="user-name">{{ fullName }}</span>
    </span>
    <div v-if="showConfirm" class="modal">
      <div class="modal-content">
        <p>Вы уверены, что хотите выйти?</p>
        <button @click="logout">Да</button>
        <button @click="cancelLogout">Нет</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      secretary: JSON.parse(localStorage.getItem("secretary")) || null,
      fullName: "",
      showConfirm: false,
    };
  },
  created() {
    if (this.secretary) {
      this.fullName = `${this.secretary.Surname} ${this.secretary.Name} ${this.secretary.Patronymic}`;
    }
  },
  methods: {
    showLogoutConfirm() {
      this.showConfirm = true;
    },
    logout() {
      localStorage.removeItem("secretary");
      this.secretary = null;
      this.fullName = "";
      this.showConfirm = false;
      this.$router.push("/");
    },
    cancelLogout() {
      this.showConfirm = false;
    },
  },
};
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  right: 0;
  background: #f8f9fa;
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-icon {
  font-size: 24px;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e0e0e0;
  margin-right: 10px;
  transition: background 0.3s;
}

.user-icon:hover {
  background: #d0d0d0;
}

.user-name {
  font-size: 16px;
  color: #333;
  white-space: nowrap;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
}

button {
  margin: 0 10px;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
