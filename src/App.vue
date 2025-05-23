<template>
  <div id="app">
    <app-header />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import AppHeader from "./components/AppHeader.vue";

export default {
  components: {
    AppHeader,
  },
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
}

.main-content {
  margin-right: 200px; /* Отступ справа, чтобы контент не перекрывался шапкой */
  padding-top: 60px; /* Отступ сверху для фиксированной шапки */
  min-height: 100vh;
}
</style>
