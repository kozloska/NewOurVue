<template>
  <div class="upload-schedule">
    <h2>Загрузка расписания защит</h2>

    <div
      class="upload-container"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop="onDrop"
    >
      <input
        type="file"
        ref="fileInput"
        accept=".xlsx, .xls"
        @change="handleFileSelect"
        hidden
      />

      <div
        class="drop-zone"
        :class="{ 'drag-over': dragOver }"
        @click="$refs.fileInput.click()"
      >
        <div v-if="!selectedFile" class="upload-prompt">
          <span class="icon">📅</span>
          <p class="formats">
            Перетащите Excel-файл с расписанием сюда или кликните для выбора
          </p>
          <p class="formats">Поддерживаемые форматы: .xlsx, .xls</p>
        </div>

        <div v-else class="file-info">
          <p>Выбран файл: {{ selectedFile.name }}</p>
          <div class="file-actions">
            <button
              @click.stop="uploadFile"
              :disabled="uploading"
              class="upload-btn"
            >
              {{ uploading ? "Загрузка..." : "Начать загрузку" }}
            </button>
            <button
              @click.stop="clearFile"
              :disabled="uploading"
              class="clear-btn"
            >
              Очистить
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="uploading" class="progress-container">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="progress-text">{{ progress }}%</p>
    </div>

    <div v-if="errorMessage" class="alert error">
      <div class="alert-icon">⚠️</div>
      <div class="alert-content">
        <strong>Ошибка:</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <button @click="clearError" class="alert-close">✕</button>
    </div>

    <div v-if="successMessage" class="alert success">
      <div class="alert-icon">✅</div>
      <div class="alert-content">
        <strong>Успех:</strong>
        <p>{{ successMessage }}</p>
        <div v-if="uploadResults" class="upload-results">
          <ul>
            <li v-if="uploadResults.defenses_added">
              Слотов защиты создано: {{ uploadResults.defenses_added }}
            </li>
            <li v-if="uploadResults.protocols_linked">
              Протоколов привязано: {{ uploadResults.protocols_linked }}
            </li>
          </ul>
        </div>
      </div>
      <button @click="clearSuccess" class="alert-close">✕</button>
    </div>

    <div class="instructions">
      <h3>Инструкции по загрузке расписания:</h3>
      <ol>
        <li>Подготовьте Excel-файл с расписанием защит</li>
        <li>Файл должен содержать листы с названиями направлений подготовки</li>
        <li>
          Каждый лист должен содержать:
          <ul>
            <li><strong>Первая строка</strong> - название специальности</li>
            <li><strong>Даты</strong> - в формате "ДД.ММ.ГГГГ - описание"</li>
            <li><strong>Время</strong> - в формате "ЧЧ:ММ-ЧЧ:ММ"</li>
            <li>
              <strong>Таблицу</strong> с колонками: время, Аудитория, группа,
              тема проекта
            </li>
          </ul>
        </li>
        <li>Загрузите файл и дождитесь завершения обработки</li>
      </ol>

      <div class="warning-note">
        <div class="warning-icon">⚠️</div>
        <div>
          <strong>Внимание:</strong> Загрузка расписания обновит существующие
          протоколы студентов, привязав их к новым слотам защиты. Убедитесь, что
          данные в файле корректны.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UploadSchedule",
  data() {
    return {
      dragOver: false,
      selectedFile: null,
      uploading: false,
      progress: 0,
      errorMessage: "",
      successMessage: "",
      uploadResults: null,
    };
  },
  methods: {
    handleFileSelect(e) {
      const files = e.target.files || e.dataTransfer.files;
      if (files.length) {
        this.validateFile(files[0]);
      }
    },

    onDrop(e) {
      e.preventDefault();
      this.dragOver = false;
      this.handleFileSelect(e);
    },

    validateFile(file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validTypes.includes(file.type)) {
        this.errorMessage =
          "Неверный формат файла! Поддерживаются только .xlsx и .xls файлы.";
        this.selectedFile = null;
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        this.errorMessage = "Файл слишком большой! Максимальный размер 15MB";
        this.selectedFile = null;
        return;
      }

      this.clearMessages();
      this.selectedFile = file;
    },

    async uploadFile() {
      if (!this.selectedFile) {
        this.errorMessage = "Выберите файл для загрузки";
        return;
      }

      const formData = new FormData();
      formData.append("file", this.selectedFile);

      try {
        this.uploading = true;
        this.progress = 0;
        this.clearMessages();

        const response = await axios.post(
          "http://localhost:8000/api/upload-defense-schedule/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              this.progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
            },
          }
        );

        if (response.data.status === "success") {
          this.successMessage =
            "Расписание защит успешно загружено и обработано!";
          this.uploadResults = response.data;
          this.selectedFile = null;
          if (this.$refs.fileInput) {
            this.$refs.fileInput.value = "";
          }
        } else {
          this.errorMessage =
            response.data.message || "Ошибка при обработке файла расписания";
        }
      } catch (error) {
        console.error("Upload error:", error);
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          this.errorMessage = error.response.data.error;
        } else if (error.response?.status === 400) {
          this.errorMessage =
            "Ошибка в формате файла или данных. Проверьте структуру Excel-файла.";
        } else if (error.response?.status === 500) {
          this.errorMessage =
            "Внутренняя ошибка сервера. Попробуйте позже или обратитесь к администратору.";
        } else {
          this.errorMessage = "Ошибка загрузки: " + error.message;
        }
      } finally {
        this.uploading = false;
        this.progress = 0;
      }
    },

    clearFile() {
      this.selectedFile = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },

    clearMessages() {
      this.errorMessage = "";
      this.successMessage = "";
      this.uploadResults = null;
    },

    clearError() {
      this.errorMessage = "";
    },

    clearSuccess() {
      this.successMessage = "";
      this.uploadResults = null;
    },
  },
};
</script>

