<template>
  <div class="uploadlist">
    <h2>Загрузка списка студентов</h2>

    <div class="specialization-selector">
      <label for="specialization-select" class="selector-label">
        Выберите направление подготовки:
      </label>
      <select
        id="specialization-select"
        v-model="selectedSpecialization"
        class="specialization-select"
        :disabled="loadingSpecializations"
      >
        <option value="" disabled>
          {{ loadingSpecializations ? "Загрузка..." : "Выберите направление" }}
        </option>
        <option
          v-for="specialization in specializations"
          :key="specialization.ID"
          :value="specialization.ID"
        >
          {{ specialization.Name }}
        </option>
      </select>
    </div>

    <div
      v-if="selectedSpecialization"
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
          <span class="icon">📁</span>
          <p class="formats">
            Перетащите Excel-файл сюда или кликните для выбора
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
        <strong>Успешно:</strong>
        <p>{{ successMessage }}</p>
        <div v-if="uploadResults" class="upload-results">
          <ul>
            <li v-if="uploadResults['Групп добавлено']">
              Групп добавлено: {{ uploadResults["Групп добавлено"] }}
            </li>
            <li v-if="uploadResults['Студентов создано']">
              Студентов создано: {{ uploadResults["Студентов создано"] }}
            </li>
            <li v-if="uploadResults['Проектов добавлено']">
              Проектов добавлено: {{ uploadResults["Проектов добавлено"] }}
            </li>
            <li v-if="uploadResults['Проектов обновлено']">
              Проектов обновлено: {{ uploadResults["Проектов обновлено"] }}
            </li>
            <li v-if="uploadResults['Протоколов добавлено']">
              Протоколов добавлено: {{ uploadResults["Протоколов добавлено"] }}
            </li>
          </ul>
        </div>
      </div>
      <button @click="clearSuccess" class="alert-close">✕</button>
    </div>

    <div class="instructions">
      <h3>Инструкции по загрузке:</h3>
      <ol>
        <li>Выберите направление подготовки из списка</li>
        <li>
          Подготовьте Excel-файл со следующими колонками:
          <ul>
            <li><strong>ФИО</strong> - Фамилия Имя Отчество студента</li>
            <li><strong>Группа</strong> - Название группы</li>
            <li><strong>Тема проекта</strong> - Название проекта</li>
            <li>
              <strong>Преподаватель или Руководитель</strong> - ФИО руководителя
              (допускается любое из двух названий колонки)
            </li>
          </ul>
        </li>
        <li>
          Студенты, у которых в теме проекта содержится слово "Отчислен",
          автоматически пропускаются при загрузке и не добавляются в систему
        </li>
        <li>
          Загрузите файл, перетащив его в область загрузки или выбрав через
          кнопку
        </li>
        <li>Нажмите "Начать загрузку" для обработки файла</li>
      </ol>
    </div>
  </div>
</template>
<script>
// ✅ Импортируем централизованный api-инстанс
import api from "@/services/api";

export default {
  name: "UploadList",
  data() {
    return {
      specializations: [],
      selectedSpecialization: "",
      loadingSpecializations: false,
      dragOver: false,
      selectedFile: null,
      uploading: false,
      progress: 0,
      errorMessage: "",
      successMessage: "",
      uploadResults: null,
    };
  },
  mounted() {
    this.loadSpecializations();
  },
  methods: {
    async loadSpecializations() {
      this.loadingSpecializations = true;
      try {
        // ✅ Заменено: axios + хардкод → api + относительный путь
        const response = await api.get("/api/specializations/", {
          params: {
            Status: true,
          },
        });
        this.specializations = response.data;
      } catch (error) {
        this.errorMessage =
          "Ошибка загрузки направлений: " +
          (error.response?.data?.message || error.message);
      } finally {
        this.loadingSpecializations = false;
      }
    },

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

      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = "Файл слишком большой! Максимальный размер 10MB";
        this.selectedFile = null;
        return;
      }

      this.clearMessages();
      this.selectedFile = file;
    },

    async uploadFile() {
      if (!this.selectedFile || !this.selectedSpecialization) {
        this.errorMessage = "Выберите направление и файл для загрузки";
        return;
      }

      const formData = new FormData();
      formData.append("file", this.selectedFile);
      formData.append("specialization_id", this.selectedSpecialization);

      try {
        this.uploading = true;
        this.progress = 0;
        this.clearMessages();

        // ✅ Заменено: axios.post + хардкод → api.post + относительный путь
        // ✅ Сохранён заголовок multipart/form-data и onUploadProgress
        const response = await api.post("/api/upload-excel/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            this.progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          },
        });

        if (response.data.status === "success") {
          this.successMessage = "Файл успешно загружен и обработан!";
          this.uploadResults = response.data;
          this.selectedFile = null;
          if (this.$refs.fileInput) {
            this.$refs.fileInput.value = "";
          }
        } else {
          this.errorMessage =
            response.data.message || "Ошибка при обработке файла";
        }
      } catch (error) {
        console.error("Upload error:", error);
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          this.errorMessage = error.response.data.error;
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
.uploadlist {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    Helvetica, Arial, sans-serif;
}

h2 {
  color: #1e293b;
  text-align: center;
  margin-bottom: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.specialization-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 20px;
}

.specialization-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1.2rem;
  background-color: white;
  color: #1e293b;
  transition: border-color 0.2s;
}

.specialization-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.specialization-select:disabled {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
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

/* === Кнопка "Начать загрузку" === */
.upload-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s; /* ✅ Упрощён переход */
  font-size: 0.9rem;
  background-color: #4892b4; /* ✅ Было: #10b981 (зелёный) */
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background-color: #3a7a9a; /* ✅ Темнее при наведении */
}

.upload-btn:disabled {
  background-color: #94a3b8;
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
  background-color: #4892b4; /* ✅ Было: linear-gradient(#10b981, #059669) */
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

@media (max-width: 768px) {
  .uploadlist {
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
}
</style>
