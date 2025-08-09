<template>
  <div class="archive-container">
    <div class="archive-header">
      <h1>Архив протоколов</h1>
      <div class="header-controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по ФИО студента..."
            class="search-input"
          />
          <SearchIcon class="search-icon" />
        </div>
        <div class="filter-controls">
          <select v-model="selectedYear" class="year-filter">
            <option value="">Все годы</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
          <select
            v-model="selectedSpecialization"
            class="specialization-filter"
          >
            <option value="">Все специализации</option>
            <option
              v-for="spec in specializations"
              :key="spec.ID"
              :value="spec.ID"
            >
              {{ spec.Name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="selectedProtocols.length > 0" class="bulk-actions-panel">
      <div class="selected-info">
        <CheckSquareIcon class="selected-icon" />
        <span>Выбрано протоколов: {{ selectedProtocols.length }}</span>
      </div>
      <div class="bulk-buttons">
        <button @click="clearSelection" class="btn-secondary">
          <XIcon class="btn-icon" />
          Снять выделение
        </button>
        <button
          @click="generateSelectedProtocols"
          :disabled="isGenerating"
          class="btn-primary"
        >
          <FileTextIcon class="btn-icon" />
          <span v-if="!isGenerating"
            >Сгенерировать выбранные ({{ selectedProtocols.length }})</span
          >
          <span v-else
            >Генерация... {{ generationProgress }}/{{
              selectedProtocols.length
            }}</span
          >
        </button>
      </div>
    </div>

    <div v-if="isGenerating" class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{
            width: `${(generationProgress / selectedProtocols.length) * 100}%`,
          }"
        ></div>
      </div>
      <div class="progress-text">
        Генерируется протокол {{ generationProgress }} из
        {{ selectedProtocols.length }}
        <span v-if="currentGeneratingStudent"
          >для {{ currentGeneratingStudent }}</span
        >
      </div>
    </div>

    <div class="protocols-table-container">
      <div class="table-controls">
        <label class="select-all-checkbox">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isPartiallySelected"
            @change="toggleSelectAll"
          />
          <span class="checkmark"></span>
          Выбрать все на странице
        </label>
        <div class="table-info">
          Всего протоколов: {{ filteredProtocols.length }}
        </div>
      </div>

      <div class="table-wrapper">
        <table class="protocols-table">
          <thead>
            <tr>
              <th class="checkbox-column">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th>№</th>
              <th>ФИО студента</th>
              <th>Группа</th>
              <th>Специализация</th>
              <th>Тема проекта</th>
              <th>Оценка</th>
              <th>Год</th>
              <th>Дата защиты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="protocol in paginatedProtocols"
              :key="protocol.ID"
              :class="{
                'selected-row': selectedProtocols.includes(protocol.ID),
              }"
            >
              <td class="checkbox-column">
                <label class="protocol-checkbox">
                  <input
                    type="checkbox"
                    :value="protocol.ID"
                    v-model="selectedProtocols"
                  />
                  <span class="checkmark"></span>
                </label>
              </td>
              <td>{{ protocol.Number || protocol.ID }}</td>
              <td class="student-name">
                {{ getStudentFullName(protocol) }}
              </td>
              <td>{{ protocol.ID_Student?.ID_Group?.Name || "Не указана" }}</td>
              <td class="specialization-cell">
                {{
                  protocol.ID_Student?.ID_Specialization?.Name || "Не указана"
                }}
              </td>
              <td class="project-title">
                {{ protocol.ID_Student?.ID_Project?.Title || "Не указана" }}
              </td>
              <td>
                <span :class="['grade-badge', getGradeClass(protocol.Grade)]">
                  {{ protocol.Grade || "Не оценено" }}
                </span>
              </td>
              <td>{{ protocol.Year }}</td>
              <td>
                {{ formatDefenseDate(protocol.ID_DefenseSchedule?.DateTime) }}
              </td>
              <td class="actions-column">
                <button
                  @click="generateDocx(protocol)"
                  :disabled="isGenerating || generatingDocx[protocol.ID]"
                  class="btn-action"
                  title="Сгенерировать протокол"
                >
                  <DownloadIcon class="action-icon" />
                  {{
                    generatingDocx[protocol.ID] ? "Генерируем..." : "Скачать"
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-container">
        <div class="pagination-info">
          Показано {{ startIndex + 1 }}-{{
            Math.min(endIndex, filteredProtocols.length)
          }}
          из {{ filteredProtocols.length }}
        </div>
        <div class="pagination-controls">
          <button
            @click="currentPage = 1"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <ChevronsLeftIcon class="pagination-icon" />
          </button>
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <ChevronLeftIcon class="pagination-icon" />
          </button>
          <span class="page-info">
            Страница {{ currentPage }} из {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <ChevronRightIcon class="pagination-icon" />
          </button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <ChevronsRightIcon class="pagination-icon" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="notifications.length > 0" class="notifications">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
      >
        <CheckCircleIcon
          v-if="notification.type === 'success'"
          class="notification-icon"
        />
        <AlertCircleIcon
          v-if="notification.type === 'error'"
          class="notification-icon"
        />
        <InfoIcon
          v-if="notification.type === 'info'"
          class="notification-icon"
        />
        <span>{{ notification.message }}</span>
        <button
          @click="removeNotification(notification.id)"
          class="notification-close"
        >
          <XIcon class="close-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import JSZip from "jszip";
import {
  SearchIcon,
  CheckSquareIcon,
  XIcon,
  FileTextIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-vue-next";

const protocols = ref([]);
const specializations = ref([]);
const selectedProtocols = ref([]);
const searchQuery = ref("");
const selectedYear = ref("");
const selectedSpecialization = ref("");
const isGenerating = ref(false);
const generationProgress = ref(0);
const currentGeneratingStudent = ref("");
const notifications = ref([]);
const currentPage = ref(1);
const itemsPerPage = ref(20);
const generatingDocx = ref({});
const templateBuffer = ref(null);

const filteredProtocols = computed(() => {
  let filtered = protocols.value.filter((protocol) => protocol.Status === true);

  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((protocol) => {
      const fullName = getStudentFullName(protocol).toLowerCase();
      return fullName.includes(query);
    });
  }

  if (selectedYear.value) {
    filtered = filtered.filter(
      (protocol) => String(protocol.Year) === String(selectedYear.value)
    );
  }

  if (selectedSpecialization.value) {
    filtered = filtered.filter(
      (protocol) =>
        String(protocol.ID_Student?.ID_Specialization?.ID) ===
        String(selectedSpecialization.value)
    );
  }

  return filtered.sort((a, b) => {
    const dateA = new Date(a.ID_DefenseSchedule?.DateTime || 0);
    const dateB = new Date(b.ID_DefenseSchedule?.DateTime || 0);
    return dateB - dateA;
  });
});

const availableYears = computed(() => {
  const years = [...new Set(protocols.value.map((p) => p.Year))].filter(
    (year) => year
  );
  return years.sort((a, b) => b - a);
});

const totalPages = computed(() =>
  Math.ceil(filteredProtocols.value.length / itemsPerPage.value)
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedProtocols = computed(() => {
  return filteredProtocols.value.slice(startIndex.value, endIndex.value);
});

const isAllSelected = computed(() => {
  const currentPageIds = paginatedProtocols.value.map((p) => p.ID);
  return (
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedProtocols.value.includes(id))
  );
});

const isPartiallySelected = computed(() => {
  const currentPageIds = paginatedProtocols.value.map((p) => p.ID);
  return (
    currentPageIds.some((id) => selectedProtocols.value.includes(id)) &&
    !isAllSelected.value
  );
});

const loadProtocols = async () => {
  try {
    const response = await axios.get("http://localhost:8000/api/protocols/", {
      params: {
        Status: true,
        page_size: 1000,
      },
    });
    protocols.value = response.data.results || response.data;
    console.log("Загружено протоколов:", protocols.value.length);
  } catch (error) {
    console.error("Ошибка загрузки протоколов:", error);
    addNotification("Ошибка загрузки протоколов", "error");
  }
};

const loadSpecializations = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8000/api/specializations/"
    );
    specializations.value = response.data;
    console.log("Загружено специализаций:", specializations.value.length);
  } catch (error) {
    console.error("Ошибка загрузки специализаций:", error);
    addNotification("Ошибка загрузки специализаций", "error");
  }
};

const loadTemplate = async () => {
  try {
    const response = await fetch("/templates/test.docx");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    templateBuffer.value = await response.arrayBuffer();
    console.log("Шаблон успешно загружен");
  } catch (error) {
    console.error("Ошибка загрузки шаблона:", error);
    addNotification("Ошибка загрузки шаблона документа", "error");
  }
};

const toggleSelectAll = () => {
  const currentPageIds = paginatedProtocols.value.map((p) => p.ID);

  if (isAllSelected.value) {
    selectedProtocols.value = selectedProtocols.value.filter(
      (id) => !currentPageIds.includes(id)
    );
  } else {
    const newSelections = currentPageIds.filter(
      (id) => !selectedProtocols.value.includes(id)
    );
    selectedProtocols.value.push(...newSelections);
  }
};

const clearSelection = () => {
  selectedProtocols.value = [];
};

const generateDocx = async (protocol) => {
  if (generatingDocx.value[protocol.ID]) return;

  if (!templateBuffer.value) {
    addNotification(
      "Шаблон документа не загружен. Попробуйте перезагрузить страницу.",
      "error"
    );
    return;
  }

  generatingDocx.value[protocol.ID] = true;

  try {
    const templateData = await prepareTemplateData(protocol);

    const zip = new PizZip(templateBuffer.value);
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

    addNotification(
      `Протокол для ${getStudentFullName(protocol)} успешно сгенерирован`,
      "success"
    );
  } catch (error) {
    console.error("Ошибка генерации протокола:", error);
    addNotification(
      `Ошибка при генерации протокола: ${error.message}`,
      "error"
    );
  } finally {
    generatingDocx.value[protocol.ID] = false;
  }
};

const generateSelectedProtocols = async () => {
  if (selectedProtocols.value.length === 0) return;

  isGenerating.value = true;
  generationProgress.value = 0;
  const generatedFiles = [];

  try {
    for (let i = 0; i < selectedProtocols.value.length; i++) {
      const protocolId = selectedProtocols.value[i];
      const protocol = protocols.value.find((p) => p.ID === protocolId);

      if (protocol) {
        currentGeneratingStudent.value = getStudentFullName(protocol);

        try {
          if (!templateBuffer.value) {
            addNotification("Шаблон документа не загружен", "error");
            continue;
          }

          const templateData = await prepareTemplateData(protocol);

          const zip = new PizZip(templateBuffer.value);
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

          generatedFiles.push({
            blob: new Blob([buf], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }),
            filename: `Протокол_${
              protocol.Number || protocol.ID
            }_${templateData.student.replace(/\s+/g, "_")}.docx`,
          });

          generationProgress.value++;
        } catch (error) {
          addNotification(
            `Ошибка генерации протокола для ${getStudentFullName(protocol)}`,
            "error"
          );
        }
      }
    }

    if (generatedFiles.length > 0) {
      if (typeof JSZip !== "undefined") {
        await createZipArchive(generatedFiles);
      } else {
        downloadFilesIndividually(generatedFiles);
      }

      addNotification(
        `Успешно сгенерировано ${generatedFiles.length} протоколов`,
        "success"
      );
    }
  } finally {
    isGenerating.value = false;
    generationProgress.value = 0;
    currentGeneratingStudent.value = "";
  }
};

