Отличное и очень логичное ограничение! Это защитит расписание от случайной
отмены уже оцененных (завершенных) защит. Я обновил логику: 1. **Визуально:**
Кнопка удаления (крестик) теперь становится **серой и неактивной**, если у
проекта хотя бы у одного студента уже стоит оценка (`Grade`). При наведении
появится подсказка: *"Нельзя удалить проект с выставленными оценками"*. 2.
**Логически:** Даже если попытаться обойти интерфейс, функция
`unassignProjectFromSchedule` проверит наличие оценок перед отправкой запроса на
сервер. Вот полный исправленный файл: ```html
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
          <span class="stat-item projects-stat">
            <FolderIcon class="stat-icon" />
            Нераспределённых проектов: {{ filteredUnassignedProjects.length }}
          </span>
        </div>

        <div class="header-actions">
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
              >
                <option :value="null">Общее расписание</option>
                <option
                  v-for="spec in specializations"
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
            >
              <XIcon class="btn-icon" />
              Сбросить фильтр
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="schedule-content">
      <!-- Пул нераспределённых проектов -->
      <div class="unassigned-pool">
        <div class="pool-header">
          <h2>
            <FolderIcon class="section-icon" />
            Нераспределённые проекты
          </h2>
          <div class="pool-count">{{ filteredUnassignedProjects.length }}</div>
        </div>

        <div class="pool-filters">
          <label class="filter-checkbox">
            <input type="checkbox" v-model="showPartialOnly" />
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
            />
            <button
              v-if="projectSearchQuery"
              @click="clearProjectSearch"
              class="search-clear"
              title="Очистить поиск"
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
              selected: selectedStudents.some(
                (s) =>
                  students.find((st) => st.ID === s)?.ID_Project?.ID ===
                  project.ID
              ),
              'partial-project': isPartialProject(project.ID),
            }"
            @click="toggleProjectExpand(project.ID)"
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
                  @click.stop="toggleProjectSelection(project.ID)"
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
                    :class="{ selected: selectedStudents.includes(student.ID) }"
                    @click.stop="toggleStudentSelection(student.ID)"
                    title="Клик для выбора"
                  >
                    {{ student.Surname }} {{ student.Name?.[0] }}.
                    <span class="student-group" v-if="student.ID_Group?.Name">
                      ({{ student.ID_Group.Name }})
                    </span>
                    <input
                      type="checkbox"
                      :checked="selectedStudents.includes(student.ID)"
                      @click.stop="toggleStudentSelection(student.ID)"
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
            v-if="projectSearchQuery"
            @click="clearProjectSearch"
            class="clear-search-btn"
          >
            Сбросить поиск
          </button>
        </div>

        <div v-if="selectedStudents.length > 0" class="selected-projects-panel">
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

      <!-- Расписание защит -->
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
              />
              <button
                v-if="selectedDate"
                @click="clearDateFilter"
                class="date-clear"
                title="Сбросить фильтр"
              >
                <XIcon class="btn-icon" />
              </button>
            </div>

            <button
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
            :class="{ 'schedule-full': getAvailableSlots(schedule) === 0 }"
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

                <button
                  @click="openCapacityModal(schedule)"
                  class="edit-capacity-btn"
                  title="Изменить количество мест"
                >
                  <PencilIcon class="btn-icon" />
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
                  <!-- 🔥 Кнопка удаления с проверкой Grade -->
                  <button
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
              <div
                v-if="
                  selectedStudents.length > 0 && getAvailableSlots(schedule) > 0
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

    <!-- Модальное окно: Подтверждение отмены -->
    <div
      v-if="showUnassignConfirm"
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

    <!-- Модальное окно: Создание расписания -->
    <div
      v-if="showCreateModal"
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
              placeholder="Например: 301а, зал конференций"
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

          <div class="form-group" v-if="specializations.length > 0">
            <label
              >Направление подготовки
              <span class="optional">(необязательно)</span></label
            >
            <select
              v-model="newScheduleForm.ID_Specialization"
              class="form-input"
            >
              <option :value="null" disabled>Выберите направление...</option>
              <option
                v-for="spec in specializations"
                :key="spec.ID"
                :value="spec.ID"
              >
                {{ spec.Name }}
              </option>
            </select>
            <small class="hint"
              >Оставьте пустым, если расписание общее для всех программ</small
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

    <!-- Модальное окно: Изменение вместимости -->
    <div
      v-if="showCapacityModal && editingSchedule"
      class="modal-overlay"
      @click.self="closeCapacityModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>✏️ Изменить вместимость</h3>
          <button
            @click="closeCapacityModal"
            class="modal-close"
            title="Закрыть"
          >
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
                @click="
                  capacityForm.Count = Math.max(1, capacityForm.Count - 1)
                "
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
          <button @click="closeCapacityModal" class="modal-cancel">
            Отмена
          </button>
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
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
// ✅ Заменяем axios на централизованный api-инстанс
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
} from "lucide-vue-next";

// === STATE ===
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

// === COMPUTED ===
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
  }
  return result;
});

const studentsFiltered = computed(() => {
  if (!selectedSpecialization.value) return students.value;
  return students.value.filter(
    (s) => s.ID_Specialization?.ID === selectedSpecialization.value
  );
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
  return getSpecializationName(unassigned[0]?.ID_Specialization?.ID);
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
const getSpecializationName = (specId) =>
  specializationNames.value[specId] || (specId ? `Программа #${specId}` : "");
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

