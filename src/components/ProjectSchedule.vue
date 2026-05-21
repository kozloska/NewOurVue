<template>
  <div class="schedule-container">
    <div class="schedule-header">
      <h1>Расписание защиты проектов</h1>
      <div class="header-info">
        <div class="year-section">
          <div class="year-display">
            <CalendarIcon class="year-icon" />
            <span>{{ currentYear }} учебный год</span>
          </div>

          <!-- Счётчик скрыт для секретаря -->
          <span v-if="!isReadOnlyMode" class="stat-item projects-stat">
            <FolderIcon class="stat-icon" />
            Нераспределённых проектов: {{ filteredUnassignedProjects.length }}
          </span>
        </div>

        <div class="header-actions">
          <!-- Бейдж режима для секретаря -->
          <span
            v-if="isReadOnlyMode"
            class="stat-item"
            style="
              background: #fef3c7;
              color: #92400e;
              border-color: #fcd34d;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            "
          >
            <EyeIcon class="stat-icon" style="width: 1rem; height: 1rem" />
            Режим просмотра
          </span>

          <span v-if="selectedSpecialization" class="stat-item spec-badge">
            <TagIcon class="stat-icon" />
            {{ getCurrentSpecializationName }}
          </span>

          <div class="specialization-filter">
            <label for="spec-select" class="spec-label">
              <TagIcon class="spec-icon" />
              Направление подготовки:
            </label>
            <div class="spec-select-wrapper">
              <select
                id="spec-select"
                v-model="selectedSpecialization"
                @change="applySpecializationFilter"
                class="spec-select"
                :disabled="loading"
              >
                <option :value="null">Общее расписание</option>
                <option
                  v-for="spec in availableSpecializations"
                  :key="spec.ID"
                  :value="spec.ID"
                >
                  {{ spec.Name }}
                </option>
              </select>
              <div class="spec-select-arrow">
                <ChevronDownIcon />
              </div>
            </div>
            <button
              v-if="selectedSpecialization"
              @click="clearSpecializationFilter"
              class="spec-clear-btn"
              :disabled="loading"
            >
              <XIcon class="btn-icon" />
              Сбросить фильтр
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="schedule-content"
      :class="{ 'full-width-mode': isReadOnlyMode }"
    >
      <!-- ЛЕВАЯ КОЛОНКА: ПУЛ ПРОЕКТОВ -->
      <!-- ПОЛНОСТЬЮ СКРЫТА ДЛЯ СЕКРЕТАРЯ (isReadOnlyMode) -->
      <!-- Благодаря этому правая колонка займет всю ширину -->
      <div v-if="!isReadOnlyMode" class="unassigned-pool">
        <div class="pool-header">
          <h2>
            <FolderIcon class="section-icon" />
            Нераспределённые проекты
          </h2>
          <div class="pool-count">{{ filteredUnassignedProjects.length }}</div>
        </div>

        <div class="pool-filters">
          <label class="filter-checkbox">
            <input
              type="checkbox"
              v-model="showPartialOnly"
              :disabled="isReadOnlyMode"
            />
            <span>Только частично защищённые проекты</span>
          </label>

          <div class="search-box">
            <SearchIcon class="search-icon" />
            <input
              type="text"
              v-model="projectSearchQuery"
              placeholder="Поиск по названию или руководителю..."
              class="search-input"
              @input="debouncedSearch"
              :disabled="isReadOnlyMode"
            />
            <button
              v-if="projectSearchQuery"
              @click="clearProjectSearch"
              class="search-clear"
              title="Очистить поиск"
              :disabled="isReadOnlyMode"
            >
              <XIcon class="btn-icon" />
            </button>
          </div>
        </div>

        <div class="projects-grid" v-if="searchedUnassignedProjects.length > 0">
          <div
            v-for="project in searchedUnassignedProjects"
            :key="project.ID"
            class="project-card"
            :class="{
              selected: isProjectSelected(project.ID),
              'partial-project': isPartialProject(project.ID),
              'card-readonly': isReadOnlyMode,
            }"
            @click="!isReadOnlyMode && toggleProjectExpand(project.ID)"
            :title="isReadOnlyMode ? 'Только просмотр' : ''"
          >
            <div class="project-header">
              <div
                class="project-specialization"
                v-if="getProjectSpecializationName(project.ID)"
              >
                <TagIcon class="spec-mini-icon" />
                {{ getProjectSpecializationName(project.ID) }}
              </div>

              <div class="project-checkbox">
                <input
                  type="checkbox"
                  :checked="isProjectSelected(project.ID)"
                  :disabled="isReadOnlyMode"
                  @click.stop="
                    !isReadOnlyMode && toggleProjectSelection(project.ID)
                  "
                  :title="isReadOnlyMode ? 'Только просмотр' : ''"
                />
              </div>
            </div>
            <div class="project-title">{{ project.Title }}</div>

            <div class="project-details">
              <div class="project-supervisor">
                <UserIcon class="detail-icon" />
                {{ project.Supervisor }}
              </div>

              <div
                class="project-students"
                v-if="getUnassignedStudents(project.ID).length > 0"
              >
                <UsersIcon class="detail-icon" />
                <div class="students-list">
                  <span
                    v-for="student in getUnassignedStudents(project.ID)"
                    :key="student.ID"
                    class="student-tag"
                    :class="{
                      selected: selectedStudents.includes(student.ID),
                      'tag-readonly': isReadOnlyMode,
                    }"
                    @click.stop="
                      !isReadOnlyMode && toggleStudentSelection(student.ID)
                    "
                    :title="
                      isReadOnlyMode ? 'Только просмотр' : 'Клик для выбора'
                    "
                  >
                    {{ student.Surname }} {{ student.Name?.[0] }}.
                    <span class="student-group" v-if="student.ID_Group?.Name">
                      ({{ student.ID_Group.Name }})
                    </span>
                    <input
                      type="checkbox"
                      :checked="selectedStudents.includes(student.ID)"
                      :disabled="isReadOnlyMode"
                      @click.stop="
                        !isReadOnlyMode && toggleStudentSelection(student.ID)
                      "
                      class="student-checkbox"
                    />
                  </span>
                </div>
              </div>
            </div>

            <div v-if="isPartialProject(project.ID)" class="project-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${getProjectProgress(project.ID)}%` }"
                ></div>
              </div>
              <span class="progress-text">
                {{ getAssignedCountForProject(project.ID) }}/{{
                  getTotalStudentsForProject(project.ID)
                }}
                защитились
              </span>
            </div>
          </div>
        </div>

        <div v-else class="empty-pool">
          <CheckCircleIcon class="empty-icon" />
          <p>
            {{
              projectSearchQuery
                ? "Ничего не найдено"
                : "Все проекты распределены по расписанию"
            }}
          </p>
          <button
            v-if="projectSearchQuery && !isReadOnlyMode"
            @click="clearProjectSearch"
            class="clear-search-btn"
          >
            Сбросить поиск
          </button>
        </div>

        <!-- Панель выбранных студентов: скрыта для секретаря -->
        <div
          v-if="selectedStudents.length > 0 && !isReadOnlyMode"
          class="selected-projects-panel"
        >
          <div class="selected-info">
            <span>Выбрано студентов: {{ selectedStudents.length }}</span>
            <div class="selected-actions">
              <button @click="clearSelection" class="clear-btn">
                <XIcon class="btn-icon" />
                Очистить
              </button>
              <button
                @click="showSelectedDetails = !showSelectedDetails"
                class="details-btn"
              >
                <EyeIcon class="btn-icon" />
                {{ showSelectedDetails ? "Скрыть" : "Показать" }}
              </button>
            </div>
          </div>

          <div v-if="showSelectedDetails" class="selected-list">
            <div
              v-for="studentId in selectedStudents"
              :key="studentId"
              class="selected-student-item"
            >
              {{ getStudentFullName(studentId) }}
              <span class="student-project">
                {{ getStudentProject(studentId)?.Title }}
              </span>
              <span
                class="student-group-mini"
                v-if="getStudentGroup(studentId)"
              >
                {{ getStudentGroup(studentId) }}
              </span>
              <button
                @click="toggleStudentSelection(studentId)"
                class="remove-student-btn"
              >
                <XIcon class="btn-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Расписание защит (ВИДНО ВСЕМ) -->
      <!-- Занимает всю ширину, если левая колонка скрыта -->
      <div class="defense-schedule">
        <div class="schedule-header-section">
          <h2>
            <CalendarIcon class="section-icon" />
            Расписание защит
          </h2>
          <div class="schedule-header-actions">
            <div class="date-filter">
              <label for="date-filter">Дата:</label>
              <input
                type="date"
                id="date-filter"
                v-model="selectedDate"
                @change="applyDateFilter"
                class="date-input"
                :disabled="loading"
              />
              <button
                v-if="selectedDate"
                @click="clearDateFilter"
                class="date-clear"
                title="Сбросить фильтр"
                :disabled="loading"
              >
                <XIcon class="btn-icon" />
              </button>
            </div>

            <!-- Кнопка создания: скрыта для секретаря -->
            <button
              v-if="!isReadOnlyMode"
              @click="openCreateScheduleModal"
              class="create-schedule-btn"
              :disabled="loading"
              title="Создать новое расписание защиты"
            >
              <PlusIcon class="btn-icon" />
              Создать расписание
            </button>

            <button
              @click="refreshData"
              class="refresh-btn"
              :disabled="loading"
            >
              <RefreshCwIcon class="btn-icon" :class="{ spinning: loading }" />
              Обновить
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>

        <div v-else-if="filteredSchedules.length === 0" class="empty-schedule">
          <CalendarXIcon class="empty-icon" />
          <p>
            {{
              selectedDate
                ? `Нет защит на ${formatDateInput(selectedDate)}`
                : `Нет запланированных защит на ${currentYear} год`
            }}
          </p>
          <p v-if="selectedSpecialization && !selectedDate" class="hint-text">
            Попробуйте выбрать другую программу или сбросить фильтры
          </p>
        </div>

        <div v-else class="schedule-grid">
          <div
            v-for="schedule in filteredSchedules"
            :key="schedule.ID"
            class="schedule-card"
            :class="{
              'schedule-full': getAvailableSlots(schedule) === 0,
              'card-readonly': isReadOnlyMode,
            }"
          >
            <div class="schedule-header-card">
              <div class="schedule-datetime">
                <div class="schedule-date">
                  {{ formatDate(schedule.DateTime) }}
                </div>
                <div class="schedule-time">
                  {{ formatTime(schedule.DateTime) }}
                </div>
                <div
                  v-if="!selectedSpecialization && schedule.ID_Specialization"
                  class="schedule-specialization"
                >
                  <TagIcon class="spec-mini-icon" />
                  {{ getSpecializationName(schedule.ID_Specialization) }}
                </div>
              </div>

              <div class="schedule-info">
                <div class="schedule-class">
                  <MapPinIcon class="info-icon" />
                  {{ schedule.Class }}
                </div>

                <div
                  class="schedule-capacity-wrapper"
                  style="display: flex; align-items: center; gap: 8px"
                >
                  <div class="schedule-capacity">
                    <FolderIcon class="info-icon" />
                    {{ getAssignedProjectsCount(schedule.ID) }} /
                    {{ schedule.Count }}
                    <span
                      v-if="getAvailableSlots(schedule) > 0"
                      class="slots-available"
                    >
                      (свободно: {{ getAvailableSlots(schedule) }})
                    </span>
                  </div>

                  <!-- Кнопка редактирования вместимости: скрыта для секретаря -->
                  <button
                    v-if="!isReadOnlyMode"
                    @click="openCapacityModal(schedule)"
                    class="edit-capacity-btn"
                    title="Изменить количество мест"
                  >
                    <PencilIcon class="btn-icon" />
                  </button>
                </div>

                <!-- Кнопка скачивания Word: доступна всем -->
                <button
                  @click="downloadScheduleDoc(schedule)"
                  class="download-btn"
                  title="Скачать ведомость (Word)"
                >
                  <DownloadIcon class="btn-icon" />
                  <span class="btn-text">Word</span>
                </button>
              </div>
            </div>

            <div
              class="assigned-projects"
              v-if="getAssignedProjectsData(schedule.ID).length > 0"
            >
              <div
                v-for="projectData in getAssignedProjectsData(schedule.ID)"
                :key="projectData.project.ID"
                class="assigned-project"
              >
                <div class="assigned-project-header">
                  <div class="assigned-project-title">
                    {{ projectData.project.Title }}
                  </div>
                  <!-- Кнопка удаления: скрыта для секретаря -->
                  <button
                    v-if="!isReadOnlyMode"
                    @click="
                      unassignProjectFromSchedule(projectData.project, schedule)
                    "
                    class="unassign-btn"
                    :class="{
                      'btn-disabled-graded': hasGradesInProject(projectData),
                    }"
                    :title="
                      hasGradesInProject(projectData)
                        ? 'Нельзя удалить: есть оценки'
                        : 'Убрать проект из расписания'
                    "
                    :disabled="
                      assigningProjects || hasGradesInProject(projectData)
                    "
                  >
                    <XIcon class="unassign-icon" />
                  </button>
                </div>

                <div class="assigned-project-students">
                  <span
                    v-for="student in projectData.assignedStudents"
                    :key="student.ID"
                    class="assigned-student-tag"
                  >
                    {{ student.Surname }} {{ student.Name?.[0] }}.
                    <span
                      v-if="student.ID_Group?.Name"
                      class="student-group-inline"
                    >
                      ({{ student.ID_Group.Name }})
                    </span>
                  </span>
                </div>

                <div class="assigned-project-supervisor">
                  <UserIcon class="detail-icon" />
                  {{ projectData.project.Supervisor }}
                </div>
              </div>
            </div>

            <div class="assignment-section">
              <!-- Блок назначения: скрыт для секретаря -->
              <div
                v-if="
                  !isReadOnlyMode &&
                  selectedStudents.length > 0 &&
                  getAvailableSlots(schedule) > 0
                "
                class="assign-controls"
              >
                <div class="assign-info">
                  <span>
                    Назначить
                    {{ getAssignableProjectsCount(schedule) }}
                    проект(ов)
                  </span>
                  <span class="slots-info">
                    (свободно мест: {{ getAvailableSlots(schedule) }})
                  </span>
                </div>

                <button
                  @click="assignSelectedStudentsToSchedule(schedule)"
                  class="assign-btn"
                  :class="{
                    'btn-specialty-mismatch': !isSpecializationMatch(schedule),
                  }"
                  :disabled="
                    assigningProjects ||
                    !isSpecializationMatch(schedule) ||
                    getAssignableProjectsCount(schedule) === 0
                  "
                  :title="
                    !isSpecializationMatch(schedule)
                      ? 'Специальность выбранных студентов не совпадает с расписанием'
                      : ''
                  "
                >
                  <CheckIcon class="btn-icon" />
                  {{ assigningProjects ? "Назначение..." : "Назначить" }}
                </button>
              </div>

              <!-- Сообщение для секретаря -->
              <div
                v-else-if="isReadOnlyMode"
                class="schedule-full-message"
                style="
                  background: #f0f9ff;
                  border-color: #bae6fd;
                  color: #0369a1;
                "
              >
                <InfoIcon class="full-icon" />
                <span>Режим просмотра (изменения недоступны)</span>
              </div>

              <div
                v-else-if="getAvailableSlots(schedule) === 0"
                class="schedule-full-message"
              >
                <AlertCircleIcon class="full-icon" />
                <span>Все места заняты</span>
              </div>

              <div v-else class="no-selection">
                <InfoIcon class="info-icon" />
                <span>Выберите проект для назначения</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Уведомления -->
    <div v-if="notifications.length > 0" class="notifications">
      <transition-group name="notification-slide">
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

    <!-- Модальное окно: Подтверждение отмены (скрыто для секретаря) -->
    <div
      v-if="showUnassignConfirm && !isReadOnlyMode"
      class="modal-overlay"
      @click.self="showUnassignConfirm = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>Подтверждение отмены</h3>
          <button
            @click="showUnassignConfirm = false"
            class="modal-close"
            title="Закрыть"
          >
            <XIcon class="btn-icon" />
          </button>
        </div>
        <div class="modal-body">
          <p>
            Вы действительно хотите убрать проект "{{ confirmProject?.Title }}"
            из расписания на
            {{ confirmSchedule ? formatDate(confirmSchedule.DateTime) : "" }}?
            <br /><br />
            <strong
              >Это освободит {{ confirmStudentCount }} студент(ов).</strong
            >
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showUnassignConfirm = false" class="modal-cancel">
            Отмена
          </button>
          <button @click="confirmUnassignProject" class="modal-confirm">
            Убрать из расписания
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно: Создание расписания (скрыто для секретаря) -->
    <div
      v-if="showCreateModal && !isReadOnlyMode"
      class="modal-overlay"
      @click.self="closeCreateModal"
    >
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>📅 Создать расписание защиты</h3>
          <button @click="closeCreateModal" class="modal-close" title="Закрыть">
            <XIcon class="btn-icon" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Дата и время *</label>
            <input
              type="datetime-local"
              v-model="newScheduleForm.DateTime"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Аудитория *</label>
            <input
              type="text"
              v-model="newScheduleForm.Class"
              class="form-input"
              placeholder=""
              required
            />
          </div>

          <div class="form-group">
            <label>Количество проектов в день *</label>
            <input
              type="number"
              v-model.number="newScheduleForm.Count"
              class="form-input"
              min="1"
              max="50"
              required
            />
          </div>

          <!-- ИСПРАВЛЕНО: добавлен < в начале -->
          <div class="form-group" v-if="specializations.length > 0">
            <label>
              Направление подготовки <span class="required">*</span>
            </label>
            <select
              v-model="newScheduleForm.ID_Specialization"
              class="form-input"
              required
            >
              <option :value="null" disabled>Выберите направление...</option>
              <option
                v-for="spec in availableSpecializationsForCreate"
                :key="spec.ID"
                :value="spec.ID"
              >
                {{ spec.Name }}
              </option>
            </select>
            <small class="hint required-field"
              >Поле обязательно для заполнения</small
            >
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateModal" class="modal-cancel">Отмена</button>
          <button
            @click="createSchedule"
            class="modal-confirm"
            :disabled="!isCreateFormValid || loading"
          >
            {{ loading ? "Создание..." : "Создать" }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Модальное окно: Изменение вместимости (скрыто для секретаря) -->
  <div
    v-if="showCapacityModal && editingSchedule && !isReadOnlyMode"
    class="modal-overlay"
    @click.self="closeCapacityModal"
  >
    <div class="modal">
      <div class="modal-header">
        <h3>✏️ Изменить вместимость</h3>
        <button @click="closeCapacityModal" class="modal-close" title="Закрыть">
          <XIcon class="btn-icon" />
        </button>
      </div>

      <div class="modal-body">
        <p style="margin-bottom: 1rem; color: #4b5563">
          <strong>{{ formatDate(editingSchedule.DateTime) }}</strong
          >,
          {{ editingSchedule.Class }}
        </p>

        <div class="form-group">
          <label>Максимальное количество проектов</label>
          <div class="capacity-controls">
            <button
              @click="capacityForm.Count = Math.max(1, capacityForm.Count - 1)"
              class="capacity-btn"
            >
              −
            </button>
            <input
              type="number"
              v-model.number="capacityForm.Count"
              class="form-input capacity-input"
              min="1"
              max="100"
            />
            <button
              @click="capacityForm.Count = capacityForm.Count + 1"
              class="capacity-btn"
            >
              +
            </button>
          </div>
          <small class="hint">
            Сейчас назначено:
            {{ getAssignedProjectsCount(editingSchedule.ID) }}
          </small>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeCapacityModal" class="modal-cancel">Отмена</button>
        <button
          @click="updateScheduleCapacity"
          class="modal-confirm"
          :disabled="loading"
        >
          {{ loading ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import api from "@/services/api";
import {
  CalendarIcon,
  FolderIcon,
  UserIcon,
  UsersIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  CalendarXIcon,
  MapPinIcon,
  AlertCircleIcon,
  XIcon,
  InfoIcon,
  CheckIcon,
  EyeIcon,
  TagIcon,
  SearchIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  DownloadIcon,
} from "lucide-vue-next";

// === STATE: DATA ===
const defenseSchedules = ref([]);
const projects = ref([]);
const students = ref([]);
const protocols = ref([]);
const specializations = ref([]);
const specializationNames = ref({});
const selectedStudents = ref([]);
const assigningProjects = ref(false);
const loading = ref(false);
const notifications = ref([]);
const abortController = ref(null);

// === STATE: ROLE & ACCESS ===
const currentUser = ref(null);
const isSecretary = ref(false);
const isAdmin = ref(false);
const secretaryId = ref(null);
const secretarySpecializations = ref([]); // Массив ID специальностей
const secretarySpecializationsMap = ref({}); // Карта ID -> Name

// === STATE: UI ===
const currentYear = new Date().getFullYear();
const selectedSpecialization = ref(null);
const selectedDate = ref(null);
const projectSearchQuery = ref("");
const searchTimeout = ref(null);
const showPartialOnly = ref(false);
const expandedProjects = ref([]);
const showSelectedDetails = ref(false);
const showUnassignConfirm = ref(false);
const confirmProject = ref(null);
const confirmSchedule = ref(null);
const confirmStudentCount = ref(0);
const showCreateModal = ref(false);
const showCapacityModal = ref(false);
const editingSchedule = ref(null);
const newScheduleForm = ref({
  DateTime: "",
  Class: "",
  Count: 1,
  ID_Specialization: null,
});
const capacityForm = ref({ Count: 1 });

// === COMPUTED: ROLE & ACCESS ===

// Read-only режим для секретаря
const isReadOnlyMode = computed(() => isSecretary.value);

// Список специальностей для фильтра (админ — все, секретарь — только свои)
const availableSpecializations = computed(() => {
  // Если секретарь и у него есть список ограничений
  if (isSecretary.value && secretarySpecializations.value.length > 0) {
    return specializations.value.filter((spec) =>
      secretarySpecializations.value.includes(spec.ID)
    );
  }
  // Иначе (админ или нет ограничений) — показываем все
  return specializations.value;
});

// === COMPUTED: DATA FILTERING ===

const sortedSchedules = computed(() =>
  [...defenseSchedules.value].sort(
    (a, b) => new Date(a.DateTime) - new Date(b.DateTime)
  )
);

const filteredSchedules = computed(() => {
  let result = sortedSchedules.value;

  if (selectedDate.value) {
    result = result.filter((s) => {
      const d = new Date(s.DateTime);
      const sel = new Date(selectedDate.value);
      return (
        d.getFullYear() === sel.getFullYear() &&
        d.getMonth() === sel.getMonth() &&
        d.getDate() === sel.getDate()
      );
    });
  }

  if (selectedSpecialization.value) {
    result = result.filter(
      (s) => s.ID_Specialization === selectedSpecialization.value
    );
  } else if (isSecretary.value && secretarySpecializations.value.length > 0) {
    // Секретарь видит расписания ТОЛЬКО своих специальностей + общие (null)
    result = result.filter((s) => {
      const specId =
        typeof s.ID_Specialization === "object"
          ? s.ID_Specialization?.ID
          : s.ID_Specialization;
      return !specId || secretarySpecializations.value.includes(specId);
    });
  }

  return result;
});

const protocolsFiltered = computed(() => {
  let result = protocols.value.filter((p) => p.Year === currentYear);
  if (selectedSpecialization.value) {
    result = result.filter(
      (p) =>
        p.ID_Student?.ID_Specialization?.ID === selectedSpecialization.value
    );
  } else if (isSecretary.value && secretarySpecializations.value.length > 0) {
    result = result.filter((p) => {
      const specId = p.ID_Student?.ID_Specialization?.ID;
      return !specId || secretarySpecializations.value.includes(specId);
    });
  }
  return result;
});

const studentsFiltered = computed(() => {
  let result = students.value;
  if (selectedSpecialization.value) {
    result = result.filter(
      (s) => s.ID_Specialization?.ID === selectedSpecialization.value
    );
  } else if (isSecretary.value && secretarySpecializations.value.length > 0) {
    result = result.filter((s) => {
      const specId = s.ID_Specialization?.ID;
      return !specId || secretarySpecializations.value.includes(specId);
    });
  }
  return result;
});

const projectsFiltered = computed(() => {
  if (!selectedSpecialization.value) return projects.value;
  const ids = new Set(
    studentsFiltered.value
      .filter((s) => s.ID_Project?.ID)
      .map((s) => s.ID_Project.ID)
  );
  return projects.value.filter((p) => ids.has(p.ID));
});

const searchedProjects = computed(() => {
  if (!projectSearchQuery.value.trim()) return projectsFiltered.value;
  const q = projectSearchQuery.value.toLowerCase().trim();
  return projectsFiltered.value.filter(
    (p) =>
      p.Title?.toLowerCase().includes(q) ||
      p.Supervisor?.toLowerCase().includes(q)
  );
});

const getProjectSpecializationName = (projectId) => {
  const unassigned = getUnassignedStudents(projectId);
  if (!unassigned.length) return "";
  const specId = unassigned[0]?.ID_Specialization?.ID;
  return getSpecializationName(specId);
};

const studentsByProject = computed(() => {
  const map = new Map();
  studentsFiltered.value.forEach((s) => {
    if (s.ID_Project?.ID) {
      if (!map.has(s.ID_Project.ID)) map.set(s.ID_Project.ID, []);
      map.get(s.ID_Project.ID).push(s);
    }
  });
  return map;
});

const getCurrentSpecializationName = computed(() => {
  if (!selectedSpecialization.value) return "";
  const spec = specializations.value.find(
    (s) => s.ID === selectedSpecialization.value
  );
  return spec ? spec.Name : "";
});

const unassignedProjects = computed(() => {
  const result = [];
  searchedProjects.value.forEach((project) => {
    const ps = studentsByProject.value.get(project.ID) || [];
    if (!ps.length) return;
    const unassigned = ps.filter((s) => {
      const p = protocolsFiltered.value.find(
        (pr) => pr.ID_Student?.ID === s.ID
      );
      return !p || !p.ID_DefenseSchedule;
    });
    if (unassigned.length > 0)
      result.push({
        ...project,
        _unassignedStudents: unassigned,
        _allStudents: ps,
      });
  });
  return result;
});

const filteredUnassignedProjects = computed(() => {
  if (!showPartialOnly.value) return unassignedProjects.value;
  return unassignedProjects.value.filter((p) => {
    const total = p._allStudents?.length || 0;
    const unassigned = p._unassignedStudents?.length || 0;
    return unassigned > 0 && unassigned < total;
  });
});

const searchedUnassignedProjects = computed(() =>
  projectSearchQuery.value.trim()
    ? unassignedProjects.value
    : filteredUnassignedProjects.value
);

// === HELPERS ===

const getSpecializationName = (specId) => {
  if (secretarySpecializationsMap.value[specId]) {
    return secretarySpecializationsMap.value[specId];
  }
  return (
    specializationNames.value[specId] || (specId ? `Программа #${specId}` : "")
  );
};

const getUnassignedStudents = (id) =>
  unassignedProjects.value.find((p) => p.ID === id)?._unassignedStudents || [];

const getTotalStudentsForProject = (id) =>
  unassignedProjects.value.find((p) => p.ID === id)?._allStudents?.length || 0;

const getAssignedCountForProject = (id) =>
  getTotalStudentsForProject(id) - getUnassignedStudents(id).length;

const getProjectProgress = (id) => {
  const t = getTotalStudentsForProject(id);
  return t ? Math.round((getAssignedCountForProject(id) / t) * 100) : 0;
};

const isPartialProject = (id) => {
  const a = getAssignedCountForProject(id);
  const t = getTotalStudentsForProject(id);
  return a > 0 && a < t;
};

const getAssignedProjectsData = (scheduleId) => {
  const map = new Map();
  protocolsFiltered.value
    .filter((p) => p.ID_DefenseSchedule?.ID === scheduleId)
    .forEach((pr) => {
      const st = pr.ID_Student;
      const proj = st?.ID_Project;
      if (!proj?.ID || !st) return;
      if (!map.has(proj.ID))
        map.set(proj.ID, {
          project: { ...proj },
          assignedStudents: [],
          protocols: [],
        });
      if (!map.get(proj.ID).assignedStudents.some((s) => s.ID === st.ID))
        map.get(proj.ID).assignedStudents.push(st);
      map.get(proj.ID).protocols.push(pr);
    });
  return Array.from(map.values());
};

const getAssignedProjectsCount = (id) => getAssignedProjectsData(id).length;
const getAvailableSlots = (sch) => sch.Count - getAssignedProjectsCount(sch.ID);

const hasGradesInProject = (projectData) => {
  if (!projectData || !projectData.protocols) return false;
  return projectData.protocols.some((pr) => pr.Grade && pr.Grade.trim() !== "");
};

const isSpecializationMatch = (schedule) => {
  if (selectedStudents.value.length === 0) return true;
  const scheduleSpec =
    typeof schedule.ID_Specialization === "object"
      ? schedule.ID_Specialization?.ID
      : schedule.ID_Specialization;
  if (!scheduleSpec) return true;
  return selectedStudents.value.every((stId) => {
    const st = students.value.find((s) => s.ID === stId);
    return st?.ID_Specialization?.ID === scheduleSpec;
  });
};

const getAssignableProjectsCount = (schedule) => {
  const available = getAvailableSlots(schedule);
  const projectIds = new Set();
  const scheduleSpec =
    typeof schedule.ID_Specialization === "object"
      ? schedule.ID_Specialization?.ID
      : schedule.ID_Specialization;

  selectedStudents.value.forEach((stId) => {
    const st = students.value.find((s) => s.ID === stId);
    if (scheduleSpec && st?.ID_Specialization?.ID !== scheduleSpec) return;
    const pr = protocolsFiltered.value.find((p) => p.ID_Student?.ID === stId);
    if (st?.ID_Project?.ID && (!pr || !pr.ID_DefenseSchedule)) {
      projectIds.add(st.ID_Project.ID);
    }
  });
  return Math.min(projectIds.size, available);
};

const isProjectSelected = (pid) =>
  selectedStudents.value.some(
    (sid) =>
      studentsFiltered.value.find((s) => s.ID === sid)?.ID_Project?.ID === pid
  );

const getStudentFullName = (id) => {
  const s = students.value.find((x) => x.ID === id);
  return s ? `${s.Surname} ${s.Name || ""} ${s.Patronymic || ""}`.trim() : "";
};

const getStudentProject = (id) =>
  students.value.find((s) => s.ID === id)?.ID_Project || null;

const getStudentGroup = (id) =>
  students.value.find((s) => s.ID === id)?.ID_Group?.Name || null;

// === ACTIONS: SELECTION ===

const toggleProjectSelection = (pid) => {
  if (isReadOnlyMode.value) return;
  const ids = getUnassignedStudents(pid).map((s) => s.ID);
  const all = ids.every((id) => selectedStudents.value.includes(id));
  selectedStudents.value = all
    ? selectedStudents.value.filter((id) => !ids.includes(id))
    : [...new Set([...selectedStudents.value, ...ids])];
};

const toggleStudentSelection = (id) => {
  if (isReadOnlyMode.value) return;
  const i = selectedStudents.value.indexOf(id);
  i > -1
    ? selectedStudents.value.splice(i, 1)
    : selectedStudents.value.push(id);
};

const clearSelection = () => {
  if (isReadOnlyMode.value) return;
  selectedStudents.value = [];
};

const toggleProjectExpand = (pid) => {
  if (isReadOnlyMode.value) return;
  const i = expandedProjects.value.indexOf(pid);
  i > -1
    ? expandedProjects.value.splice(i, 1)
    : expandedProjects.value.push(pid);
};

// === SEARCH & FILTERS ===

const debouncedSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {}, 300);
};

const clearProjectSearch = () => {
  if (isReadOnlyMode.value) return;
  projectSearchQuery.value = "";
};

const applyDateFilter = () =>
  addNotification(
    selectedDate.value
      ? `Показаны защиты на ${formatDateInput(selectedDate.value)}`
      : "Фильтр по дате сброшен",
    "info"
  );

const clearDateFilter = () => {
  selectedDate.value = null;
  addNotification("Фильтр по дате сброшен", "info");
};

const clearSpecializationFilter = () => {
  selectedSpecialization.value = null;
  applySpecializationFilter();
};

// === API: USER ROLE INIT ===

const initUserRole = async () => {
  try {
    const userResponse = await api.get("/api/auth/me/", {
      signal: abortController.value?.signal,
    });
    currentUser.value = userResponse.data;

    const login = (
      currentUser.value.login ||
      currentUser.value.username ||
      ""
    ).toLowerCase();

    console.log("👤 Текущий пользователь:", currentUser.value);
    console.log("🔑 Логин:", login);

    // Жесткая проверка по логину
    if (login === "admin") {
      isAdmin.value = true;
      isSecretary.value = false;
      console.log("✅ Роль: АДМИН");
    } else {
      // Все остальные пользователи считаются секретарями/пользователями с ограниченным доступом
      isAdmin.value = false;
      isSecretary.value = true;
      console.log("✅ Роль: СЕКРЕТАРЬ (или пользователь)");
    }

    secretaryId.value = currentUser.value.ID;

    // Загружаем данные
    await loadSpecializations();

    if (isSecretary.value && secretaryId.value) {
      await loadSecretarySpecializations(secretaryId.value);
      addNotification("Режим просмотра (Секретарь)", "info");
    } else {
      addNotification("Режим администратора", "success");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("❌ Ошибка инициализации пользователя:", error);
      // В случае ошибки безопаснее закрыть доступ к редактированию
      isSecretary.value = true;
      isAdmin.value = false;
      await loadSpecializations();
    }
  }
};

// === API: LOAD SECRETARY SPECIALIZATIONS ===
// 🔥 ИСПРАВЛЕНО: Корректная обработка вложенной структуры ID_Specialization
const loadSecretarySpecializations = async (userId) => {
  if (!userId) return [];
  try {
    const response = await api.get("/api/secretary_specialization/", {
      params: {
        ID_Secretary: userId,
        specialization_status: true,
      },
      signal: abortController.value?.signal,
    });

    const data = response.data.results || response.data || [];

    // Извлекаем ID специальностей из вложенного объекта
    const ids = [];
    const map = {};

    data.forEach((item) => {
      // Проверяем структуру: item.ID_Specialization.ID
      if (item.ID_Specialization && item.ID_Specialization.ID) {
        const specId = item.ID_Specialization.ID;
        const specName = item.ID_Specialization.Name;

        ids.push(specId);
        map[specId] = specName;
      }
    });

    secretarySpecializations.value = ids;
    secretarySpecializationsMap.value = map;

    console.log("🎓 Специальности секретаря (IDs):", ids);
    console.log("🎓 Карта имен:", map);

    return ids;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки специальностей секретаря:", error);
      addNotification("Не удалось загрузить ваши направления", "error");
    }
    return [];
  }
};

