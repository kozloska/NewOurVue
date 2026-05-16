<template>
  <div class="archive-container">
    <div class="archive-header">
      <h1>Архив протоколов</h1>

      <!-- Панель управления и фильтров -->
      <div class="controls-wrapper">
        <div class="search-box">
          <SearchIcon class="search-icon" />
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="Поиск по ФИО студента..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="clear-input-btn"
            title="Очистить поиск"
          >
            <XIcon class="btn-icon-small" />
          </button>
        </div>

        <div class="filter-group">
          <div class="select-wrapper">
            <select v-model="selectedYear" class="filter-select">
              <option value="">Все годы</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
            <ChevronDownIcon class="select-arrow" />
          </div>

          <div class="select-wrapper">
            <select v-model="selectedSpecialization" class="filter-select">
              <option value="">Все направления</option>
              <option
                v-for="spec in specializations"
                :key="spec.ID"
                :value="spec.ID"
              >
                {{ spec.Name }}
              </option>
            </select>
            <ChevronDownIcon class="select-arrow" />
          </div>

          <button
            v-if="activeFiltersCount > 0"
            @click="clearAllFilters"
            class="reset-btn"
            title="Сбросить все фильтры"
          >
            <RotateCcwIcon class="btn-icon" />
            <span class="btn-text">Сбросить</span>
          </button>
        </div>
      </div>

      <!-- Активные фильтры (Бейджи) -->
      <div v-if="activeFiltersCount > 0" class="active-filters-bar">
        <span class="filter-label">Активные фильтры:</span>

        <div v-if="searchQuery" class="filter-badge">
          <SearchIcon class="badge-icon" />
          <span>"{{ searchQuery }}"</span>
          <button @click="searchQuery = ''" class="badge-close">
            <XIcon class="btn-icon-tiny" />
          </button>
        </div>

        <div v-if="selectedYear" class="filter-badge">
          <CalendarIcon class="badge-icon" />
          <span>{{ selectedYear }}</span>
          <button @click="selectedYear = ''" class="badge-close">
            <XIcon class="btn-icon-tiny" />
          </button>
        </div>

        <div v-if="selectedSpecialization" class="filter-badge">
          <TagIcon class="badge-icon" />
          <span>{{ getSpecializationName(selectedSpecialization) }}</span>
          <button @click="selectedSpecialization = ''" class="badge-close">
            <XIcon class="btn-icon-tiny" />
          </button>
        </div>
      </div>
    </div>

    <!-- Панель массовых действий -->
    <div v-if="selectedProtocols.length > 0" class="bulk-actions-panel">
      <div class="selected-info">
        <CheckSquareIcon class="selected-icon" />
        <span
          >Выбрано протоколов:
          <strong>{{ selectedProtocols.length }}</strong></span
        >
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

    <!-- Прогресс бар генерации -->
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

    <!-- Основной контент таблицы или пустое состояние -->
    <div class="protocols-table-container">
      <!-- Пустое состояние -->
      <div v-if="filteredProtocols.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <FolderOpenIcon v-if="protocols.length > 0" class="empty-icon" />
          <InboxIcon v-else class="empty-icon" />
        </div>
        <h3 v-if="protocols.length === 0">Архив пуст</h3>
        <h3 v-else>Ничего не найдено</h3>
        <p v-if="protocols.length === 0">
          В базе данных пока нет завершенных протоколов.
        </p>
        <p v-else>Попробуйте изменить параметры поиска или сбросить фильтры.</p>
        <button
          v-if="activeFiltersCount > 0"
          @click="clearAllFilters"
          class="empty-action-btn"
        >
          Сбросить фильтры
        </button>
      </div>

      <!-- Таблица -->
      <template v-else>
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
            Показано {{ startIndex + 1 }}-{{
              Math.min(endIndex, filteredProtocols.length)
            }}
            из {{ filteredProtocols.length }}
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
                <th>Направление</th>
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
                <td>{{ protocol.ID_Student?.ID_Group?.Name || "—" }}</td>

                <td
                  class="specialization-cell"
                  :title="protocol.ID_Student?.ID_Specialization?.Name"
                >
                  {{ protocol.ID_Student?.ID_Specialization?.Name || "—" }}
                </td>

                <td
                  class="project-title"
                  :title="protocol.ID_Student?.ID_Project?.Title"
                >
                  {{ protocol.ID_Student?.ID_Project?.Title || "—" }}
                </td>

                <td>
                  <span :class="['grade-badge', getGradeClass(protocol.Grade)]">
                    {{ protocol.Grade || "—" }}
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
                    <DownloadIcon
                      v-if="!generatingDocx[protocol.ID]"
                      class="action-icon"
                    />
                    <Loader2Icon v-else class="action-icon spinning" />
                    {{ generatingDocx[protocol.ID] ? "..." : "" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div class="pagination-container">
          <div class="pagination-info">
            Страница {{ currentPage }} из {{ totalPages }}
          </div>
          <div class="pagination-controls">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="pagination-btn"
              title="В начало"
            >
              <ChevronsLeftIcon class="pagination-icon" />
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="pagination-btn"
              title="Назад"
            >
              <ChevronLeftIcon class="pagination-icon" />
            </button>

            <span class="page-numbers"> </span>

            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
              title="Вперед"
            >
              <ChevronRightIcon class="pagination-icon" />
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
              title="В конец"
            >
              <ChevronsRightIcon class="pagination-icon" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Уведомления -->
    <div v-if="notifications.length > 0" class="notifications">
      <transition-group name="slide">
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
      </transition-group>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
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
  CalendarIcon,
  TagIcon,
  RotateCcwIcon,
  FolderOpenIcon,
  InboxIcon,
  Loader2Icon,
  ChevronDownIcon,
} from "lucide-vue-next";

// ==================== STATE ====================
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

// ✅ НОВЫЕ: Квалификации
const qualifications = ref({}); // qualifications[specId] = массив квалификаций
const loadingQualifications = ref({}); // loadingQualifications[specId] = boolean

let searchTimeout = null;

// ==================== COMPUTED ====================

const activeFiltersCount = computed(() => {
  let count = 0;
  if (searchQuery.value && searchQuery.value.trim()) count++;
  if (selectedYear.value) count++;
  if (selectedSpecialization.value) count++;
  return count;
});

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
  Math.max(1, Math.ceil(filteredProtocols.value.length / itemsPerPage.value))
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

// ==================== DATA LOADING ====================

const loadProtocols = async () => {
  try {
    const response = await api.get("/api/protocols/", {
      params: { Status: true, page_size: 1000 },
    });
    protocols.value = response.data.results || response.data;

    // ✅ Предзагрузка квалификаций для всех специализаций
    const specIds = [
      ...new Set(
        protocols.value
          .map(
            (p) =>
              p.ID_Student?.ID_Specialization?.ID ||
              p.ID_Student?.ID_Specialization
          )
          .filter((id) => id)
      ),
    ];
    for (const specId of specIds) {
      if (!qualifications.value[specId]) {
        await loadQualificationsForSpecialization(specId);
      }
    }

    console.log("Загружено протоколов:", protocols.value.length);
  } catch (error) {
    console.error("Ошибка загрузки протоколов:", error);
    addNotification("Ошибка загрузки протоколов", "error");
  }
};

const loadSpecializations = async () => {
  try {
    const response = await api.get("/api/specializations/");
    specializations.value = response.data;
  } catch (error) {
    console.error("Ошибка загрузки специализаций:", error);
    addNotification("Ошибка загрузки специализаций", "error");
  }
};

// ✅ Загрузка квалификаций для специализации
const loadQualificationsForSpecialization = async (specializationId) => {
  if (!specializationId || qualifications.value[specializationId]) return;

  loadingQualifications.value[specializationId] = true;
  try {
    const response = await api.get("/api/qualifications/", {
      params: { ID_Specialization: specializationId },
    });
    qualifications.value[specializationId] = response.data;
  } catch (error) {
    console.error(
      `Ошибка загрузки квалификаций для ${specializationId}:`,
      error
    );
    qualifications.value[specializationId] = [];
  } finally {
    loadingQualifications.value[specializationId] = false;
  }
};

const loadTemplate = async () => {
  if (templateBuffer.value) return;

  try {
    const response = await fetch("/pck/templates/test.docx");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    // ✅ Важно: arrayBuffer(), а не .data
    templateBuffer.value = await response.arrayBuffer();
    console.log("Шаблон успешно загружен");
  } catch (error) {
    console.error("Ошибка загрузки шаблона:", error);
    addNotification(
      "Ошибка загрузки шаблона документа. Проверьте путь /templates/test.docx",
      "error"
    );
  }
};

// ==================== ACTIONS ====================

const handleSearchInput = () => {
  currentPage.value = 1;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {}, 300);
};