// === ACTIONS ===
const toggleProjectSelection = (pid) => {
  const ids = getUnassignedStudents(pid).map((s) => s.ID);
  const all = ids.every((id) => selectedStudents.value.includes(id));
  selectedStudents.value = all
    ? selectedStudents.value.filter((id) => !ids.includes(id))
    : [...new Set([...selectedStudents.value, ...ids])];
};
const toggleStudentSelection = (id) => {
  const i = selectedStudents.value.indexOf(id);
  i > -1
    ? selectedStudents.value.splice(i, 1)
    : selectedStudents.value.push(id);
};
const clearSelection = () => {
  selectedStudents.value = [];
};
const toggleProjectExpand = (pid) => {
  const i = expandedProjects.value.indexOf(pid);
  i > -1
    ? expandedProjects.value.splice(i, 1)
    : expandedProjects.value.push(pid);
};

const debouncedSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {}, 300);
};
const clearProjectSearch = () => {
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

// === API LOADERS ===
// ✅ Функция getApiBaseUrl() больше не нужна — baseURL настроен в api.js

const loadSpecializations = async () => {
  try {
    // ✅ Заменено: axios + getApiBaseUrl() → api + относительный путь
    const r = await api.get("/api/specializations/", {
      params: {
        page_size: 100,
        Status: true,
        signal: abortController.value?.signal, // ✅ signal поддерживается axios/api
      },
    });
    const d = r.data.results || r.data;
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
      // ✅ Заменено: axios.get(`${getApiBaseUrl()}/...`) → api.get("/...")
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
      // ✅ Заменено: axios → api
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

// === ASSIGN / UNASSIGN ===
const assignSelectedStudentsToSchedule = async (schedule) => {
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
          // ✅ Заменено: axios.patch + хардкод → api.patch + относительный путь
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

// === MODALS ===
const openCreateScheduleModal = () => {
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
const isCreateFormValid = computed(
  () =>
    newScheduleForm.value.DateTime &&
    newScheduleForm.value.Class &&
    newScheduleForm.value.Count > 0
);

const createSchedule = async () => {
  if (!isCreateFormValid.value)
    return addNotification("Заполните обязательные поля", "error");
  loading.value = true;
  try {
    // ✅ Заменено: axios.post + хардкод → api.post + относительный путь
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
  editingSchedule.value = s;
  capacityForm.value.Count = s.Count;
  showCapacityModal.value = true;
};
const closeCapacityModal = () => {
  showCapacityModal.value = false;
  editingSchedule.value = null;
};

const updateScheduleCapacity = async () => {
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
/* === БАЗОВЫЕ === */
.schedule-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}
.schedule-container * {
  box-sizing: border-box;
}
.schedule-header {
  margin-bottom: 2rem;
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}
.schedule-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
}
.header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
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
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}
.year-icon {
  width: 1.25rem;
  height: 1.25rem;
}
.projects-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f8fafc;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}
.spec-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  color: #374151;
}
.spec-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
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
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.95rem;
  color: #1f2937;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  font-weight: 500;
}
.spec-select:hover {
  border-color: #9ca3af;
}
.spec-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.spec-select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6b7280;
}
.spec-clear-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.spec-clear-btn:hover {
  background: #fecaca;
}
.schedule-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

/* === ПУЛ === */
.unassigned-pool {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
.pool-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}
.section-icon {
  width: 1.25rem;
  height: 1.25rem;
}
.pool-count {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}
.pool-filters {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
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
  color: #374151;
  cursor: pointer;
}
.filter-checkbox input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
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
  color: #9ca3af;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.search-clear {
  position: absolute;
  right: 0.25rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}