// === API: LOAD DATA ===

const loadSpecializations = async () => {
  try {
    let response;

    // Сначала всегда загружаем полный список для маппинга имен
    response = await api.get("/api/specializations/", {
      params: {
        page_size: 100,
        Status: true,
        signal: abortController.value?.signal,
      },
    });

    const d = response.data.results || response.data;
    specializations.value = d.sort((a, b) => a.Name.localeCompare(b.Name));
    d.forEach((s) => {
      specializationNames.value[s.ID] = s.Name;
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки специализаций:", error);
      addNotification("Не удалось загрузить список программ", "error");
    }
  }
};

const loadDefenseSchedules = async () => {
  try {
    let all = [],
      page = 1,
      more = true;
    while (more) {
      const p = { page_size: 100, page, signal: abortController.value?.signal };
      if (selectedSpecialization.value)
        p.specialization_id = selectedSpecialization.value;
      const r = await api.get("/api/defenses/", { params: p });
      const d = r.data.results || r.data;
      all = [...all, ...d];
      more = !!r.data.next;
      page++;
      if (more) await new Promise((res) => setTimeout(res, 100));
    }
    defenseSchedules.value = all.filter(
      (s) => new Date(s.DateTime).getFullYear() === currentYear
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки расписания:", error);
      addNotification("Ошибка загрузки расписания защит", "error");
    }
  }
};

const loadProjects = async () => {
  try {
    let all = [],
      page = 1,
      more = true;
    while (more) {
      const r = await api.get("/api/projects/", {
        params: { page_size: 100, page, signal: abortController.value?.signal },
      });
      const d = r.data.results || r.data;
      all = [...all, ...d];
      more = !!r.data.next;
      page++;
      if (more) await new Promise((res) => setTimeout(res, 100));
    }
    projects.value = all;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки проектов:", error);
      addNotification("Ошибка загрузки проектов", "error");
    }
  }
};

