<template>
  <div class="archive-container">
    <h2 class="page-title">Архив протоколов</h2>

    <div class="search-container">
      <div class="search-form">
        <div class="year-selector">
          <label for="year-select" class="year-label">Выберите год:</label>
          <select
            id="year-select"
            v-model="selectedYear"
            @change="loadProtocolsByYear"
            class="year-select"
            :disabled="loadingYears"
          >
            <option value="" disabled>
              {{ loadingYears ? "Загрузка..." : "Выберите год" }}
            </option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div v-if="selectedYear" class="search-section">
          <div class="search-input-container">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="Поиск по ФИО студента..."
              class="search-input"
            />
            <button
              @click="clearSearch"
              class="clear-button"
              v-if="searchQuery"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Загрузка протоколов...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="retryLoad" class="retry-button">Повторить</button>
    </div>

    <div v-else-if="protocols.length > 0" class="protocols-container">
      <div class="protocols-header">
        <h3>Протоколы за {{ selectedYear }} год</h3>
        <div class="protocols-count">
          Найдено протоколов: {{ filteredProtocols.length }}
        </div>
      </div>

      <table class="protocols-table">
        <thead>
          <tr>
            <th>№ протокола</th>
            <th>Студент</th>
            <th>Группа</th>
            <th>Проект</th>
            <th>Оценка</th>
            <th>Дата защиты</th>
            <th>Комиссия</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="protocol in paginatedProtocols"
            :key="protocol.ID"
            class="protocol-row"
          >
            <td>{{ protocol.Number || protocol.ID }}</td>
            <td>{{ getStudentFullName(protocol) }}</td>
            <td>{{ protocol.ID_Student?.ID_Group?.Name || "Не указана" }}</td>
            <td>{{ protocol.ID_Student?.ID_Project?.Title || "Не указан" }}</td>
            <td>
              <span :class="['grade-badge', getGradeClass(protocol.Grade)]">
                {{ protocol.Grade || "Не оценено" }}
              </span>
            </td>
            <td>
              {{ formatDefenseDate(protocol.ID_DefenseSchedule?.DateTime) }}
            </td>
            <td>
              {{
                protocol.ID_DefenseSchedule?.ID_Commission?.Name || "Не указана"
              }}
            </td>
            <td>
              <button
                @click="generateDocx(protocol)"
                class="action-button download-button"
                :disabled="generatingDocx[protocol.ID]"
              >
                <span class="button-icon">{{
                  generatingDocx[protocol.ID] ? "⏳" : "📄"
                }}</span>
                {{ generatingDocx[protocol.ID] ? "Генерируем..." : "Скачать" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="totalPages > 1">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="pagination-button"
        >
          ← Назад
        </button>
        <span class="page-info">
          Страница {{ currentPage }} из {{ totalPages }}
        </span>
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="pagination-button"
        >
          Вперед →
        </button>
      </div>
    </div>

    <div v-else-if="selectedYear" class="no-data-container">
      <div class="no-data-icon">📋</div>
      <p>Протоколы не найдены</p>
      <p class="no-data-hint">
        {{
          searchQuery
            ? "Попробуйте изменить поисковый запрос"
            : "За выбранный год нет утвержденных протоколов"
        }}
      </p>
    </div>

    <div v-else class="select-year-container">
      <div class="select-year-icon">📅</div>
      <p>Выберите год для просмотра архива протоколов</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export default {
  name: "ArchiveView",
  data() {
    return {
      selectedYear: "",
      availableYears: [],
      loadingYears: false,
      protocols: [],
      loading: false,
      error: null,
      searchQuery: "",
      searchTimeout: null,
      currentPage: 1,
      itemsPerPage: 20,
      generatingDocx: {},
      templateBuffer: null,
    };
  },
  computed: {
    filteredProtocols() {
      if (!this.searchQuery.trim()) {
        return this.protocols;
      }

      const query = this.searchQuery.toLowerCase().trim();
      return this.protocols.filter((protocol) => {
        const student = protocol.ID_Student;
        if (!student) return false;

        const fullName = `${student.Surname || ""} ${student.Name || ""} ${
          student.Patronymic || ""
        }`.toLowerCase();
        return fullName.includes(query);
      });
    },
    paginatedProtocols() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredProtocols.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredProtocols.length / this.itemsPerPage);
    },
  },
  mounted() {
    this.loadAvailableYears();
    this.loadTemplate();
  },
  methods: {
    async loadTemplate() {
      try {
        const response = await fetch("/templates/test.docx");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.templateBuffer = await response.arrayBuffer();
        console.log("Шаблон успешно загружен");
      } catch (error) {
        console.error("Ошибка загрузки шаблона:", error);
      }
    },

    async loadAvailableYears() {
      this.loadingYears = true;
      try {
        const response = await axios.get(
          "http://localhost:8000/api/protocols/",
          {
            params: {
              Status: true,
              page_size: 1000,
            },
          }
        );

        const protocols = response.data.results || response.data;
        const years = [...new Set(protocols.map((p) => p.Year))].sort(
          (a, b) => b - a
        );
        this.availableYears = years;
      } catch (error) {
        console.error("Ошибка загрузки доступных годов:", error);
        this.error = "Ошибка загрузки доступных годов";
      } finally {
        this.loadingYears = false;
      }
    },

    async loadProtocolsByYear() {
      if (!this.selectedYear) return;

      this.loading = true;
      this.error = null;
      this.protocols = [];
      this.currentPage = 1;
      this.searchQuery = "";

      try {
        const response = await axios.get(
          "http://localhost:8000/api/protocols/",
          {
            params: {
              Status: true,
              Year: this.selectedYear,
              page_size: 1000,
            },
          }
        );

        this.protocols = response.data.results || response.data;
        console.log(
          `Загружено ${this.protocols.length} протоколов за ${this.selectedYear} год`
        );
      } catch (error) {
        console.error("Ошибка загрузки протоколов:", error);
        this.error = `Ошибка загрузки протоколов: ${
          error.response?.data?.message || error.message
        }`;
      } finally {
        this.loading = false;
      }
    },

    handleSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1;
      }, 300);
    },

    clearSearch() {
      this.searchQuery = "";
      this.currentPage = 1;
    },

    async generateDocx(protocol) {
      if (this.generatingDocx[protocol.ID]) return;

      if (!this.templateBuffer) {
        alert(
          "Шаблон документа не загружен. Попробуйте перезагрузить страницу."
        );
        return;
      }

      this.generatingDocx[protocol.ID] = true;

      try {
        const templateData = await this.prepareTemplateData(protocol);
        const zip = new PizZip(this.templateBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(templateData);

        const buf = doc.getZip().generate({
          type: "arraybuffer",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const blob = new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Протокол_${
            protocol.Number || protocol.ID
          }_${templateData.student.replace(/\s+/g, "_")}.docx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        alert("Протокол успешно сгенерирован!");
      } catch (error) {
        console.error("Ошибка генерации протокола:", error);
        alert("Ошибка при генерации протокола: " + error.message);
      } finally {
        this.generatingDocx[protocol.ID] = false;
      }
    },

    async prepareTemplateData(protocol) {
      const student = protocol.ID_Student;
      const project = student?.ID_Project;
      const specialization = student?.ID_Specialization;
      const commission = protocol.ID_DefenseSchedule?.ID_Commission;
      const defenseSchedule = protocol.ID_DefenseSchedule;

      const startTime = this.parseTime(protocol.DefenseStartTime);
      const endTime = this.parseTime(protocol.DefenseEndTime);

      const dateTime = this.formatDateTime(defenseSchedule?.DateTime);

      console.log("Полная структура комиссии:", commission);
      console.log("ID комиссии:", commission?.ID);

      let commissionMembers = [];
      let chairman = null;
      let secretary = null;
      let members = [];

      if (commission?.members && commission.members.length > 0) {
        commissionMembers = commission.members;
        console.log("Используем данные из протокола:", commissionMembers);
      } else if (commission?.ID) {
        try {
          const formData = new FormData();
          formData.append("id_commission", commission.ID);

          const commissionResponse = await axios.post(
            "http://localhost:8000/api/commission_composition/",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          commissionMembers = commissionResponse.data;
          console.log(
            "Загруженные члены комиссии через API:",
            commissionMembers
          );
        } catch (error) {
          console.error("Ошибка загрузки состава комиссии:", error);
        }
      }

      if (commissionMembers.length > 0) {
        chairman = commissionMembers.find((m) => m.Role === "Председатель");
        secretary = commissionMembers.find((m) => m.Role === "Секретарь");

        members = commissionMembers.filter(
          (m) => m.Role === "Член аттестационной комиссии"
        );

        console.log("Найдено членов аттестационной комиссии:", members.length);
        console.log("Члены комиссии:", members);
      }

      let question1 = "Вопрос не назначен";
      let question2 = "Вопрос не назначен";

      if (protocol.ID_Question) {
        try {
          const q1Response = await axios.get(
            `http://localhost:8000/api/questions/${protocol.ID_Question}/`
          );
          question1 = q1Response.data.Text;
        } catch (error) {
          console.error("Ошибка загрузки первого вопроса:", error);
        }
      }

      if (protocol.ID_Question2) {
        try {
          const q2Response = await axios.get(
            `http://localhost:8000/api/questions/${protocol.ID_Question2}/`
          );
          question2 = q2Response.data.Text;
        } catch (error) {
          console.error("Ошибка загрузки второго вопроса:", error);
        }
      }

      let studentDative = this.getFullName(student);
      try {
        const dativeResponse = await axios.post(
          "http://localhost:8000/api/fio_to_dative/",
          {
            fio: this.getFullName(student),
          }
        );
        studentDative = dativeResponse.data.dative_fio;
      } catch (error) {
        console.error("Ошибка склонения ФИО:", error);
      }

      const membersForSignatures = members.map((member) => ({
        name: this.getInitials(member.ID_Member),
      }));

      const templateData = {
        starthours: startTime.hours,
        startmin: startTime.minutes,
        endhours: endTime.hours,
        endmin: endTime.minutes,
        datetime: dateTime,
        chairman: chairman ? this.getInitials(chairman.ID_Member) : "Не указан",
        student: this.getFullName(student),
        studentdat: this.capitalizeFirstLetter(studentDative),
        direction: specialization?.Name || "Не указано",
        Title: project?.Title || "Не указан",
        supervisor: project?.Supervisor || "Не указан",
        grade: protocol.Grade || "Не указана",
        qualification: specialization?.Qualification || "Не указана",
        secretary: secretary
          ? this.getInitials(secretary.ID_Member)
          : "Не указан",
        question1: question1,
        question2: question2,
        number: protocol.Number || protocol.ID,
        members: membersForSignatures,
      };

      const memberFields = {};
      for (let i = 1; i <= 5; i++) {
        if (members[i - 1]) {
          memberFields[`member${i}`] = this.getInitials(
            members[i - 1].ID_Member
          );
          memberFields[`hasMember${i}`] = true;
        } else {
          memberFields[`member${i}`] = "";
          memberFields[`hasMember${i}`] = false;
        }
      }

      Object.assign(templateData, memberFields);

      console.log("Подготовленные данные для шаблона:", templateData);
      return templateData;
    },

    parseTime(timeStr) {
      if (!timeStr) return { hours: "00", minutes: "00" };

      const parts = timeStr.split(":");
      return {
        hours: parts[0] || "00",
        minutes: parts[1] || "00",
      };
    },

    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return "Не указана";

      const date = new Date(dateTimeStr);
      const months = [
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря",
      ];

      const day = date.getDate();
      const month = months[date.getMonth()];

      return `${day} ${month}`;
    },

    getFullName(person) {
      if (!person) return "Не указан";
      return `${person.Surname || ""} ${person.Name || ""} ${
        person.Patronymic || ""
      }`.trim();
    },

    getStudentFullName(protocol) {
      if (!protocol.ID_Student) return "Неизвестный студент";

      const student = protocol.ID_Student;
      return `${student.Surname || ""} ${student.Name || ""} ${
        student.Patronymic || ""
      }`.trim();
    },

    formatDate(dateTimeStr) {
      if (!dateTimeStr) return "Не указана";

      const date = new Date(dateTimeStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${day}.${month}.${year} ${hours}:${minutes}`;
    },

    formatDefenseDate(dateTimeStr) {
      if (!dateTimeStr) return "Не указана";

      const date = new Date(dateTimeStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}.${month}.${year}`;
    },

    getGradeClass(grade) {
      const gradeMap = {
        5: "grade-excellent",
        Отлично: "grade-excellent",
        4: "grade-good",
        Хорошо: "grade-good",
        3: "grade-satisfactory",
        Удовлетворительно: "grade-satisfactory",
        2: "grade-unsatisfactory",
        Неудовлетворительно: "grade-unsatisfactory",
      };
      return gradeMap[grade] || "grade-unknown";
    },

    getInitials(person) {
      if (!person) return "Не указан";

      const surname = person.Surname || "";
      const name = person.Name || "";
      const patronymic = person.Patronymic || "";

      const nameInitial = name ? name.charAt(0).toUpperCase() + "." : "";
      const patronymicInitial = patronymic
        ? patronymic.charAt(0).toUpperCase() + "."
        : "";

      return `${surname} ${nameInitial}${patronymicInitial}`.trim();
    },

    capitalizeFirstLetter(str) {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    retryLoad() {
      if (this.selectedYear) {
        this.loadProtocolsByYear();
      } else {
        this.loadAvailableYears();
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
  },
};
</script>

<style scoped>
.archive-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-align: center;
}

.search-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.search-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.year-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.year-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.year-select {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: white;
  color: #1e293b;
  transition: border-color 0.2s;
  max-width: 300px;
}

.year-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.year-select:disabled {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.search-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
}

.search-input-container {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #1e293b;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color 0.2s;
}

.clear-button:hover {
  color: #dc2626;
}

.protocols-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.protocols-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.protocols-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.protocols-count {
  color: #64748b;
  font-size: 0.875rem;
}

.protocols-table {
  width: 100%;
  border-collapse: collapse;
}

.protocols-table th,
.protocols-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.protocols-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #1e293b;
  position: sticky;
  top: 0;
  z-index: 1;
}

.protocol-row {
  transition: background-color 0.2s;
}

.protocol-row:hover {
  background-color: #f8fafc;
}

.grade-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.grade-excellent {
  background-color: #dcfce7;
  color: #166534;
}

.grade-good {
  background-color: #dbeafe;
  color: #1e40af;
}

.grade-satisfactory {
  background-color: #fef3c7;
  color: #d97706;
}

.grade-unsatisfactory {
  background-color: #fee2e2;
  color: #dc2626;
}

.grade-unknown {
  background-color: #f1f5f9;
  color: #64748b;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.download-button {
  background-color: #3b82f6;
  color: white;
}

.download-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.download-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.button-icon {
  font-size: 1rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-weight: 500;
}

.loading-container,
.error-container,
.no-data-container,
.select-year-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #64748b;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon,
.no-data-icon,
.select-year-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-icon {
  color: #ef4444;
}

.no-data-icon,
.select-year-icon {
  color: #94a3b8;
}

.no-data-hint {
  margin-top: 0.5rem;
  color: #94a3b8;
  font-size: 0.875rem;
  text-align: center;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.retry-button:hover {
  background-color: #2563eb;
}

@media (max-width: 768px) {
  .archive-container {
    padding: 1rem;
  }

  .protocols-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .protocols-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .search-input-container {
    max-width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
