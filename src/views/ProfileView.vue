<template>
  <div class="content">
    <h1>Добро пожаловать, {{ fullName }}!</h1>
    <p>Это ваша страница профиля. Здесь вы можете управлять своими данными.</p>
    <div class="card">
      <h2>Ваши данные</h2>
      <p>ID: {{ secretary.ID }}</p>
      <p>ФИО: {{ fullName }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      secretary: JSON.parse(localStorage.getItem("secretary")) || null,
      fullName: "",
    };
  },
  created() {
    if (this.secretary) {
      this.fullName = `${this.secretary.Surname} ${this.secretary.Name} ${this.secretary.Patronymic}`;
    } else {
      this.$router.push("/");
    }
  },
};
</script>

<style scoped>
.content {
  margin-top: 60px;
  padding: 20px;
  text-align: center;
}

h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

p {
  font-size: 16px;
  color: #666;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 20px auto;
  max-width: 400px;
  text-align: left;
}

.card h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
}

.card p {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}
</style>