const loadStudents = async () => {
  try {
    let all = [],
      page = 1,
      more = true;
    while (more) {
      const r = await api.get("/api/students/", {
        params: { page_size: 100, page, signal: abortController.value?.signal },
      });
      const d = r.data.results || r.data;
      all = [...all, ...d];
      more = !!r.data.next;
      page++;
      if (more) await new Promise((res) => setTimeout(res, 100));
    }
    students.value = all;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки студентов:", error);
      addNotification("Ошибка загрузки студентов", "error");
    }
  }
};

const loadProtocols = async () => {
  try {
    let all = [],
      page = 1,
      more = true;
    while (more) {
      const r = await api.get("/api/protocols/", {
        params: {
          page_size: 100,
          page,
          Year: currentYear,
          signal: abortController.value?.signal,
        },
      });
      const d = r.data.results || r.data;
      all = [...all, ...d];
      more = !!r.data.next;
      page++;
      if (more) await new Promise((res) => setTimeout(res, 100));
    }
    protocols.value = all;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки протоколов:", error);
      if (protocols.value.length === 0)
        addNotification("Ошибка загрузки протоколов", "error");
    }
  }
};

const applySpecializationFilter = async () => {
  if (isReadOnlyMode.value) return;
  loading.value = true;
  try {
    await Promise.all([loadProtocols(), loadDefenseSchedules()]);
    addNotification(
      selectedSpecialization.value
        ? `Показаны данные для: ${getCurrentSpecializationName.value}`
        : "Показаны все программы",
      "info"
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка применения фильтра:", error);
      addNotification("Ошибка применения фильтра", "error");
    }
  } finally {
    loading.value = false;
  }
};