.search-clear:hover {
  color: #6b7280;
  background: #f3f4f6;
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
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.project-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.project-card.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.project-card.partial-project {
  border-left: 4px solid #f59e0b;
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
}
.project-title {
  font-weight: 600;
  color: #1f2937;
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
  color: #6b7280;
}
.detail-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
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
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.student-tag:hover {
  background: #bfdbfe;
}
.student-tag.selected {
  background: #3b82f6;
  color: white;
}
.student-group {
  color: #6b7280;
  font-size: 0.625rem;
  font-weight: normal;
}
.student-checkbox {
  width: 0.75rem;
  height: 0.75rem;
  margin-left: 0.25rem;
}
.project-progress {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}
.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
}
.selected-projects-panel {
  padding: 1rem;
  background: #eff6ff;
  border-top: 1px solid #e5e7eb;
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
}
.clear-btn {
  background: #ef4444;
  color: white;
}
.clear-btn:hover {
  background: #dc2626;
}
.details-btn {
  background: #6b7280;
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
  background: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}
.student-project {
  color: #6b7280;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}
.student-group-mini {
  background: #f1f5f9;
  color: #475569;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  margin-left: 0.25rem;
}
.remove-student-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}
.remove-student-btn:hover {
  background: #fee2e2;
}
.empty-pool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
  text-align: center;
}
.empty-icon {
  width: 3rem;
  height: 3rem;
  color: #10b981;
  margin-bottom: 1rem;
}
.clear-search-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}
.clear-search-btn:hover {
  background: #2563eb;
}

/* === РАСПИСАНИЕ === */
.defense-schedule {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.schedule-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  gap: 1rem;
}
.schedule-header-section h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
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
  color: #6b7280;
}
.date-input {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  cursor: pointer;
}
.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.date-clear {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}
.date-clear:hover {
  color: #6b7280;
  background: #f3f4f6;
}
.create-schedule-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
  font-size: 0.875rem;
}
.create-schedule-btn:hover:not(:disabled) {
  background: #059669;
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
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}
.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
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
  color: #6b7280;
  text-align: center;
}
.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
.hint-text {
  font-size: 0.875rem;
  color: #9ca3af;
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
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  background: #fafafa;
  transition: border-color 0.2s;
}
.schedule-card.schedule-full {
  border-color: #fecaca;
  background: #fef2f2;
}
.schedule-header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.schedule-datetime {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.schedule-date {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
  text-transform: capitalize;
}
.schedule-time {
  color: #6b7280;
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
  color: #6b7280;
}
.info-icon {
  width: 0.875rem;
  height: 0.875rem;
}
.slots-available {
  color: #10b981;
  font-weight: 500;
}
.edit-capacity-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}
.edit-capacity-btn:hover {
  color: #3b82f6;
  background: #eff6ff;
}
.assigned-projects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.assigned-project {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
}
.assigned-project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.assigned-project-title {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.unassign-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  transition: color 0.2s;
}
.unassign-btn:hover:not(:disabled) {
  color: #e53e3e;
}
.unassign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.unassign-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* 🔥 Стиль для заблокированной кнопки удаления */
.btn-disabled-graded {
  color: #d1d5db !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}
.btn-disabled-graded:hover {
  background: transparent !important;
  color: #d1d5db !important;
}

.assigned-project-students {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}
.assigned-student-tag {
  background: #d1fae5;
  color: #065f46;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
}
.student-group-inline {
  color: #6b7280;
  font-size: 0.625rem;
  font-weight: normal;
}
.assigned-project-supervisor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}
.assignment-section {
  border-top: 1px solid #e5e7eb;
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
  color: #6b7280;
}
.assign-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.assign-btn:hover:not(:disabled) {
  background: #059669;
}
.assign-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.btn-specialty-mismatch {
  background-color: #f3f4f6;
  color: #9ca3af;
  border: 1px dashed #d1d5db;
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
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}
.no-selection {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
}
.full-icon {
  width: 1rem;
  height: 1rem;
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
  background: white;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.modal-lg {
  max-width: 520px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}
.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
}
.modal-close:hover {
  color: #1f2937;
  background: #f3f4f6;
}
.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
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
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}
.form-group label .optional {
  font-weight: normal;
  color: #6b7280;
  font-size: 0.8rem;
}
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
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
  color: #6b7280;
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
  color: #374151;
}
.modal-cancel:hover {
  background: #d1d5db;
}
.modal-confirm {
  background: #3b82f6;
  color: white;
}
.modal-confirm:hover:not(:disabled) {
  background: #2563eb;
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
  border: 1px solid #cbd5e1;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}
.capacity-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}
.capacity-input {
  width: 4rem;
  text-align: center;
  padding: 0.375rem;
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
```
