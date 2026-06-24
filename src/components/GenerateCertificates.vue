<template>
  <div class="certificates-page">
    <h2>Генерация удостоверений</h2>

    <!-- Секция: Выбор файлов (ДВЕ ЗОНЫ В ОДНУ СТРОКУ) -->
    <div class="upload-container">
      <div class="files-row">
        <!-- Excel Файл -->
        <div
          class="drop-zone"
          :class="{ 'drag-over': dragOverExcel }"
          @dragover.prevent="
            dragOverExcel = true;
            dragOverWord = false;
          "
          @dragleave="dragOverExcel = false"
          @drop="onDropExcel"
          @click="$refs.excelInput.click()"
        >
          <input
            type="file"
            ref="excelInput"
            accept=".xlsx, .xls"
            @change="handleFileSelect('excel', $event)"
            hidden
          />

          <div v-if="!files.excel" class="upload-prompt">
            <span class="icon">📊</span>
            <p class="formats">
              Перетащите Excel-файл сюда или кликните для выбора
            </p>
            <p class="formats">Поддерживаемые форматы: .xlsx, .xls</p>
          </div>

          <div v-else class="file-info">
            <p>Выбран файл: {{ files.excel.name }}</p>
            <div class="file-actions">
              <button @click.stop="clearFile('excel')" class="clear-btn">
                Очистить
              </button>
            </div>
          </div>
        </div>

        <!-- Шаблон Word -->
        <div
          class="drop-zone"
          :class="{ 'drag-over': dragOverWord }"
          @dragover.prevent="
            dragOverWord = true;
            dragOverExcel = false;
          "
          @dragleave="dragOverWord = false"
          @drop="onDropWord"
          @click="$refs.wordInput.click()"
        >
          <input
            type="file"
            ref="wordInput"
            accept=".docx"
            @change="handleFileSelect('word', $event)"
            hidden
          />

          <div v-if="!files.template" class="upload-prompt">
            <span class="icon">📝</span>
            <p class="formats">
              Перетащите шаблон Word сюда или кликните для выбора
            </p>
            <p class="formats">Поддерживаемый формат: .docx</p>
          </div>

          <div v-else class="file-info">
            <p>Выбран файл: {{ files.template.name }}</p>
            <div class="file-actions">
              <button @click.stop="clearFile('template')" class="clear-btn">
                Очистить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопка действия -->
    <div class="action-area">
      <button
        @click="generateCertificates"
        :disabled="!canGenerate || generating"
        class="generate-btn"
      >
        <span v-if="generating" class="spinner"></span>
        {{ generating ? "Генерация..." : "Сгенерировать и скачать ZIP" }}
      </button>
    </div>

    <!-- Прогресс бар -->
    <div v-if="generating" class="progress-container">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="progress-text">{{ progress }}%</p>
    </div>

    <!-- Сообщения -->
    <div v-if="errorMessage" class="alert error">
      <div class="alert-icon">⚠️</div>
      <div class="alert-content">
        <strong>Ошибка:</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <button @click="errorMessage = ''" class="alert-close">✕</button>
    </div>

    <div v-if="successMessage" class="alert success">
      <div class="alert-icon">✅</div>
      <div class="alert-content">
        <strong>Успешно:</strong>
        <p>{{ successMessage }}</p>
      </div>
      <button @click="successMessage = ''" class="alert-close">✕</button>
    </div>

    <!-- Инструкция -->
    <div class="instructions">
      <h3>Инструкции по генерации:</h3>
      <ol>
        <li>
          Подготовьте Excel-файл со следующими колонками:
          <ul>
            <li>
              <strong>Столбец A (0):</strong> Регистрационный номер
              удостоверения
            </li>
            <li><strong>Столбец B (1):</strong> ФИО слушателя полностью</li>
          </ul>
        </li>
        <li>
          В шаблоне Word используйте плейсхолдеры:
          <ul>
            <li><code>number</code> — заменится на номер</li>
            <li><code>fio</code> — заменится на ФИО</li>
          </ul>
        </li>
        <li>
          <strong>Важно:</strong> данные в Excel должны находиться на листе с
          именем <code>Лист1</code>, первая строка — заголовки
        </li>
        <li>
          Загрузите оба файла, перетащив их в области выше или выбрав через
          кнопку
        </li>
        <li>Нажмите «Сгенерировать и скачать ZIP» для обработки</li>
      </ol>
    </div>
  </div>
</template>

<script>
import api from "@/services/api";