// === ASSIGN / UNASSIGN (with role checks) ===

const assignSelectedStudentsToSchedule = async (schedule) => {
  if (isReadOnlyMode.value) {
    addNotification("У вас нет прав для назначения проектов", "error");
    return;
  }

  const available = getAvailableSlots(schedule);
  if (
    available <= 0 ||
    selectedStudents.value.length === 0 ||
    !isSpecializationMatch(schedule)
  )
    return;

  assigningProjects.value = true;
  try {
    const projectMap = new Map();
    const scheduleSpec =
      typeof schedule.ID_Specialization === "object"
        ? schedule.ID_Specialization?.ID
        : schedule.ID_Specialization;

    selectedStudents.value.forEach((stId) => {
      const st = students.value.find((s) => s.ID === stId);
      if (scheduleSpec && st?.ID_Specialization?.ID !== scheduleSpec) return;
      const pr = protocolsFiltered.value.find((p) => p.ID_Student?.ID === stId);
      if (st?.ID_Project?.ID && (!pr || !pr.ID_DefenseSchedule)) {
        if (!projectMap.has(st.ID_Project.ID))
          projectMap.set(st.ID_Project.ID, []);
        projectMap.get(st.ID_Project.ID).push(stId);
      }
    });

    const ids = Array.from(projectMap.keys()).slice(0, available);
    let ok = 0,
      err = 0;
    for (const pid of ids) {
      for (const stId of projectMap.get(pid)) {
        const pr = protocolsFiltered.value.find(
          (p) => p.ID_Student?.ID === stId
        );
        if (!pr || !pr.ID) continue;
        try {
          await api.patch(
            `/api/protocols/${pr.ID}/`,
            { ID_DefenseSchedule: schedule.ID },
            { signal: abortController.value?.signal }
          );
          const idx = protocols.value.findIndex((p) => p.ID === pr.ID);
          if (idx > -1)
            protocols.value[idx].ID_DefenseSchedule = {
              ID: schedule.ID,
              DateTime: schedule.DateTime,
              Count: schedule.Count,
              Class: schedule.Class,
            };
          const si = selectedStudents.value.indexOf(stId);
          if (si > -1) selectedStudents.value.splice(si, 1);
          ok++;
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error(`Ошибка назначения студента ${stId}:`, error);
            err++;
          }
        }
      }
    }
    if (ok) addNotification(`Назначено ${ok} студент(ов)`, "success");
    if (err) addNotification(`Ошибка назначения ${err} студент(ов)`, "error");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Критическая ошибка назначения:", error);
      addNotification("Ошибка при назначении студентов", "error");
    }
  } finally {
    assigningProjects.value = false;
  }
};