const clearAllFilters = () => {
  searchQuery.value = "";
  selectedYear.value = "";
  selectedSpecialization.value = "";
  currentPage.value = 1;
  addNotification("Фильтры сброшены", "info");
};

const getSpecializationName = (id) => {
  const spec = specializations.value.find((s) => s.ID === id);
  return spec ? spec.Name : "Неизвестно";
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

// ==================== GENERATION LOGIC ====================

const generateDocx = async (protocol) => {
  if (generatingDocx.value[protocol.ID]) return;

  if (!templateBuffer.value) {
    addNotification(
      "Шаблон документа ещё загружается или не найден.",
      "warning"
    );
    await loadTemplate();
    if (!templateBuffer.value) return;
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

    const fileName = `Протокол_${
      protocol.Number || protocol.ID
    }_${templateData.student.replace(/\s+/g, "_")}.docx`;
    saveAs(blob, fileName);

    addNotification(
      `Протокол для ${getStudentFullName(protocol)} создан`,
      "success"
    );
  } catch (error) {
    console.error("Ошибка генерации протокола:", error);
    addNotification(
      `Ошибка: ${error.message || "Не удалось создать файл"}`,
      "error"
    );
  } finally {
    generatingDocx.value[protocol.ID] = false;
  }
};

const generateSelectedProtocols = async () => {
  if (selectedProtocols.value.length === 0) return;

  if (!templateBuffer.value) {
    addNotification("Шаблон не загружен. Повторите попытку.", "error");
    await loadTemplate();
    if (!templateBuffer.value) return;
  }

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
          // Небольшая пауза для обработки браузером
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(error);
          addNotification(
            `Ошибка в протоколе ${getStudentFullName(protocol)}`,
            "error"
          );
        }
      }
    }

    if (generatedFiles.length > 0) {
      if (generatedFiles.length === 1) {
        saveAs(generatedFiles[0].blob, generatedFiles[0].filename);
      } else {
        await createZipArchive(generatedFiles);
      }
      addNotification(
        `Успешно сгенерировано ${generatedFiles.length} файлов`,
        "success"
      );
    }
  } finally {
    isGenerating.value = false;
    generationProgress.value = 0;
    currentGeneratingStudent.value = "";
  }
};

