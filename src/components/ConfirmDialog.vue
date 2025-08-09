<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog" @click.stop>
      <div class="dialog__header">
        <div class="dialog__icon">
          <AlertTriangleIcon
            v-if="type === 'warning'"
            class="icon icon--warning"
          />
          <HelpCircleIcon
            v-if="type === 'question'"
            class="icon icon--question"
          />
          <InfoIcon v-if="type === 'info'" class="icon icon--info" />
        </div>
        <h3 class="dialog__title">{{ title }}</h3>
      </div>

      <div class="dialog__content">
        <p class="dialog__message">{{ message }}</p>
      </div>

      <div class="dialog__actions">
        <button
          @click="handleCancel"
          class="btn btn--secondary"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button
          @click="handleConfirm"
          :class="['btn', `btn--${type}`]"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from "vue";
import { AlertTriangleIcon, HelpCircleIcon, InfoIcon } from "lucide-vue-next";

const isVisible = ref(false);
const title = ref("");
const message = ref("");
const type = ref("question");
const confirmText = ref("Да");
const cancelText = ref("Отмена");
const loading = ref(false);
let resolvePromise = null;

const show = (options) => {
  return new Promise((resolve) => {
    title.value = options.title || "Подтверждение";
    message.value = options.message || "Вы уверены?";
    type.value = options.type || "question";
    confirmText.value = options.confirmText || "Да";
    cancelText.value = options.cancelText || "Отмена";
    loading.value = false;
    isVisible.value = true;
    resolvePromise = resolve;
  });
};

const handleConfirm = () => {
  loading.value = true;
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
  setTimeout(() => {
    isVisible.value = false;
    loading.value = false;
  }, 100);
};

const handleCancel = () => {
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
  isVisible.value = false;
};

const handleOverlayClick = () => {
  if (!loading.value) {
    handleCancel();
  }
};

window.showConfirm = show;

defineExpose({ show });
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

.dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.dialog__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
}

.dialog__icon {
  flex-shrink: 0;
}

.icon {
  width: 24px;
  height: 24px;
}

.icon--warning {
  color: #f59e0b;
}

.icon--question {
  color: #3b82f6;
}

.icon--info {
  color: #6b7280;
}

.dialog__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.dialog__content {
  padding: 0 24px 24px;
}

.dialog__message {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.dialog__actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--secondary {
  background: white;
  color: #6b7280;
  border-color: #d1d5db;
}

.btn--secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn--question {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn--question:hover:not(:disabled) {
  background: #2563eb;
}

.btn--warning {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn--warning:hover:not(:disabled) {
  background: #d97706;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