const prepareTemplateData = async (protocol) => {
  const student = protocol.ID_Student;
  const project = student?.ID_Project;
  const specialization = student?.ID_Specialization;
  const commission = protocol.ID_DefenseSchedule?.ID_Commission;
  const defenseSchedule = protocol.ID_DefenseSchedule;

  const startTime = parseTime(protocol.DefenseStartTime);
  const endTime = parseTime(protocol.DefenseEndTime);
  const dateTime = formatDateTime(defenseSchedule?.DateTime);

  let commissionMembers = [];
  let chairman = null;
  let secretary = null;
  let members = [];

  if (commission?.members && commission.members.length > 0) {
    commissionMembers = commission.members;
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

  let studentDative = getFullName(student);
  try {
    const dativeResponse = await axios.post(
      "http://localhost:8000/api/fio_to_dative/",
      {
        fio: getFullName(student),
      }
    );
    studentDative = dativeResponse.data.dative_fio;
  } catch (error) {
    console.error("Ошибка склонения ФИО:", error);
  }

  const membersForSignatures = members.map((member) => ({
    name: getInitials(member.ID_Member),
  }));

  return {
    starthours: startTime.hours,
    startmin: startTime.minutes,
    endhours: endTime.hours,
    endmin: endTime.minutes,
    datetime: dateTime,
    chairman: chairman ? getInitials(chairman.ID_Member) : "Не указан",
    student: getFullName(student),
    studentdat: capitalizeFirstLetter(studentDative),
    direction: specialization?.Name || "Не указано",
    Title: project?.Title || "Не указан",
    supervisor: project?.Supervisor || "Не указан",
    grade: protocol.Grade || "Не указана",
    qualification: specialization?.Qualification || "Не указана",
    secretary: secretary ? getInitials(secretary.ID_Member) : "Не указан",
    question1: question1,
    question2: question2,
    number: protocol.Number || protocol.ID,
    members: membersForSignatures,
  };
};

const createZipArchive = async (files) => {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.filename, file.blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = window.URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Протоколы_архив_${
    new Date().toISOString().split("T")[0]
  }.zip`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const downloadFilesIndividually = (files) => {
  files.forEach((file, index) => {
    setTimeout(() => {
      const url = window.URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      window.URL.revokeObjectURL(url);
    }, index * 500);
  });
};

const parseTime = (timeStr) => {
  if (!timeStr) return { hours: "00", minutes: "00" };
  const parts = timeStr.split(":");
  return {
    hours: parts[0] || "00",
    minutes: parts[1] || "00",
  };
};

const formatDateTime = (dateTimeStr) => {
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
};

const getFullName = (person) => {
  if (!person) return "Не указан";
  return `${person.Surname || ""} ${person.Name || ""} ${
    person.Patronymic || ""
  }`.trim();
};

const getStudentFullName = (protocol) => {
  if (!protocol.ID_Student) return "Неизвестный студент";
  return getFullName(protocol.ID_Student);
};

const formatDefenseDate = (dateTimeStr) => {
  if (!dateTimeStr) return "Не указана";

  const date = new Date(dateTimeStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

const getGradeClass = (grade) => {
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
};

const getInitials = (person) => {
  if (!person) return "Не указан";

  const surname = person.Surname || "";
  const name = person.Name || "";
  const patronymic = person.Patronymic || "";

  const nameInitial = name ? name.charAt(0).toUpperCase() + "." : "";
  const patronymicInitial = patronymic
    ? patronymic.charAt(0).toUpperCase() + "."
    : "";

  return `${surname} ${nameInitial}${patronymicInitial}`.trim();
};

const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const addNotification = (message, type = "info") => {
  const notification = {
    id: Date.now(),
    message,
    type,
  };
  notifications.value.push(notification);

  setTimeout(() => {
    removeNotification(notification.id);
  }, 5000);
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

watch([searchQuery, selectedYear, selectedSpecialization], () => {
  selectedProtocols.value = [];
  currentPage.value = 1;
});

onMounted(() => {
  loadProtocols();
  loadSpecializations();
  loadTemplate();
});
</script>

<style scoped>
.archive-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.archive-header {
  margin-bottom: 2rem;
}

.archive-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.header-controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: flex-start;
  width: 100%;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: white;
  color: #1f2937;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  pointer-events: none;
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  align-items: flex-start;
}

.year-filter,
.specialization-filter {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  width: 160px;
  flex-shrink: 0;
  background-color: white;
}

.bulk-actions-panel {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.selected-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #059669;
}

.bulk-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #059669;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #047857;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-action {
  background: #3b82f6;
  color: white;
  padding: 0.5rem;
}

.btn-action:hover:not(:disabled) {
  background: #2563eb;
}

.btn-icon,
.action-icon {
  width: 1rem;
  height: 1rem;
}

.progress-container {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #059669;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.protocols-table-container {
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-controls {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.table-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.table-wrapper {
  overflow-x: auto;
}

.protocols-table {
  width: 100%;
  border-collapse: collapse;
}

.protocols-table th,
.protocols-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.protocols-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.checkbox-column {
  width: 3rem;
}

.protocol-checkbox,
.select-all-checkbox {
  display: flex;
  align-items: center;
}

.checkmark {
  width: 1rem;
  height: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  position: relative;
}

input[type="checkbox"] {
  opacity: 0;
  position: absolute;
}

input[type="checkbox"]:checked + .checkmark {
  background: #059669;
  border-color: #059669;
}

input[type="checkbox"]:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 0.75rem;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.selected-row {
  background: #f0fdf4;
}

.student-name {
  font-weight: 500;
}

.specialization-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-title {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grade-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.grade-excellent {
  background: #dcfce7;
  color: #166534;
}

.grade-good {
  background: #dbeafe;
  color: #1e40af;
}

.grade-satisfactory {
  background: #fef3c7;
  color: #92400e;
}

.grade-unsatisfactory {
  background: #fee2e2;
  color: #991b1b;
}

.grade-unknown {
  background: #f3f4f6;
  color: #374151;
}

.actions-column {
  width: 4rem;
}

.pagination-container {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e5e7eb;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 1rem;
  height: 1rem;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0.5rem;
}

.notifications {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.notification-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.notification-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.notification-info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.notification-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
}

.close-icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 1024px) {
  .header-controls {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .search-box {
    max-width: none;
  }

  .filter-controls {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .year-filter,
  .specialization-filter {
    width: auto;
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .archive-container {
    padding: 1rem;
  }

  .header-controls {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .search-box {
    min-width: auto;
    max-width: none;
  }

  .filter-controls {
    justify-content: stretch;
  }

  .year-filter,
  .specialization-filter {
    flex: 1;
    min-width: auto;
    width: auto;
  }

  .bulk-actions-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-buttons {
    justify-content: center;
  }

  .pagination-container {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