const saveAs = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ==================== TEMPLATE DATA PREPARATION ====================

const prepareTemplateData = async (protocol) => {
  const student = protocol.ID_Student;
  const project = student?.ID_Project;
  const specialization = student?.ID_Specialization;
  const commission = protocol.ID_DefenseSchedule?.ID_Commission;
  const defenseSchedule = protocol.ID_DefenseSchedule;

  const startTime = parseTime(protocol.DefenseStartTime);
  const endTime = parseTime(protocol.DefenseEndTime);
  const dateTime = formatDateTimeForDoc(defenseSchedule?.DateTime);

  // === Загрузка состава комиссии ===
  let commissionMembers = [];
  if (commission?.ID) {
    try {
      const response = await api.get(
        `/api/commission_compositions/?commission_id=${commission.ID}`
      );
      commissionMembers = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
    } catch (error) {
      console.error("Ошибка загрузки состава комиссии:", error);
      commissionMembers = [];
    }
  }

  const chairman = commissionMembers.find((m) => m.Role === "Председатель");
  const secretary = commissionMembers.find((m) => m.Role === "Секретарь");
  const members = commissionMembers.filter(
    (m) =>
      m.Role === "Член аттестационной комиссии" ||
      m.Role === "Член аттестационной комиссии "
  );

  // Загрузка вопросов
  let question1 = " ",
    question2 = " ";
  if (protocol.ID_Question) {
    try {
      const q1 = await api.get(`/api/questions/${protocol.ID_Question}/`);
      question1 = q1.data.Text;
    } catch (e) {
      console.error("Ошибка вопроса 1:", e);
    }
  }
  if (protocol.ID_Question2) {
    try {
      const q2 = await api.get(`/api/questions/${protocol.ID_Question2}/`);
      question2 = q2.data.Text;
    } catch (e) {
      console.error("Ошибка вопроса 2:", e);
    }
  }

  // Склонение ФИО
  let studentDative = getFullName(student);
  try {
    const dativeResponse = await api.post("/api/fio_to_dative/", {
      fio: getFullName(student),
    });
    studentDative = dativeResponse.data.dative_fio;
  } catch (error) {
    console.error("Ошибка склонения ФИО:", error);
  }

  // ✅ Загружаем квалификации для специализации студента, если нужно
  const specId = student?.ID_Specialization?.ID || student?.ID_Specialization;
  if (specId && !qualifications.value[specId]) {
    await loadQualificationsForSpecialization(specId);
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
    qualification:
      getQualificationName(student?.ID_Qualification, student) || "Бакалавр",
    secretary: secretary ? getInitials(secretary.ID_Member) : "Не указан",
    question1: question1,
    question2: question2,
    number: protocol.Number || protocol.ID,
    members: membersForSignatures,
  };
};

