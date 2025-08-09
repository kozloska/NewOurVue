<template>
  <div class="notification-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification--${notification.type}`]"
      >
        <div class="notification__icon">
          <CheckCircleIcon
            v-if="notification.type === 'success'"
            class="icon"
          />
          <XCircleIcon v-if="notification.type === 'error'" class="icon" />
          <AlertCircleIcon
            v-if="notification.type === 'warning'"
            class="icon"
          />
          <InfoIcon v-if="notification.type === 'info'" class="icon" />
        </div>
        <div class="notification__content">
          <h4 v-if="notification.title" class="notification__title">
            {{ notification.title }}
          </h4>
          <p class="notification__message">{{ notification.message }}</p>
        </div>
        <button
          @click="removeNotification(notification.id)"
          class="notification__close"
        >
          <XIcon class="icon-small" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  XIcon,
} from "lucide-vue-next";

const notifications = ref([]);

const addNotification = (notification) => {
  const id = Date.now() + Math.random();
  const newNotification = {
    id,
    type: notification.type || "info",
    title: notification.title,
    message: notification.message,
    duration: notification.duration || 5000,
  };

  notifications.value.push(newNotification);

  if (newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

window.showNotification = addNotification;
window.showSuccess = (message, title = "Успешно") =>
  addNotification({ type: "success", title, message });
window.showError = (message, title = "Ошибка") =>
  addNotification({ type: "error", title, message });
window.showWarning = (message, title = "Внимание") =>
  addNotification({ type: "warning", title, message });
window.showInfo = (message, title = "Информация") =>
  addNotification({ type: "info", title, message });

onMounted(() => {
  window.originalAlert = window.alert;
  window.alert = (message) => window.showInfo(message);
});

onUnmounted(() => {
  if (window.originalAlert) {
    window.alert = window.originalAlert;
  }
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  border-left: 4px solid;
  min-width: 320px;
}

.notification--success {
  border-left-color: #10b981;
  background-color: #f0fdf4;
}

.notification--error {
  border-left-color: #ef4444;
  background-color: #fef2f2;
}

.notification--warning {
  border-left-color: #f59e0b;
  background-color: #fffbeb;
}

.notification--info {
  border-left-color: #3b82f6;
  background-color: #eff6ff;
}

.notification__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification--success .icon {
  color: #10b981;
}

.notification--error .icon {
  color: #ef4444;
}

.notification--warning .icon {
  color: #f59e0b;
}

.notification--info .icon {
  color: #3b82f6;
}

.icon {
  width: 20px;
  height: 20px;
}

.icon-small {
  width: 16px;
  height: 16px;
}

.notification__content {
  flex: 1;
}

.notification__title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.notification__message {
  margin: 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.4;
}

.notification__close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s;
}

.notification__close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