const showUnassignConfirmation = (project, schedule) => {
  if (isReadOnlyMode.value) {
    addNotification("У вас нет прав для изменения расписания", "error");
    return;
  }

  const pData = getAssignedProjectsData(schedule.ID).find(
    (p) => p.project.ID === project.ID
  );
  if (hasGradesInProject(pData)) {
    addNotification(
      "Нельзя удалить проект, у которого уже есть оценки",
      "error"
    );
    return;
  }

  const st = pData?.assignedStudents || [];
  confirmProject.value = project;
  confirmSchedule.value = schedule;
  confirmStudentCount.value = st.length;
  showUnassignConfirm.value = true;
};
// Доступные направления для создания расписания (с учётом роли)
const availableSpecializationsForCreate = computed(() => {
  if (isSecretary.value && secretarySpecializations.value.length > 0) {
    return specializations.value.filter((spec) =>
      secretarySpecializations.value.includes(spec.ID)
    );
  }
  return specializations.value;
});
const confirmUnassignProject = async () => {
  if (!confirmProject.value || !confirmSchedule.value) {
    showUnassignConfirm.value = false;
    return;
  }
  await unassignProjectFromScheduleLogic(
    confirmProject.value,
    confirmSchedule.value
  );
  showUnassignConfirm.value = false;
};