// ==================== HELPERS ====================

const getQualificationName = (qualificationId, student) => {
  if (!qualificationId) return "Не указана";

  // Если это объект с полем Name
  if (typeof qualificationId === "object" && qualificationId.Name) {
    return qualificationId.Name;
  }

  // Если это просто ID — ищем в загруженных квалификациях
  const specId = student?.ID_Specialization?.ID || student?.ID_Specialization;
  if (specId && qualifications.value[specId]) {
    const qual = qualifications.value[specId].find(
      (q) => q.ID === qualificationId
    );
    if (qual) return qual.Name;
  }

  return "Бакалавр";
};

const formatDateTimeForDoc = (dateTimeStr) => {
  if (!dateTimeStr) return "«__» ______ 20__ г.";
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
  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()} г.`;
};

// Форматирование даты защиты для отображения в таблице (используется в шаблоне)
const formatDefenseDate = (dateTimeStr) => {
  if (!dateTimeStr) return "—";
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString("ru-RU");
};
const createZipArchive = async (files) => {
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.filename, file.blob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(
    zipBlob,
    `Протоколы_Архив_${new Date().toISOString().split("T")[0]}.zip`
  );
};

const parseTime = (timeStr) => {
  if (!timeStr) return { hours: "00", minutes: "00" };
  const parts = timeStr.split(":");
  return {
    hours: parts[0].padStart(2, "0"),
    minutes: parts[1] ? parts[1].padStart(2, "0") : "00",
  };
};

const getFullName = (person) => {
  if (!person) return "Фамилия И.О.";
  return `${person.Surname || ""} ${person.Name || ""} ${
    person.Patronymic || ""
  }`.trim();
};

const getStudentFullName = (protocol) => {
  if (!protocol.ID_Student) return "Студент удален";
  return getFullName(protocol.ID_Student);
};

const getGradeClass = (grade) => {
  if (!grade) return "grade-unknown";
  const strGrade = String(grade).toLowerCase();
  if (strGrade === "5" || strGrade === "отлично") return "grade-excellent";
  if (strGrade === "4" || strGrade === "хорошо") return "grade-good";
  if (strGrade === "3" || strGrade === "удовлетворительно")
    return "grade-satisfactory";
  return "grade-unsatisfactory";
};

const getInitials = (person) => {
  if (!person) return "";
  const surname = person.Surname || "";
  const name = person.Name ? person.Name.charAt(0).toUpperCase() + "." : "";
  const patronymic = person.Patronymic
    ? person.Patronymic.charAt(0).toUpperCase() + "."
    : "";
  return `${surname} ${name}${patronymic}`.trim();
};

const capitalizeFirstLetter = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ==================== NOTIFICATIONS ====================

const addNotification = (message, type = "info") => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
  setTimeout(() => removeNotification(id), 5000);
};

const removeNotification = (id) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index > -1) notifications.value.splice(index, 1);
};

// ==================== WATCHERS & MOUNTED ====================

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
/* ==================== ОСНОВНОЙ КОНТЕЙНЕР ==================== */
.archive-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
}

.archive-header {
  margin-bottom: 2rem;
}

.archive-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

/* ==================== ПАНЕЛЬ УПРАВЛЕНИЯ ==================== */
.controls-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.1rem;
  height: 1.1rem;
  color: #9ca3af;
}

.clear-input-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-input-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.select-wrapper {
  position: relative;
}

.filter-select {
  appearance: none;
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 160px;
}

.select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  pointer-events: none;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.active-filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  align-items: center;
}

.filter-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-right: 0.5rem;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.5rem 0.25rem 0.4rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 9999px;
  font-size: 0.8rem;
  color: #1e40af;
}

.badge-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.badge-close {
  background: transparent;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem;
  border-radius: 50%;
}

.badge-close:hover {
  background: #dbeafe;
  color: #1e40af;
}

/* ==================== МАССОВЫЕ ДЕЙСТВИЯ ==================== */
.bulk-actions-panel {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #166534;
  font-weight: 500;
}

.bulk-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary,
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: #059669;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #047857;
}

.btn-primary:disabled {
  background: #6ee7b7;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-action {
  padding: 0.4rem;
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.btn-action:hover:not(:disabled) {
  background: #dbeafe;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: wait;
}

.progress-container {
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.progress-bar {
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #059669;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #4b5563;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.empty-icon {
  width: 2rem;
  height: 2rem;
  color: #9ca3af;
}

.empty-state h3 {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.empty-action-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  color: #374151;
  cursor: pointer;
}

.empty-action-btn:hover {
  background: #f3f4f6;
}

/* ==================== ТАБЛИЦА ==================== */
.protocols-table-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-controls {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  user-select: none;
}

.table-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-wrapper {
  overflow-x: auto;
}

.protocols-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  /* table-layout: fixed; Убрал фиксацию, чтобы остальные колонки тянулись */
}

.protocols-table th,
.protocols-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
  word-wrap: break-word;
}

.protocols-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.student-name,
.specialization-cell,
.project-title {
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
}

/* === ИЗМЕНЕННЫЕ ШИРИНЫ КОЛОНОК === */

/* Выбор (Чекбокс) - уменьшили */
.checkbox-column {
  width: 40px !important;
  text-align: center !important;
}

/* Оценка - уменьшили */
.protocols-table th:nth-child(7),
.protocols-table td:nth-child(7) {
  width: 80px !important;
}

/* Год - уменьшили */
.protocols-table th:nth-child(8),
.protocols-table td:nth-child(8) {
  width: 70px !important;
}

/* Дата защиты - уменьшили */
.protocols-table th:nth-child(9),
.protocols-table td:nth-child(9) {
  width: 110px !important;
}

/* Действия - уменьшили */
.actions-column {
  width: 60px !important;
  text-align: center !important;
}

/* Остальные стили таблицы без изменений */
input[type="checkbox"] {
  cursor: pointer;
  accent-color: #059669;
  width: 1rem;
  height: 1rem;
}

.selected-row {
  background-color: #f0fdf4;
}

.student-name {
  font-weight: 500;
}

.specialization-cell,
.project-title {
  max-width: 300px;
}

.grade-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
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
  color: #6b7280;
}

.pagination-container {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.pagination-controls {
  display: flex;
  gap: 0.25rem;
}

.pagination-btn {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.notifications {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 400px;
  border-left: 4px solid transparent;
  animation: slideIn 0.3s ease-out;
}

.notification-success {
  border-left-color: #10b981;
}

.notification-error {
  border-left-color: #ef4444;
}

.notification-info {
  border-left-color: #3b82f6;
}

.notification-icon {
  flex-shrink: 0;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-info .notification-icon {
  color: #3b82f6;
}

.notification-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
}

.notification-close:hover {
  color: #4b5563;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-icon-small {
  width: 0.9rem;
  height: 0.9rem;
}

.btn-icon-tiny {
  width: 0.75rem;
  height: 0.75rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .archive-container {
    padding: 1rem;
  }
  .controls-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    max-width: none;
  }
  .filter-group {
    flex-wrap: wrap;
  }
  .select-wrapper {
    flex: 1;
  }
  .bulk-actions-panel {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  .bulk-buttons {
    justify-content: space-between;
  }
}
</style>