<style scoped>
.upload-schedule {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h2 {
  color: #1e293b;
  text-align: center;
  margin-bottom: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.upload-container {
  margin: 20px 0;
}

.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8fafc;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.drag-over {
  border-color: #10b981 !important;
  background-color: rgba(16, 185, 129, 0.1) !important;
  transform: scale(1.02);
}

.upload-prompt .icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.upload-prompt p {
  margin: 8px 0;
  color: #64748b;
}

.formats {
  font-size: 0.9em;
  color: #94a3b8;
}

.file-info {
  color: #1e293b;
}

.file-info p {
  margin-bottom: 16px;
  font-weight: 500;
}

.file-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-btn,
.clear-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.upload-btn {
  background: #10b981;
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background: #059669;
}

.upload-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.clear-btn {
  background: #64748b;
  color: white;
}

.clear-btn:hover:not(:disabled) {
  background: #475569;
}

.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  position: relative;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

.alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  margin-bottom: 4px;
}

.alert-content p {
  margin: 0;
}

.upload-results {
  margin-top: 8px;
}

.upload-results ul {
  margin: 0;
  padding-left: 20px;
}

.upload-results li {
  margin: 4px 0;
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-close:hover {
  opacity: 1;
}

.instructions {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.instructions h3 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 1.1rem;
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  margin: 8px 0;
  color: #475569;
}

.instructions ul {
  margin: 8px 0;
  padding-left: 20px;
}

.instructions ul li {
  margin: 4px 0;
}

.warning-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  color: #92400e;
}

.warning-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .upload-schedule {
    padding: 16px;
  }

  .drop-zone {
    padding: 30px 16px;
  }

  .file-actions {
    flex-direction: column;
  }

  .upload-btn,
  .clear-btn {
    width: 100%;
  }

  .alert {
    flex-direction: column;
    gap: 8px;
  }

  .alert-close {
    align-self: flex-end;
  }

  .warning-note {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