export default {
  name: "GenerateCertificates",
  data() {
    return {
      files: {
        excel: null,
        template: null,
      },
      defaults: {
        sheetName: "Лист3",
        startRow: 2,
        numberCol: 0,
        fioCol: 1,
      },
      dragOverExcel: false,
      dragOverWord: false,
      generating: false,
      progress: 0,
      errorMessage: "",
      successMessage: "",
    };
  },
  computed: {
    canGenerate() {
      return this.files.excel && this.files.template;
    },
  },
  methods: {
    handleFileSelect(type, e) {
      const file = e.target.files[0];
      if (file) this.setFile(type, file);
    },

    // --- ИСПРАВЛЕННЫЕ МЕТОДЫ DROP ---
    onDropExcel(e) {
      e.preventDefault(); // Обязательно предотвращаем стандартное поведение
      e.stopPropagation();
      this.dragOverExcel = false;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.setFile("excel", files[0]);
      }
    },

    onDropWord(e) {
      e.preventDefault(); // Обязательно предотвращаем стандартное поведение
      e.stopPropagation();
      this.dragOverWord = false;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.setFile("template", files[0]);
      }
    },
    // -------------------------------

    setFile(type, file) {
      // Валидация типов файлов
      if (type === "excel") {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          this.errorMessage =
            "Для этой зоны нужен файл Excel (.xlsx или .xls)!";
          return;
        }
      } else if (type === "template") {
        if (!file.name.match(/\.docx$/i)) {
          this.errorMessage = "Для этой зоны нужен файл Word (.docx)!";
          return;
        }
      }

      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = "Файл слишком большой! Максимальный размер 10MB";
        return;
      }

      this.files[type] = file;
      this.errorMessage = "";
    },

    clearFile(type) {
      this.files[type] = null;
      if (type === "excel" && this.$refs.excelInput) {
        this.$refs.excelInput.value = "";
      }
      if (type === "template" && this.$refs.wordInput) {
        this.$refs.wordInput.value = "";
      }
    },

    async generateCertificates() {
      if (!this.canGenerate) {
        this.errorMessage = "Выберите оба файла для генерации";
        return;
      }

      this.generating = true;
      this.progress = 0;
      this.errorMessage = "";
      this.successMessage = "";

      const formData = new FormData();
      formData.append("excel_file", this.files.excel);
      formData.append("template_file", this.files.template);
      formData.append("sheet_name", this.defaults.sheetName);
      formData.append("start_row", this.defaults.startRow);
      formData.append("number_col", this.defaults.numberCol);
      formData.append("fio_col", this.defaults.fioCol);

      try {
        const interval = setInterval(() => {
          if (this.progress < 90) this.progress += 5;
        }, 200);

        const response = await api.post(
          "/api/generate-certificates/",
          formData,
          {
            responseType: "blob",
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        clearInterval(interval);
        this.progress = 100;

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `certificates_${new Date().toISOString().slice(0, 10)}.zip`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.successMessage = "Файлы успешно сгенерированы и скачаны!";
        this.clearFile("excel");
        this.clearFile("template");
      } catch (error) {
        console.error("Generation error:", error);
        let msg = "Ошибка при генерации удостоверений.";

        if (error.response?.data) {
          try {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const json = JSON.parse(reader.result);
                msg = json.error || json.message || msg;
              } catch (e) {
                msg = "Сервер вернул ошибку, но не смог распарсить ответ.";
              }
              this.errorMessage = msg;
            };
            reader.readAsText(error.response.data);
          } catch (e) {
            this.errorMessage = msg;
          }
        } else {
          this.errorMessage = msg;
        }
      } finally {
        this.generating = false;
        setTimeout(() => {
          this.progress = 0;
        }, 500);
      }
    },
  },
};
</script>

<style scoped>
/* ... (стили остаются теми же, что были ранее) ... */
.certificates-page {
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

.upload-container {
  margin: 20px 0;
}

.files-row {
  display: flex;
  gap: 20px;
}

.drop-zone {
  flex: 1;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.drop-zone:hover {
  border-color: #4892b4;
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

.clear-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  background: #64748b;
  color: white;
}

.clear-btn:hover:not(:disabled) {
  background: #475569;
}

.clear-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.action-area {
  margin-top: 10px;
}

.generate-btn {
  width: 100%;
  padding: 14px 24px; /* Увеличил padding для кнопки */
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1.1rem; /* Увеличил шрифт кнопки */
  background-color: #4892b4;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.generate-btn:hover:not(:disabled) {
  background-color: #3a7a9a;
}

.generate-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  background-color: #4892b4;
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

.instructions code {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #334155;
}

@media (max-width: 768px) {
  .certificates-page {
    padding: 16px;
  }

  .files-row {
    flex-direction: column;
  }

  .drop-zone {
    padding: 30px 16px;
  }

  .file-actions {
    flex-direction: column;
  }

  .clear-btn,
  .generate-btn {
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
