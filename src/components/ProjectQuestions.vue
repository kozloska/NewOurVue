<template>
  <div class="project-questions">
    <h2>Вопросы по проекту</h2>
    <div class="coming-soon">
      <div class="icon">❓</div>
      <p>Функция в разработке</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProjectQuestions",
  props: {
    projectId: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.project-questions {
  padding: 2rem;
  text-align: center;
}

.coming-soon {
  margin-top: 4rem;
}

.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h2 {
  color: #1e293b;
  margin-bottom: 2rem;
}
</style>