const unassignProjectFromSchedule = (p, s) => showUnassignConfirmation(p, s);

const unassignProjectFromScheduleLogic = async (project, schedule) => {
  if (isReadOnlyMode.value) {
    addNotification("У вас нет прав для изменения расписания", "error");
    return;
  }

  assigningProjects.value = true;
  try {
    const prs = protocolsFiltered.value.filter(
      (p) =>
        p.ID_Student?.ID_Project?.ID === project.ID &&
        p.ID_DefenseSchedule?.ID === schedule.ID
    );
    let ok = 0,
      err = 0;
    for (const pr of prs) {
      try {
        await api.patch(
          `/api/protocols/${pr.ID}/`,
          { ID_DefenseSchedule: null },
          { signal: abortController.value?.signal }
        );
        const idx = protocols.value.findIndex((p) => p.ID === pr.ID);
        if (idx > -1) protocols.value[idx].ID_DefenseSchedule = null;
        ok++;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(`Ошибка отмены протокола ${pr.ID}:`, error);
          err++;
        }
      }
    }
    if (ok)
      addNotification(`Проект "${project.Title}" убран из расписания`, "info");
    if (err)
      addNotification(
        `Ошибка отмены назначения для ${err} студент(ов)`,
        "error"
      );
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Критическая ошибка отмены:", error);
      addNotification("Ошибка при отмене назначения", "error");
    }
  } finally {
    assigningProjects.value = false;
  }
};

// === MODALS (with role checks) ===

const openCreateScheduleModal = () => {
  if (isReadOnlyMode.value) return;
  newScheduleForm.value = {
    DateTime: "",
    Class: "",
    Count: 1,
    ID_Specialization: null,
  };
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};
// Строго обязательное направление
const isCreateFormValid = computed(
  () =>
    newScheduleForm.value.DateTime &&
    newScheduleForm.value.Class &&
    newScheduleForm.value.Count > 0 &&
    newScheduleForm.value.ID_Specialization
);
const createSchedule = async () => {
  if (isReadOnlyMode.value) {
    addNotification("У вас нет прав для создания расписания", "error");
    return;
  }
  if (!isCreateFormValid.value)
    return addNotification("Заполните обязательные поля", "error");

  loading.value = true;
  try {
    await api.post(
      "/api/defenses/",
      {
        ...newScheduleForm.value,
        ...(newScheduleForm.value.ID_Specialization && {
          ID_Specialization: newScheduleForm.value.ID_Specialization,
        }),
      },
      { signal: abortController.value?.signal }
    );
    addNotification("Расписание успешно создано", "success");
    closeCreateModal();
    await loadDefenseSchedules();
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка создания расписания:", error);
      addNotification(
        error.response?.data?.detail || "Не удалось создать расписание",
        "error"
      );
    }
  } finally {
    loading.value = false;
  }
};

const openCapacityModal = (s) => {
  if (isReadOnlyMode.value) return;
  editingSchedule.value = s;
  capacityForm.value.Count = s.Count;
  showCapacityModal.value = true;
};

const closeCapacityModal = () => {
  showCapacityModal.value = false;
  editingSchedule.value = null;
};

const updateScheduleCapacity = async () => {
  if (isReadOnlyMode.value) {
    addNotification("У вас нет прав для изменения вместимости", "error");
    return;
  }
  if (!editingSchedule.value || capacityForm.value.Count < 1) return;

  loading.value = true;
  try {
    await api.patch(
      `/api/defenses/${editingSchedule.value.ID}/`,
      { Count: capacityForm.value.Count },
      { signal: abortController.value?.signal }
    );
    const s = defenseSchedules.value.find(
      (x) => x.ID === editingSchedule.value.ID
    );
    if (s) s.Count = capacityForm.value.Count;
    addNotification("Вместимость обновлена", "success");
    closeCapacityModal();
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка обновления вместимости:", error);
      addNotification("Не удалось обновить вместимость", "error");
    }
  } finally {
    loading.value = false;
  }
};

// === FORMAT & NOTIFY ===

