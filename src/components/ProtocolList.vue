<template>
  <div class="protocol-list-container">
    <div class="protocol-list-header">
      <h2>Утверждение протоколов</h2>
      <div class="header-actions">
        <div class="search-container">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Поиск по ФИО студента..."
            class="search-input"
          />
          <button @click="clearSearch" class="clear-button" v-if="searchQuery">
            ✕
          </button>
        </div>

        <div class="bulk-actions" v-if="selectedProtocols.length > 0">
          <span class="selected-count">
            Выбрано: {{ selectedProtocols.length }}
          </span>
          <button
            @click="bulkApprove"
            class="action-button bulk-approve-button"
            :disabled="bulkApproving"
          >
            <span class="button-icon">{{ bulkApproving ? "⏳" : "✅" }}</span>
            {{ bulkApproving ? "Утверждаем..." : "Утвердить выбранные" }}
          </button>
          <button
            @click="clearSelection"
            class="action-button clear-selection-button"
          >
            <span class="button-icon">❌</span>
            Очистить выбор
          </button>
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
      <button @click="loadProtocols" class="retry-button">Повторить</button>
    </div>

    <div v-else-if="protocols.length === 0" class="no-data-container">
      <div class="no-data-icon">📋</div>
      <p>Протоколы не найдены</p>
    </div>

    <div v-else class="protocols-table-container">
      <table class="protocols-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                @change="toggleSelectAll"
                :checked="isAllSelected"
                :indeterminate="isPartiallySelected"
                class="select-checkbox"
              />
            </th>
            <th>№ протокола</th>
            <th>Студент</th>
            <th>Группа</th>
            <th>Проект</th>
            <th>Год</th>
            <th>Оценка</th>
            <th>Дата защиты</th>
            <th>Комиссия</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(protocol, index) in protocols"
            :key="protocol.ID"
            class="protocol-row"
            :class="{ 'selected-row': selectedProtocols.includes(protocol.ID) }"
          >
            <td>
              <input
                type="checkbox"
                :checked="selectedProtocols.includes(protocol.ID)"
                @change="toggleProtocolSelection(protocol.ID)"
                class="select-checkbox"
                :disabled="protocol.Status"
              />
            </td>
            <td>{{ index + 1 }}</td>
            <td>
              <div class="student-info">
                <div class="student-name">
                  {{ protocol.ID_Student.Surname }}
                  {{ protocol.ID_Student.Name }}
                  {{ protocol.ID_Student.Patronymic }}
                </div>
              </div>
            </td>
            <td>
              {{ protocol.ID_Student.ID_Group?.Name || "Не указана" }}
            </td>
            <td>
              {{ protocol.ID_Student.ID_Project?.Title || "Не указан" }}
            </td>
            <td>{{ protocol.Year }}</td>
            <td>
              <span :class="['grade-badge', getGradeClass(protocol.Grade)]">
                {{ protocol.Grade }}
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
              <div class="action-buttons">
                <button
                  v-if="!protocol.Status"
                  @click="approveProtocol(protocol)"
                  class="action-button approve-button"
                  :disabled="approvingProtocols[protocol.ID]"
                >
                  <span class="button-icon">{{
                    approvingProtocols[protocol.ID] ? "⏳" : "✅"
                  }}</span>
                  {{
                    approvingProtocols[protocol.ID]
                      ? "Утверждаем..."
                      : "Утвердить"
                  }}
                </button>
                <span v-else class="approved-text">
                  <span class="button-icon">✅</span>
                  Утвержден
                </span>

                <button
                  @click="generateDocx(protocol)"
                  class="action-button docx-button"
                  :disabled="generatingDocx[protocol.ID]"
                >
                  <span class="button-icon">{{
                    generatingDocx[protocol.ID] ? "⏳" : "📄"
                  }}</span>
                  {{ generatingDocx[protocol.ID] ? "Генерируем..." : "DOCX" }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="protocols.length > 0" class="pagination-container">
      <button
        @click="loadMore"
        v-if="hasMore"
        class="load-more-button"
        :disabled="loadingMore"
      >
        <span class="button-icon">{{ loadingMore ? "⏳" : "📄" }}</span>
        {{ loadingMore ? "Загружаем..." : "Загрузить еще" }}
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export default {
  name: "ProtocolList",
  data() {
    return {
      protocols: [],
      loading: false,
      loadingMore: false,
      error: null,
      searchQuery: "",
      searchTimeout: null,
      hasMore: true,
      currentPage: 1,
      pageSize: 20,
      approvingProtocols: {},
      generatingDocx: {},
      templateBuffer: null,
      selectedProtocols: [],
      bulkApproving: false,
    };
  },
  computed: {
    selectableProtocols() {
      return this.protocols.filter((protocol) => !protocol.Status);
    },
    isAllSelected() {
      return (
        this.selectableProtocols.length > 0 &&
        this.selectableProtocols.every((protocol) =>
          this.selectedProtocols.includes(protocol.ID)
        )
      );
    },
    isPartiallySelected() {
      return this.selectedProtocols.length > 0 && !this.isAllSelected;
    },
  },
  mounted() {
    this.loadProtocols();
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
        this.error =
          "Не удалось загрузить шаблон документа. Убедитесь, что файл /templates/test.docx существует.";
      }
    },

    toggleProtocolSelection(protocolId) {
      const index = this.selectedProtocols.indexOf(protocolId);
      if (index > -1) {
        this.selectedProtocols.splice(index, 1);
      } else {
        this.selectedProtocols.push(protocolId);
      }
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedProtocols = [];
      } else {
        this.selectedProtocols = this.selectableProtocols.map(
          (protocol) => protocol.ID
        );
      }
    },

    clearSelection() {
      this.selectedProtocols = [];
    },

    async bulkApprove() {
      if (this.selectedProtocols.length === 0) {
        alert("Выберите протоколы для утверждения");
        return;
      }

      if (
        !confirm(
          `Вы уверены, что хотите утвердить ${this.selectedProtocols.length} протокол(ов)?`
        )
      ) {
        return;
      }

      this.bulkApproving = true;

      try {
        const approvePromises = this.selectedProtocols.map((protocolId) =>
          axios.patch(
            `http://localhost:8000/api/protocols/${protocolId}/`,
            { Status: true },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        );

        await Promise.all(approvePromises);

        this.protocols.forEach((protocol) => {
          if (this.selectedProtocols.includes(protocol.ID)) {
            protocol.Status = true;
          }
        });

        alert(
          `Успешно утверждено ${this.selectedProtocols.length} протокол(ов)!`
        );
        this.clearSelection();
      } catch (error) {
        console.error("Ошибка массового утверждения протоколов:", error);
        alert(
          "Ошибка при утверждении протоколов: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        this.bulkApproving = false;
      }
    },

    async loadProtocols(reset = true) {
      if (reset) {
        this.loading = true;
        this.protocols = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.clearSelection();
      } else {
        this.loadingMore = true;
      }

      this.error = null;

      try {
        const params = {
          Status: false,
          page: this.currentPage,
          page_size: this.pageSize,
        };

        if (this.searchQuery.trim()) {
          params.student_fio = this.searchQuery.trim();
        }

        const response = await axios.get(
          "http://localhost:8000/api/protocols/",
          {
            params,
          }
        );

        let newProtocols = response.data.results || response.data;

        newProtocols = newProtocols.filter(
          (protocol) => protocol.Grade !== "Пересдача"
        );

        if (reset) {
          this.protocols = newProtocols;
        } else {
          this.protocols.push(...newProtocols);
        }

        this.hasMore = newProtocols.length === this.pageSize;
      } catch (err) {
        this.error = `Ошибка загрузки протоколов: ${
          err.response?.data?.message || err.message
        }`;
        console.error("Load protocols error:", err);
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },

    async approveProtocol(protocol) {
      if (this.approvingProtocols[protocol.ID]) return;

      this.approvingProtocols[protocol.ID] = true;

      try {
        const response = await axios.patch(
          `http://localhost:8000/api/protocols/${protocol.ID}/`,
          { Status: true },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          protocol.Status = true;
          const index = this.selectedProtocols.indexOf(protocol.ID);
          if (index > -1) {
            this.selectedProtocols.splice(index, 1);
          }
          alert("Протокол успешно утвержден!");
        }
      } catch (error) {
        console.error("Ошибка утверждения протокола:", error);
        alert(
          "Ошибка при утверждении протокола: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        this.approvingProtocols[protocol.ID] = false;
      }
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
          `Протокол_${protocol.ID}_${templateData.student.replace(
            /\s+/g,
            "_"
          )}.docx`
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
      const project = student.ID_Project;
      const specialization = student.ID_Specialization;
      const commission = protocol.ID_DefenseSchedule?.ID_Commission;
      const defenseSchedule = protocol.ID_DefenseSchedule;

      const startTime = this.parseTime(protocol.DefenseStartTime);
      const endTime = this.parseTime(protocol.DefenseEndTime);

      const dateTime = this.formatDateTime(defenseSchedule?.DateTime);

      let commissionMembers = [];
      let chairman = null;
      let secretary = null;
      let members = [];

      if (commission?.members && commission.members.length > 0) {
        commissionMembers = commission.members;
        console.log("Используем данные из протокола:", commissionMembers);
      } else if (commission?.ID) {
        try {
          const commissionResponse = await axios.post(
            "http://localhost:8000/api/commission_composition/",
            new FormData().append("id_commission", commission.ID),
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
          (m) =>
            m.Role === "Член аттестационной комиссии" ||
            m.Role === "Член аттестационной комиссии "
        );
      }

      let question1 = " ";
      let question2 = " ";

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
        number: protocol.Number || "Не указан",
        members: membersForSignatures,
      };
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

    handleSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        this.loadProtocols(true);
      }, 500);
    },

    clearSearch() {
      this.searchQuery = "";
      this.loadProtocols(true);
    },

    loadMore() {
      if (!this.hasMore || this.loadingMore) return;

      this.currentPage++;
      this.loadProtocols(false);
    },

    getGradeClass(grade) {
      const gradeMap = {
        5: "Отлично",
        Отлично: "Отлично",
        4: "Хорошо",
        Хорошо: "Хорошо",
        3: "Удовлетворительно",
        Удовлетворительно: "Удовлетворительно",
        2: "Неудовлетворительно",
        Неудовлетворительно: "Неудовлетворительно",
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

    formatDefenseDate(dateTimeStr) {
      if (!dateTimeStr) return "Не указана";

      const date = new Date(dateTimeStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}.${month}.${year}`;
    },
  },
};
</script>

<style scoped>
.protocol-list-container {
  padding: 1.5rem;
  max-width: 100%;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    Helvetica, Arial, sans-serif;
}

.protocol-list-header {
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

h2 {
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  min-width: 300px;
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

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.selected-count {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

.bulk-approve-button {
  background-color: #10b981;
  color: white;
}

.bulk-approve-button:hover:not(:disabled) {
  background-color: #059669;
}

.clear-selection-button {
  background-color: #64748b;
  color: white;
}

.clear-selection-button:hover {
  background-color: #475569;
}

.protocols-table-container {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.protocols-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1300px;
}

.protocols-table th,
.protocols-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.protocols-table th {
  background-color: #f8fafc;
  font-weight: 600;
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

.selected-row {
  background-color: #eff6ff !important;
}

.select-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.select-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 500;
  color: #1e293b;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
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

.approve-button {
  background-color: #10b981;
  color: white;
}

.approve-button:hover:not(:disabled) {
  background-color: #059669;
}

.approve-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.docx-button {
  background-color: #3b82f6;
  color: white;
}

.docx-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.docx-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.approved-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #166534;
  font-weight: 500;
  font-size: 0.875rem;
}

.button-icon {
  font-size: 1rem;
}

.loading-container,
.error-container,
.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon,
.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #94a3b8;
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
}

.retry-button:hover {
  background-color: #2563eb;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.load-more-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.load-more-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .protocol-list-container {
    padding: 1rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 100%;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .protocols-table-container {
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .action-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}
</style>