const parseDateTime = (str) => {
  if (!str) return null;
  const n = str.replace("T", " ").substring(0, 19);
  const [d, t] = n.split(" ");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t ? t.split(":").map(Number) : [0, 0];
  return {
    date: new Date(Date.UTC(y, m - 1, day)),
    h: String(h).padStart(2, "0"),
    m: String(min).padStart(2, "0"),
  };
};

const formatTime = (str) => {
  const p = parseDateTime(str);
  return p ? `${p.h}:${p.m}` : "Не указано";
};

const formatDate = (str) => {
  const p = parseDateTime(str);
  return p
    ? p.date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Не указана";
};

const formatDateInput = (str) =>
  str ? str.replace("T", " ").substring(0, 10) : "";

const addNotification = (msg, type = "info") => {
  const n = { id: Date.now() + Math.random(), message: msg, type };
  notifications.value.push(n);
  setTimeout(() => removeNotification(n.id), 5000);
};

const removeNotification = (id) => {
  const i = notifications.value.findIndex((n) => n.id === id);
  if (i > -1) notifications.value.splice(i, 1);
};

// === EXPORT TO WORD ===

const downloadScheduleDoc = async (schedule) => {
  try {
    const assignedData = getAssignedProjectsData(schedule.ID);
    if (!assignedData || assignedData.length === 0) {
      addNotification("Нет проектов для экспорта", "info");
      return;
    }

    let projectIndex = 1;
    const projectsList = [];

    assignedData.forEach((projectData) => {
      const { project, assignedStudents } = projectData;
      if (!assignedStudents?.length) return;

      assignedStudents.forEach((student, idx) => {
        const studentName = `${student.Surname || ""} ${student.Name || ""} ${
          student.Patronymic || ""
        }`.trim();
        projectsList.push({
          num: idx === 0 ? projectIndex : "",
          title: idx === 0 ? project.Title || "" : "",
          student_name: studentName,
          group: idx === 0 ? student.ID_Group?.Name || "-" : "",
        });
      });
      projectIndex++;
    });

    const data = {
      date: formatDate(schedule.DateTime),
      classroom: schedule.Class,
      projects: projectsList,
    };

    const response = await fetch("/pck/templates/temp.docx");
    if (!response.ok)
      throw new Error("Не удалось загрузить temp.docx из папки public");

    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const dateStr = new Date(schedule.DateTime).toISOString().slice(0, 10);
    saveAs(out, `Ведомость_${schedule.Class}_${dateStr}.docx`);

    addNotification("Ведомость скачана", "success");
  } catch (error) {
    console.error("Ошибка экспорта:", error);
    addNotification(`Ошибка: ${error.message}`, "error");
  }
};

// === REFRESH & LIFECYCLE ===

const refreshData = async () => {
  if (abortController.value) abortController.value.abort();
  abortController.value = new AbortController();
  loading.value = true;
  try {
    await Promise.all([
      loadSpecializations(),
      loadDefenseSchedules(),
      loadProjects(),
      loadStudents(),
      loadProtocols(),
    ]);
    addNotification("Данные обновлены", "success");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка обновления данных:", error);
      addNotification("Ошибка обновления данных", "error");
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await initUserRole();
  await refreshData();
  setTimeout(async () => {
    if (protocols.value.length === 0) await loadProtocols();
  }, 1000);
});

onUnmounted(() => {
  if (abortController.value) abortController.value.abort();
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
});
</script>

<style scoped>
.schedule-container {
  --color-primary: #4892b4; /* Основной синий (сайдбар) */
  --color-primary-hover: #3a7a99; /* Темнее при наведении */
  --color-primary-light: rgba(72, 146, 180, 0.1);
  --color-primary-border: rgba(72, 146, 180, 0.3);

  /* Зеленый оставляем только для статусов успеха/протоколов, если нужно, 
     но из кнопок и акцентов убираем */
  --color-accent: #42b983;
  --color-accent-hover: #359669;

  --color-bg: #f8fafc; /* Фон страницы */
  --color-bg-card: #ffffff; /* Фон карточек */
  --color-border: #e2e8f0; /* Границы */
  --color-text-primary: #1f2937; /* Основной текст */
  --color-text-secondary: #6b7280; /* Вторичный текст */
  --color-error: #ef4444; /* Ошибки */
  --color-error-light: #fee2e2;
  --color-warning: #f59e0b;
  --color-success: #10b981;
  --color-success-light: #d1fae5;
}

.schedule-container * {
  box-sizing: border-box;
}

/* === БАЗОВЫЕ СТИЛИ КОНТЕЙНЕРА === */
.schedule-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  background-color: var(--color-bg);
}

.schedule-header {
  margin-bottom: 2rem;
  background: var(--color-bg-card);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.schedule-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 1rem;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.year-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.year-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-primary-border);
}

.year-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-primary);
}

.projects-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--color-bg-card);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.spec-badge {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-primary-border);
}

.specialization-filter {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.spec-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.spec-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary);
}

.spec-select-wrapper {
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
}
.spec-select {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-bg-card);

  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  font-weight: 500;

  /* Гарантируем, что само поле не растягивается */
  box-sizing: border-box;
}

.spec-select:hover {
  border-color: var(--color-primary);
}

.spec-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.spec-select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.spec-select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}
.spec-clear-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.spec-clear-btn:hover:not(:disabled) {
  background: #fecaca;
}

.spec-clear-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.schedule-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.schedule-content.full-width-mode {
  grid-template-columns: 1fr;
}

/* === ПУЛ ПРОЕКТОВ === */
.unassigned-pool {
  background: var(--color-bg-card);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.pool-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-primary);
}

.pool-count {
  background: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.pool-filters {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.filter-checkbox input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.filter-checkbox input:disabled {
  cursor: not-allowed;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary);
  pointer-events: none;
}
.spec-select option {
  font-size: 0.9rem; /* Такой же шрифт, как в поле */
  padding: 8px 12px; /* Удобные отступы */
  background: white;
  color: var(--color-text-primary);

  /* Разрешаем перенос длинных названий на новую строку */
  white-space: normal !important;
  word-wrap: break-word;

  /* Ширина списка будет равна ширине поля select */
  max-width: 100%;
}
.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.search-clear {
  position: absolute;
  right: 0.25rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.search-clear:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-bg);
}

.search-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.projects-grid {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
}

.project-card {
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  background: #f1f5f9;
  border-color: var(--color-primary);
}

/* 🔵 ВЫБРАННЫЙ ПРОЕКТ - СИНИЙ */
.project-card.selected {
  background: var(--color-primary-light);
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  position: relative;
}

/* Синяя полоска слева для акцента */
.project-card.selected::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-primary);
  border-radius: 0.5rem 0 0 0.5rem;
}

/* 🔵 ЧАСТИЧНО ЗАЩИЩЕННЫЙ - ТОЖЕ СИНИЙ (вместо оранжевого) */
.project-card.partial-project {
  border-left: 4px solid var(--color-primary);
}

.project-card.card-readonly {
  cursor: default !important;
  opacity: 0.95;
}

.project-card.card-readonly:hover {
  background: var(--color-bg) !important;
  border-color: var(--color-border) !important;
  transform: none !important;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.project-specialization {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
  line-height: 1;
}

.project-specialization .spec-mini-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.project-checkbox {
  display: flex;
  align-items: center;
}

.project-checkbox input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  margin: 0;
  accent-color: var(--color-primary);
}

.project-checkbox input:disabled {
  cursor: not-allowed;
}

.project-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
  font-size: 1rem;
}

.project-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-supervisor,
.project-students {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.detail-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: var(--color-primary);
}

.students-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.student-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid var(--color-primary-border);
}

.student-tag:hover {
  background: var(--color-primary);
  color: white;
}

.student-tag.selected {
  background: var(--color-primary);
  color: white;
}

.student-tag.tag-readonly {
  cursor: default !important;
  opacity: 0.9;
}

.student-tag.tag-readonly:hover {
  background: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
  transform: none !important;
}

.student-group {
  color: var(--color-text-secondary);
  font-size: 0.625rem;
  font-weight: normal;
}

.student-checkbox {
  width: 0.75rem;
  height: 0.75rem;
  margin-left: 0.25rem;
  accent-color: var(--color-primary);
}

/* 🔵 ПРОГРЕСС-БАР - ПОЛНОСТЬЮ СИНИЙ */
.project-progress {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.selected-projects-panel {
  padding: 1rem;
  background: var(--color-primary-light);
  border-top: 1px solid var(--color-border);
}

.selected-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.selected-actions {
  display: flex;
  gap: 0.5rem;
}

.clear-btn,
.details-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.clear-btn {
  background: var(--color-error);
  color: white;
}

.clear-btn:hover {
  background: #dc2626;
}

.details-btn {
  background: var(--color-text-secondary);
  color: white;
}

.details-btn:hover {
  background: #4b5563;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
}

.selected-student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-card);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
}

.student-project {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.student-group-mini {
  background: #f1f5f9;
  color: var(--color-text-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  margin-left: 0.25rem;
}

.remove-student-btn {
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.remove-student-btn:hover {
  background: var(--color-error-light);
}

.empty-pool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
  text-align: center;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.clear-search-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-search-btn:hover {
  background: var(--color-primary-hover);
}

/* === РАСПИСАНИЕ === */
.defense-schedule {
  background: var(--color-bg-card);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.schedule-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.schedule-header-section h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.schedule-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.date-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.9rem;
  cursor: pointer;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.date-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.date-clear {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.date-clear:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-bg);
}

.date-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-schedule-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
  font-size: 0.875rem;
}

.create-schedule-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.create-schedule-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.refresh-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state,
.empty-schedule {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--color-text-secondary);
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.hint-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
}

.schedule-grid {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.schedule-card {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1rem;
  background: var(--color-bg);
  transition: border-color 0.2s;
}

.schedule-card.schedule-full {
  border-color: #fecaca;
  background: var(--color-error-light);
}

.schedule-card.card-readonly {
  opacity: 0.95;
}

.schedule-header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.schedule-datetime {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.schedule-date {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.125rem;
  text-transform: capitalize;
}

.schedule-time {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.schedule-specialization {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.25rem;
  width: fit-content;
  font-weight: 500;
}

.spec-mini-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.schedule-class,
.schedule-capacity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.info-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-primary);
}

/* 🔵 ТЕКСТ "СВОБОДНО" - СИНИЙ (как программа) */
.slots-available {
  color: var(--color-primary);
  font-weight: 500;
}

.edit-capacity-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.edit-capacity-btn:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.edit-capacity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.assigned-projects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.assigned-project {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.assigned-project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Выравнивание по верху, чтобы крестик не улетал вниз */
  gap: 12px; /* Отступ между текстом и крестиком */
  margin-bottom: 0.5rem;
  width: 100%;
}

.assigned-project-title {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  line-height: 1.4;
  flex: 1; /* Занимает все свободное место */
  min-width: 0; /* Разрешает сжатие меньше контента (важно для flex) */
  word-break: break-word; /* Переносит длинные слова */
  overflow-wrap: break-word; /* То же самое для совместимости */
}

.unassign-btn {
  flex-shrink: 0; /* 🔥 Запрещает крестику сжиматься */
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--color-text-secondary);
  transition: color 0.2s;
  margin-top: 2px; /* Чуть опустить, чтобы было по центру первой строки */
}

.unassign-btn:hover:not(:disabled) {
  color: var(--color-error);
}

.unassign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unassign-icon {
  width: 0.875rem;
  height: 0.875rem;
}
.btn-disabled-graded {
  color: var(--color-border) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.btn-disabled-graded:hover {
  background: transparent !important;
  color: var(--color-border) !important;
}

.assigned-project-students {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

/* 🔵 СТУДЕНТЫ В РАСПИСАНИИ - СИНИЕ */
.assigned-student-tag {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  border: 1px solid var(--color-primary-border);
  transition: background 0.15s, color 0.15s;
}

.assigned-student-tag:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary-hover);
}

.student-group-inline {
  color: var(--color-text-secondary);
  font-size: 0.625rem;
  font-weight: normal;
}

.assigned-project-supervisor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.assignment-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.assign-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.assign-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slots-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* 🔵 КНОПКА "НАЗНАЧИТЬ" - СИНИЯ (как программа) */
.assign-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.assign-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.assign-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-specialty-mismatch {
  background-color: #f3f4f6;
  color: var(--color-text-secondary);
  border: 1px dashed var(--color-border);
  cursor: not-allowed;
}

.btn-specialty-mismatch:hover {
  background-color: #f3f4f6;
}

.schedule-full-message,
.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.schedule-full-message {
  background: var(--color-error-light);
  border: 1px solid #fecaca;
  color: var(--color-error);
}

.no-selection {
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border);
  color: var(--color-primary);
}

.full-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-primary);
}

/* === УВЕДОМЛЕНИЯ === */
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
  animation: slideIn 0.3s ease;
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

.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from,
.notification-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-success {
  background: var(--color-success-light);
  color: #166534;
  border: 1px solid #bbf7d0;
}

.notification-error {
  background: var(--color-error-light);
  color: #991b1b;
  border: 1px solid #fecaca;
}

.notification-info {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-border);
}

.required {
  color: var(--color-error);
  font-weight: 600;
}

.required-field {
  color: var(--color-error);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

.form-input:invalid {
  border-color: #fca5a5;
}

.form-input:invalid:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
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
  color: inherit;
}

.close-icon {
  width: 1rem;
  height: 1rem;
}

/* === МОДАЛЬНЫЕ ОКНА === */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal {
  background: var(--color-bg-card);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 95%;
  max-width: 700px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-lg {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  background: var(--color-bg);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.modal-close:hover {
  color: var(--color-text-primary);
  background: var(--color-border);
}

.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
  background: var(--color-bg-card);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-group label .optional {
  font-weight: normal;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.form-input[type="number"] {
  -moz-appearance: textfield;
}

.form-input[type="number"]::-webkit-outer-spin-button,
.form-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.hint {
  display: block;
  margin-top: 0.375rem;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.3;
}

.modal-cancel,
.modal-confirm {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  min-width: 5rem;
}

.modal-cancel {
  background: #e5e7eb;
  color: var(--color-text-primary);
}

.modal-cancel:hover {
  background: #d1d5db;
}

/* 🔵 Кнопка "Создать" в модальном окне — СИНЯЯ */
.modal-confirm {
  background: var(--color-primary);
  color: white;
}

.modal-confirm:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.modal-confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.capacity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.capacity-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.capacity-btn:hover:not(:disabled) {
  background: var(--color-border);
  border-color: var(--color-text-secondary);
}

.capacity-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.capacity-input {
  width: 4rem;
  text-align: center;
  padding: 0.375rem;
}

/* === КНОПКА СКАЧИВАНИЯ WORD === */
.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.download-btn:hover {
  background: var(--color-primary-hover);
}

/* === АДАПТИВ === */
@media (max-width: 1200px) {
  .schedule-content {
    grid-template-columns: 1fr;
  }
  .schedule-container {
    padding: 1rem;
  }
  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .specialization-filter {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  .spec-select-wrapper {
    width: 100%;
    max-width: none;
  }
  .pool-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .schedule-header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  .schedule-header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .schedule-header-card {
    flex-direction: column;
    gap: 1rem;
  }
  .schedule-info {
    align-items: flex-start;
  }
  .assign-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .selected-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .schedule-header-actions {
    flex-wrap: wrap;
  }
  .create-schedule-btn {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  .modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  .modal-footer {
    flex-direction: column-reverse;
  }
  .modal-cancel,
  .modal-confirm {
    width: 100%;
  }
}
</style>
