<template>
  <div class="project-defense-container">
    <ProjectFilter
      v-if="!showProjects"
      @filter-applied="handleFilterApplied"
      @filters-reset="resetProjects"
    />

    <div v-if="showProjects" class="project-defense-wrapper">
      <!-- Панель фильтров -->
      <div class="filter-summary">
        <div class="filter-info">
          <div class="filter-badge">
            <span class="filter-icon">🎓</span>
            <span>{{ activeFilters.specializationName }}</span>
          </div>
          <div class="filter-badge">
            <span class="filter-icon">👥</span>
            <span>{{ activeFilters.commissionName }}</span>
          </div>
          <div class="filter-badge">
            <span class="filter-icon">🗓️</span>
            <span>{{ formatDateTime(activeFilters.scheduleDateTime) }}</span>
          </div>
        </div>
        <div class="filter-actions">
          <button @click="backToFilters" class="back-button">
            <span class="button-icon">↩️</span>
            Изменить параметры
          </button>
          <!-- Кнопка "Оценивание" -->
          <button @click="openGradingModal" class="grade-button">
            <span class="button-icon">📊</span>
            Оценивание
          </button>
        </div>
      </div>

      <div class="project-defense">
        <h2>Защита проектов</h2>

        <div v-if="error" class="alert alert-error">
          <div class="alert-icon">⚠️</div>
          <div>{{ error }}</div>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Загрузка проектов...</p>
        </div>

        <!-- Таблица проектов (оставляем как есть) -->
        <div v-else-if="projects.length > 0" class="projects-table-container">
          <table class="projects-table">
            <thead>
              <tr>
                <th>Название проекта</th>
                <th>Руководитель</th>
                <th>Статус</th>
                <th>Вопросы</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="project in projects"
                :key="project.ID"
                @click="showProjectDetails(project)"
                class="clickable-row"
              >
                <td>{{ project.Title }}</td>
                <td>{{ project.Supervisor }}</td>
                <td>
                  <span
                    :class="[
                      'status-badge',
                      getProjectStatusClass(project.Status),
                    ]"
                  >
                    <span class="status-icon">{{
                      getProjectStatusIcon(project.Status)
                    }}</span>
                    {{ getProjectStatusText(project.Status) }}
                  </span>
                </td>
                <td>
                  <button
                    @click.stop="openQuestionsModal(project)"
                    class="action-button questions-button"
                  >
                    <span class="icon">👁️</span>
                    <span class="button-text">Вопросы</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-data-container">
          <div class="no-data-icon">📋</div>
          <p>Проекты не найдены</p>
        </div>

        <!-- Модальное окно деталей проекта (оставляем как есть) -->
        <div v-if="selectedProject" class="modal-overlay" @click="closeModal">
          <div class="modal-content project-details-modal" @click.stop>
            <div class="modal-header">
              <div class="modal-title">
                <div class="modal-icon">🎓</div>
                <h3>Информация о проекте</h3>
              </div>
              <button class="close-button" @click="closeModal">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="project-details">
              <div class="project-title-card">
                <h4>{{ selectedProject.Title }}</h4>
                <h5>Руководитель: {{ selectedProject.Supervisor }}</h5>
              </div>
              <div class="detail-card students-card">
                <div class="detail-card-header">
                  <div class="detail-card-icon">👨‍🎓</div>
                  <div class="detail-card-title">Студенты</div>
                </div>
                <div class="detail-card-content">
                  <div
                    v-if="studentsLoading[selectedProject.ID]"
                    class="loading-indicator"
                  >
                    <div class="loading-spinner-small"></div>
                  </div>
                  <ul
                    v-else-if="
                      students[selectedProject.ID] &&
                      students[selectedProject.ID].length > 0
                    "
                    class="students-detail-list"
                  >
                    <li
                      v-for="student in students[selectedProject.ID]"
                      :key="student.ID"
                    >
                      <div class="student-fio">
                        {{ student.Surname }} {{ student.Name }}
                        {{ student.Patronymic }}
                      </div>
                      <div v-if="student.ID_Group" class="student-group">
                        {{ student.ID_Group.Name }}
                      </div>
                    </li>
                  </ul>
                  <div v-else class="no-data">Нет студентов</div>
                </div>
              </div>
              <div class="detail-card time-card">
                <div class="detail-card-header">
                  <div class="detail-card-icon">⏰</div>
                  <div class="detail-card-title">Время защиты</div>
                </div>
                <div class="detail-card-content">
                  <div class="time-inputs">
                    <div class="time-input-group">
                      <label for="start-time">Время начала:</label>
                      <input
                        type="time"
                        id="start-time"
                        :value="
                          formatTimeForInput(selectedProject.DefenseStartTime)
                        "
                        @change="
                          updateProjectTime(
                            selectedProject,
                            'start',
                            $event.target.value
                          )
                        "
                        class="time-input"
                      />
                    </div>
                    <div class="time-input-group">
                      <label for="end-time">Время окончания:</label>
                      <input
                        type="time"
                        id="end-time"
                        :value="
                          formatTimeForInput(selectedProject.DefenseEndTime)
                        "
                        @change="
                          updateProjectTime(
                            selectedProject,
                            'end',
                            $event.target.value
                          )
                        "
                        class="time-input"
                      />
                    </div>
                  </div>
                  <div class="time-actions">
                    <button
                      @click="cancelDefense(selectedProject)"
                      class="cancel-defense-button"
                      v-if="selectedProject.Status !== 'Защита не начата'"
                    >
                      <span class="button-icon">❌</span>
                      Отменить защиту
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="selectedProject.Status === 'Защита не начата'"
                class="start-defense-card"
              >
                <div class="detail-card-header">
                  <div class="detail-card-icon">▶️</div>
                  <div class="detail-card-title">Начало защиты</div>
                </div>
                <div class="detail-card-content">
                  <div class="start-defense-content">
                    <p>
                      Защита проекта еще не начата. Нажмите кнопку ниже, чтобы
                      начать защиту.
                    </p>
                    <button
                      @click="startDefense(selectedProject)"
                      class="start-defense-button-modal"
                      :disabled="startingDefense[selectedProject.ID]"
                    >
                      <span class="button-icon">{{
                        startingDefense[selectedProject.ID] ? "⏳" : "▶️"
                      }}</span>
                      {{
                        startingDefense[selectedProject.ID]
                          ? "Начинаем..."
                          : "Начать защиту"
                      }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="audio-card">
                <div class="detail-card-header">
                  <div class="detail-card-icon">🎙️</div>
                  <div class="detail-card-title">Аудиозапись защиты</div>
                </div>
                <div class="audio-recorder">
                  <div class="audio-controls">
                    <button
                      v-if="!audioBlob && !isRecording"
                      @click="toggleRecording"
                      class="record-button"
                    >
                      <span class="button-icon">🎙️</span>
                      Начать запись
                    </button>
                    <input
                      ref="localAudioInput"
                      type="file"
                      accept="audio/*"
                      @change="handleLocalAudioUpload"
                      style="display: none"
                    />
                    <button
                      v-if="!audioBlob && !isRecording"
                      @click="$refs.localAudioInput.click()"
                      class="record-button local-upload-button"
                    >
                      <span class="button-icon">📁</span>
                      Загрузить аудио
                    </button>
                    <button
                      v-if="isRecording"
                      @click="toggleRecording"
                      class="record-button recording"
                    >
                      <span class="button-icon">⏹️</span>
                      Остановить запись
                      <span class="recording-indicator"></span>
                    </button>
                  </div>
                  <div v-if="audioBlob" class="audio-preview">
                    <audio
                      controls
                      :src="audioUrl"
                      class="audio-player"
                    ></audio>
                    <div class="button-group">
                      <button
                        @click="uploadAudio"
                        class="action-button upload-button"
                      >
                        <span class="button-icon">📤</span> Отправить запись
                      </button>
                      <button
                        @click="cancelRecording"
                        class="action-button cancel-button"
                      >
                        <span class="button-icon">❌</span> Отмена
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="uploadStatus"
                    class="upload-status"
                    :class="{ success: uploadStatus.includes('успешно') }"
                  >
                    {{ uploadStatus }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Модальное окно вопросов (оставляем как есть) -->
        <div
          v-if="questionsModalVisible"
          class="modal-overlay questions-modal-overlay"
          @click="closeQuestionsModal"
        >
          <div class="modal-content questions-modal" @click.stop>
            <div class="modal-header">
              <div class="modal-title">
                <div class="modal-icon">❓</div>
                <h3>Вопросы</h3>
              </div>
              <button class="close-button" @click="closeQuestionsModal">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="project-title-card">
              <h4>{{ selectedProject.Title }}</h4>
            </div>
            <div class="add-question-form">
              <input
                v-model="newQuestionText"
                placeholder="Введите новый вопрос"
                class="question-input"
              />
              <button @click="addQuestion" class="action-button add-button">
                <span class="button-icon">➕</span> Добавить
              </button>
            </div>
            <div class="questions-container">
              <div v-if="questions.length > 0" class="questions-list">
                <div
                  v-for="question in questions"
                  :key="question.ID"
                  class="question-item"
                >
                  <div class="question-content">
                    <input
                      v-if="question.editing"
                      v-model="question.Text"
                      class="question-edit-input"
                      placeholder="Введите вопрос"
                      @keyup.enter="saveQuestion(question)"
                    />
                    <div v-else class="question-text">{{ question.Text }}</div>
                  </div>
                  <div class="question-actions">
                    <button
                      v-if="!question.editing"
                      @click="editQuestion(question)"
                      class="icon-button edit-button"
                      title="Редактировать"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        ></path>
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        ></path>
                      </svg>
                    </button>
                    <button
                      v-if="question.editing"
                      @click="saveQuestion(question)"
                      class="icon-button save-button"
                      title="Сохранить"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                        ></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                    </button>
                    <button
                      @click="deleteQuestion(question.ID)"
                      class="icon-button delete-button"
                      title="Удалить"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        ></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="no-questions">
                <div class="no-data-icon">📝</div>
                <p>Нет вопросов для этого проекта</p>
                <p class="no-data-hint">
                  Добавьте первый вопрос с помощью формы выше
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ ИЗМЕНЕНО: Модальное окно оценивания - студенты сгруппированы по проектам -->
        <div
          v-if="gradingModalVisible"
          class="modal-overlay"
          @click="closeGradingModal"
        >
          <div class="modal-content grading-modal" @click.stop>
            <div class="modal-header">
              <div class="modal-title">
                <div class="modal-icon">📊</div>
                <h3>Оценивание студентов</h3>
              </div>
              <button class="close-button" @click="closeGradingModal">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="grading-content">
              <div
                v-if="loadingAllStudents || loadingCommission"
                class="loading-container"
              >
                <div class="loading-spinner"></div>
                <p>Загрузка данных...</p>
              </div>

              <div
                v-else-if="projectsForGrading.length === 0"
                class="no-data-container"
              >
                <div class="no-data-icon">👨‍🎓</div>
                <p>Нет проектов для оценивания</p>
              </div>

              <!-- ✅ НОВОЕ: Список проектов с раскрывающимися студентами -->
              <div v-else class="projects-grading-list">
                <div
                  v-for="project in projectsForGrading"
                  :key="project.ID"
                  class="project-grading-item"
                >
                  <!-- Заголовок проекта (кликабельный) -->
                  <div
                    class="project-grading-header"
                    :class="{ expanded: expandedProjectId === project.ID }"
                    @click="toggleProjectGrading(project.ID)"
                  >
                    <div class="project-grading-info">
                      <span class="expand-icon">
                        {{ expandedProjectId === project.ID ? "▼" : "▶" }}
                      </span>
                      <div class="project-grading-title">
                        <span class="project-name">{{ project.Title }}</span>
                        <span class="students-count">
                          ({{ project.students?.length || 0 }} студ.)
                        </span>
                      </div>
                    </div>
                    <div class="project-grading-status">
                      <span
                        v-if="isProjectFullyGraded(project)"
                        class="graded-badge"
                      >
                        ✅ Оценено
                      </span>
                      <span v-else class="not-graded-badge">
                        ⏳ Не оценено
                      </span>
                    </div>
                  </div>

                  <!-- Список студентов (виден только если проект раскрыт) -->
                  <div
                    v-if="expandedProjectId === project.ID"
                    class="students-grading-sublist"
                  >
                    <div
                      v-for="student in project.students"
                      :key="student.ID"
                      class="student-grading-item"
                    >
                      <div class="student-info">
                        <div class="student-name">
                          {{ student.Surname }} {{ student.Name }}
                          {{ student.Patronymic }}
                        </div>
                        <div v-if="student.ID_Group" class="student-group">
                          {{ student.ID_Group.Name }}
                        </div>
                      </div>
                      <div class="grade-selector">
                        <select
                          v-model="student.grade"
                          class="grade-select"
                          :disabled="savingGrades[student.ID]"
                        >
                          <option value="" disabled>Выберите оценку</option>
                          <option value="Отлично">Отлично</option>
                          <option value="Хорошо">Хорошо</option>
                          <option value="Удовлетворительно">
                            Удовлетворительно
                          </option>
                          <option value="Неудовлетворительно">
                            Неудовлетворительно
                          </option>
                          <option value="Пересдача">Пересдача</option>
                        </select>
                      </div>
                      <div class="protocol-actions">
                        <button
                          @click="saveGrade(student)"
                          class="action-button protocol-button ok-button"
                          :disabled="!student.grade || savingGrades[student.ID]"
                        >
                          {{ savingGrades[student.ID] ? "⏳" : "✅" }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grading-actions">
                <button
                  @click="saveAllGrades"
                  class="action-button save-all-button"
                  :disabled="savingAllGrades"
                >
                  <span class="button-icon">{{
                    savingAllGrades ? "⏳" : "💾"
                  }}</span>
                  {{
                    savingAllGrades ? "Сохранение..." : "Сохранить все оценки"
                  }}
                </button>
                <button
                  @click="goToProjectFilter"
                  class="action-button filter-button"
                >
                  <span class="button-icon">🔍</span>
                  Закончить
                </button>
              </div>
              <div v-if="generationStatus" class="generation-status">
                {{ generationStatus }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import api from "@/services/api";
import ProjectFilter from "./ProjectFilter.vue";

export default {
  components: {
    ProjectFilter,
  },
  name: "ProjectDefense",
  data() {
    return {
      showProjects: false,
      activeFilters: null,
      loading: false,
      error: null,
      projects: [],
      students: {},
      studentsLoading: {},
      studentsError: {},
      selectedProject: null,
      questionsModalVisible: false,
      questions: [],
      newQuestionText: "",
      isRecording: false,
      mediaRecorder: null,
      audioBlob: null,
      audioUrl: null,
      uploadStatus: "",
      audioChunks: [],
      gradingModalVisible: false,
      allStudents: [],
      loadingAllStudents: false,
      generationStatus: "",
      commissionMembers: [],
      loadingCommission: false,
      updateInterval: null,
      startingDefense: {},
      generatingProtocols: false,
      localAudioFile: null,
      savingAllGrades: false,
      projectsForGrading: [],
      expandedProjectId: null,
      savingGrades: {},
    };
  },
  computed: {
    canGenerateProtocols() {
      return (
        this.allStudents.length > 0 &&
        this.allStudents.every((student) => student.grade)
      );
    },
  },
  mounted() {
    this.checkSavedFilters();
    this.updateInterval = setInterval(() => {
      if (this.showProjects && this.projects.length > 0) {
        this.refreshProjectsData();
      }
    }, 60000);
  },
  beforeUnmount() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  },
  methods: {
    checkSavedFilters() {
      const savedParams = sessionStorage.getItem("projectFilterParams");
      if (savedParams) {
        try {
          const params = JSON.parse(savedParams);
          if (params.scheduleId) {
            this.activeFilters = params;
            this.showProjects = true;
            this.loadProjectsBySchedule(params.scheduleId);
          }
        } catch (error) {
          console.error("Ошибка восстановления фильтров:", error);
        }
      }
    },

    async handleFilterApplied(filterParams) {
      this.activeFilters = filterParams;
      this.showProjects = true;
      await this.updateDefenseScheduleCommission(
        filterParams.scheduleId,
        filterParams.commissionId
      );
      this.loadProjectsBySchedule(filterParams.scheduleId);
    },

    async updateDefenseScheduleCommission(scheduleId, commissionId) {
      if (!scheduleId) return;
      try {
        const payload = {};
        if (commissionId) {
          payload.ID_Commission = commissionId;
        } else {
          payload.ID_Commission = null;
        }
        // ✅ Заменено: axios + хардкод → api + относительный путь
        const response = await api.patch(
          `/api/defenses/${scheduleId}/`,
          payload
        );
        if (response.status === 200) {
          console.log("DefenseSchedule успешно обновлен");
        }
      } catch (error) {
        console.error("Ошибка обновления DefenseSchedule:", error);
        alert(
          "Ошибка при обновлении расписания: " +
            (error.response?.data?.message || error.message)
        );
      }
    },

    backToFilters() {
      this.showProjects = false;
    },

    resetProjects() {
      this.showProjects = false;
      this.activeFilters = null;
      this.projects = [];
      sessionStorage.removeItem("projectFilterParams");
    },

    async loadProjectsBySchedule(scheduleId) {
      this.loading = true;
      this.error = null;
      try {
        // ✅ Заменено: axios → api
        const response = await api.get("/api/projects/", {
          params: { defense_schedule_id: scheduleId },
        });

        const studentPromises = response.data.map((project) =>
          this.loadStudentsForProject(project.ID)
        );
        await Promise.all(studentPromises);

        this.projects = response.data.filter((project) => {
          const students = this.students[project.ID];
          return students && students.length > 0;
        });

        for (const project of this.projects) {
          await this.loadProjectDefenseTimes(project);
        }
      } catch (err) {
        this.error = `Ошибка загрузки проектов: ${
          err.response?.data?.message || err.message
        }`;
        console.error("Load projects error:", err);
      } finally {
        this.loading = false;
      }
    },

    async loadStudentsForProject(projectId) {
      this.studentsLoading[projectId] = true;
      this.studentsError[projectId] = false;
      try {
        const response = await api.get("/api/students/", {
          params: {
            ID_Project: projectId,
            ID_DefenseSchedule: this.activeFilters?.scheduleId,
            protocol__Status: false,
          },
        });
        this.students[projectId] = response.data;
      } catch (err) {
        this.studentsError[projectId] = true;
        console.error(`Error loading students for project ${projectId}:`, err);
      } finally {
        this.studentsLoading[projectId] = false;
      }
    },

    showProjectDetails(project) {
      this.selectedProject = project;
    },

    closeModal() {
      this.selectedProject = null;
    },

    async openQuestionsModal(project) {
      this.selectedProject = project;
      this.questionsModalVisible = true;
      await this.loadQuestions();
    },

    async loadQuestions() {
      try {
        const response = await api.get("/api/questions/", {
          params: {
            ID_Project: this.selectedProject.ID,
            Status: false,
          },
        });
        this.questions = response.data.map((q) => ({ ...q, editing: false }));
      } catch (error) {
        console.error("Ошибка загрузки вопросов:", error);
      }
    },

    async addQuestion() {
      if (!this.newQuestionText.trim()) return;
      try {
        await api.post("/api/questions/", {
          Text: this.newQuestionText,
          ID_Project: this.selectedProject.ID,
          Status: false,
        });
        this.newQuestionText = "";
        await this.loadQuestions();
      } catch (error) {
        console.error("Ошибка добавления вопроса:", error);
      }
    },

    editQuestion(question) {
      question.editing = true;
    },

    async saveQuestion(question) {
      if (!question.Text.trim()) {
        alert("Вопрос не может быть пустым");
        return;
      }
      try {
        const response = await api.patch(`/api/questions/${question.ID}/`, {
          Text: question.Text,
        });
        if (response.data.error) {
          alert(response.data.error);
          return;
        }
        question.editing = false;
        await this.loadQuestions();
      } catch (error) {
        console.error("Ошибка сохранения:", error.response?.data);
        alert(
          `Ошибка сохранения: ${error.response?.data?.error || error.message}`
        );
      }
    },

    async deleteQuestion(questionId) {
      try {
        if (!questionId || typeof questionId !== "number") {
          console.error("Invalid question ID:", questionId);
          alert("Ошибка: Некорректный ID вопроса");
          return;
        }
        if (!confirm("Вы уверены, что хотите удалить этот вопрос?")) return;
        const response = await api.delete(`/api/questions/${questionId}/`);
        if (response.status === 200 || response.status === 204) {
          this.questions = this.questions.filter((q) => q.ID !== questionId);
          alert("Вопрос успешно удален!");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Неизвестная ошибка при удалении";
        console.error("Delete Error Details:", {
          status: error.response?.status,
          data: error.response?.data,
          questionId,
        });
        alert(`Ошибка удаления: ${errorMessage}`);
      }
    },

    closeQuestionsModal() {
      this.questionsModalVisible = false;
      this.selectedProject = null;
      this.questions = [];
    },

    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
          this.audioUrl = URL.createObjectURL(this.audioBlob);
          this.audioChunks = [];
        };
        this.mediaRecorder.start();
        this.isRecording = true;
      } catch (err) {
        console.error("Ошибка доступа к микрофону:", err);
        this.uploadStatus = "Не удалось получить доступ к микрофону";
      }
    },

    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
    },

    toggleRecording() {
      if (
        this.selectedProject.Status !== "Защита начата" &&
        this.selectedProject.Status !== "Готов"
      ) {
        alert("Аудиозапись доступна только после начала защиты");
        return;
      }
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },

    cancelRecording() {
      this.audioBlob = null;
      this.audioUrl = null;
      this.audioChunks = [];
      this.uploadStatus = "";
      this.clearLocalAudio();
    },

    async uploadAudio() {
      if (!this.audioBlob) return;
      try {
        this.uploadStatus = "Отправка аудиозаписи...";
        const formData = new FormData();
        formData.append("audio", this.audioBlob, `recording_${Date.now()}.mp3`);
        formData.append("project_id", this.selectedProject.ID.toString());
        // ✅ ВАЖНО: для multipart/form-data сохраняем заголовок!
        const response = await api.post("/api/upload-audio/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (response.status === 202) {
          this.uploadStatus = "Запись успешно отправлена!";
          await this.setDefenseEndTime();
          setTimeout(() => {
            this.cancelRecording();
          }, 2000);
        }
      } catch (err) {
        console.error("Ошибка загрузки аудио:", err);
        this.uploadStatus = "Ошибка при отправке записи";
      }
    },

    async setDefenseEndTime() {
      try {
        const now = new Date();
        const endTime = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        const response = await api.patch("/api/projects/project_time_end/", {
          ID_Project: this.selectedProject.ID,
          DefenseEndTime: endTime,
          ID_DefenseSchedule: this.activeFilters?.scheduleId,
        });

        if (response.status === 200) {
          this.selectedProject.DefenseEndTime = endTime;
          await this.refreshProjectsData();
        }
      } catch (error) {
        console.error("Ошибка установки времени окончания:", error);
      }
    },

    async openGradingModal() {
      this.gradingModalVisible = true;
      this.expandedProjectId = null;
      this.projectsForGrading = [];
      this.loadingAllStudents = true;

      try {
        for (const project of this.projects) {
          const projectStudents = this.students[project.ID] || [];
          const projectWithStudents = {
            ...project,
            students: projectStudents.map((s) => ({
              ...s,
              grade: s.grade || "",
            })),
          };
          this.projectsForGrading.push(projectWithStudents);

          for (const student of projectWithStudents.students) {
            try {
              const response = await api.get("/api/protocols/", {
                params: {
                  ID_Student: student.ID,
                  ID_DefenseSchedule: this.activeFilters.scheduleId,
                },
              });
              if (response.data && response.data.length > 0) {
                const existingProtocol = response.data[0];
                student.grade = existingProtocol.Grade || "";
                student.hasExistingGrade = true;
                student.protocolId = existingProtocol.ID;
              }
            } catch (error) {
              console.error("Ошибка загрузки оценки:", error);
            }
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки данных для оценивания:", error);
      } finally {
        this.loadingAllStudents = false;
      }
    },

    closeGradingModal() {
      this.gradingModalVisible = false;
      this.generationStatus = "";
      this.projectsForGrading = [];
      this.expandedProjectId = null;
    },

    toggleProjectGrading(projectId) {
      if (this.expandedProjectId === projectId) {
        this.expandedProjectId = null;
      } else {
        this.expandedProjectId = projectId;
      }
    },

    isProjectFullyGraded(project) {
      if (!project.students || project.students.length === 0) return true;
      return project.students.every((s) => s.grade && s.grade.trim() !== "");
    },

    async loadCommissionMembers() {
      this.loadingCommission = true;
      try {
        if (this.activeFilters?.commissionId) {
          const formData = new FormData();
          formData.append("id_commission", this.activeFilters.commissionId);
          // ✅ ВАЖНО: для multipart/form-data сохраняем заголовок!
          const response = await api.post(
            "/api/commission_composition/",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          this.commissionMembers = response.data;
        }
      } catch (error) {
        console.error("Ошибка загрузки комиссии:", error);
      } finally {
        this.loadingCommission = false;
      }
    },

    goToProjectFilter() {
      this.showProjects = false;
      this.activeFilters = null;
      this.projects = [];
      this.students = {};
      this.allStudents = [];
      this.projectsForGrading = [];
      this.closeGradingModal();
      sessionStorage.removeItem("projectFilterParams");
    },

    async saveGrade(student) {
      if (!student.grade) {
        alert("Пожалуйста, выберите оценку");
        return;
      }
      this.savingGrades[student.ID] = true;
      try {
        const response = await api.patch("/api/students/update_grade/", {
          ID_Student: student.ID,
          Grade: student.grade,
        });
        if (response.status === 200) {
          student.hasExistingGrade = true;
          alert(
            `Оценка ${student.grade} сохранена для студента ${student.Surname} ${student.Name}`
          );
          await this.refreshProjectsData();
        }
      } catch (error) {
        console.error("Ошибка сохранения оценки:", error);
        alert(
          "Ошибка при сохранении оценки: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        this.savingGrades[student.ID] = false;
      }
    },

    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return "";
      let date;
      if (dateTimeStr.includes("T")) {
        const cleanDateStr = dateTimeStr.replace("Z", "");
        date = new Date(cleanDateStr);
      } else {
        date = new Date(dateTimeStr.replace(" ", "T"));
      }
      if (isNaN(date.getTime())) {
        console.error("Неверный формат даты:", dateTimeStr);
        return dateTimeStr;
      }
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    },

    async startDefense(project) {
      if (this.startingDefense[project.ID]) return;
      this.startingDefense[project.ID] = true;
      try {
        const now = new Date();
        const defenseTime = `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;
        const response = await api.patch("/api/projects/project_time_start/", {
          ID_Project: project.ID,
          DefenseStartTime: defenseTime,
          ID_DefenseSchedule: this.activeFilters?.scheduleId,
        });
        if (response.status === 200) {
          project.Status = "Защита начата";
          project.DefenseStartTime = defenseTime;
          await this.refreshProjectsData();
        }
      } catch (error) {
        console.error("Ошибка начала защиты:", error);
        alert(
          "Ошибка при начале защиты: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        this.startingDefense[project.ID] = false;
      }
    },

    async refreshProjectsData() {
      try {
        const response = await api.get("/api/projects/", {
          params: {
            defense_schedule_id: this.activeFilters.scheduleId,
          },
        });
        for (const updatedProject of response.data) {
          const existingProject = this.projects.find(
            (p) => p.ID === updatedProject.ID
          );
          if (existingProject) {
            const savedStartTime = existingProject.DefenseStartTime;
            const savedEndTime = existingProject.DefenseEndTime;

            Object.assign(existingProject, updatedProject);

            if (savedStartTime)
              existingProject.DefenseStartTime = savedStartTime;
            if (savedEndTime) existingProject.DefenseEndTime = savedEndTime;

            await this.loadProjectDefenseTimes(existingProject);
          }
        }
      } catch (error) {
        console.error("Ошибка обновления данных проектов:", error);
      }
    },

    getProjectStatusClass(status) {
      const statusMap = {
        "Защита не начата": "status-not-started",
        "Защита начата": "status-started",
        "Вопросы расшифровываются": "status-processing",
        "Ошибка загрузки аудио": "status-error",
        Готов: "status-ready",
      };
      return statusMap[status] || "status-unknown";
    },

    async loadProjectDefenseTimes(project) {
      try {
        if (
          !this.students[project.ID] ||
          this.students[project.ID].length === 0
        ) {
          console.warn(`Нет студентов для проекта ${project.ID}`);
          return;
        }

        const students = this.students[project.ID];
        const firstStudent = students[0];

        try {
          const protocolResponse = await api.get("/api/protocols/", {
            params: {
              ID_Student: firstStudent.ID,
              ID_DefenseSchedule: this.activeFilters?.scheduleId,
            },
          });

          if (protocolResponse.data && protocolResponse.data.length > 0) {
            const protocol = protocolResponse.data[0];

            if (
              protocol.DefenseStartTime &&
              protocol.DefenseStartTime.trim() !== ""
            ) {
              project.DefenseStartTime = protocol.DefenseStartTime;
            } else {
              project.DefenseStartTime = null;
            }

            if (
              protocol.DefenseEndTime &&
              protocol.DefenseEndTime.trim() !== ""
            ) {
              project.DefenseEndTime = protocol.DefenseEndTime;
            } else {
              project.DefenseEndTime = null;
            }
          } else {
            project.DefenseStartTime = null;
            project.DefenseEndTime = null;
          }
        } catch (protocolError) {
          console.error(
            `Ошибка загрузки протокола для студента ${firstStudent.ID}:`,
            protocolError
          );
          project.DefenseStartTime = null;
          project.DefenseEndTime = null;
        }
      } catch (error) {
        console.error(
          `Ошибка загрузки времени защиты для проекта ${project.ID}:`,
          error
        );
        project.DefenseStartTime = null;
        project.DefenseEndTime = null;
      }
    },

    getProjectStatusIcon(status) {
      const iconMap = {
        "Защита не начата": "⏸️",
        "Защита начата": "▶️",
        "Вопросы расшифровываются": "🔄",
        "Ошибка загрузки аудио": "❌",
        Готов: "✅",
      };
      return iconMap[status] || "❓";
    },

    getProjectStatusText(status) {
      return status || "Неизвестный статус";
    },

    formatTime(timeStr) {
      if (!timeStr) return "Не указано";
      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const timeParts = timeStr.split(":");
        const hours = timeParts[0];
        const minutes = timeParts[1];
        return `${hours}:${minutes}`;
      }
      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}$/)) {
        return timeStr;
      }
      try {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        }
      } catch (error) {
        console.error("Ошибка форматирования времени:", error);
      }
      return "Не указано";
    },

    async updateProjectTime(project, timeType, newTime) {
      if (!newTime) return;
      try {
        const endpoint =
          timeType === "start"
            ? "/api/projects/project_time_start/"
            : "/api/projects/project_time_end/";

        const payload = {
          ID_Project: project.ID,
          ID_DefenseSchedule: this.activeFilters?.scheduleId,
        };

        if (timeType === "start") {
          payload.DefenseStartTime = newTime + ":00";
        } else {
          payload.DefenseEndTime = newTime + ":00";
        }

        const response = await api.patch(endpoint, payload);

        if (response.status === 200) {
          if (timeType === "start") {
            project.DefenseStartTime = newTime + ":00";
          } else {
            project.DefenseEndTime = newTime + ":00";
          }
          alert("Время успешно обновлено");
          await this.refreshProjectsData();
        }
      } catch (error) {
        console.error("Ошибка обновления времени:", error);
        alert(
          "Ошибка при обновлении времени: " +
            (error.response?.data?.message || error.message)
        );
      }
    },

    formatTimeForInput(timeStr) {
      if (!timeStr) return "";
      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const timeParts = timeStr.split(":");
        const hours = timeParts[0];
        const minutes = timeParts[1];
        return `${hours}:${minutes}`;
      }
      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}$/)) {
        return timeStr;
      }
      try {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        }
      } catch (error) {
        console.error("Ошибка форматирования времени для input:", error);
      }
      return "";
    },

    async cancelDefense(project) {
      if (!confirm("Вы уверены, что хотите отменить защиту проекта?")) return;
      try {
        await api.patch("/api/projects/project_time_start/", {
          ID_Project: project.ID,
          DefenseStartTime: null,
          ID_DefenseSchedule: this.activeFilters?.scheduleId,
        });

        await api.patch("/api/projects/project_time_end/", {
          ID_Project: project.ID,
          DefenseEndTime: null,
          ID_DefenseSchedule: this.activeFilters?.scheduleId,
        });

        project.Status = "Защита не начата";
        project.DefenseStartTime = null;
        project.DefenseEndTime = null;
        alert("Защита отменена");
        await this.refreshProjectsData();
      } catch (error) {
        console.error("Ошибка отмены защиты:", error);
        alert(
          "Ошибка при отмене защиты: " +
            (error.response?.data?.message || error.message)
        );
      }
    },

    handleLocalAudioUpload(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith("audio/")) {
        this.localAudioFile = file;
        this.audioBlob = file;
        this.audioUrl = URL.createObjectURL(file);
      } else {
        alert("Пожалуйста, выберите аудиофайл");
      }
    },

    async saveAllGrades() {
      let savedCount = 0;
      let errorCount = 0;
      const gradesToSave = [];

      for (const project of this.projectsForGrading) {
        for (const student of project.students) {
          if (student.grade && student.grade.trim() !== "") {
            gradesToSave.push({ student, project });
          }
        }
      }

      if (gradesToSave.length === 0) {
        alert("Нет оценок для сохранения");
        return;
      }

      this.savingAllGrades = true;
      try {
        for (const { student } of gradesToSave) {
          try {
            const response = await api.patch("/api/students/update_grade/", {
              ID_Student: student.ID,
              Grade: student.grade,
            });
            if (response.status === 200) {
              student.hasExistingGrade = true;
              savedCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(
              `Ошибка сохранения оценки для ${student.Surname}:`,
              error
            );
            errorCount++;
          }
        }

        let message = `Сохранено оценок: ${savedCount}`;
        if (errorCount > 0) {
          message += `\nОшибок: ${errorCount}`;
        }
        alert(message);

        await this.refreshProjectsData();
      } catch (error) {
        console.error("Ошибка массового сохранения оценок:", error);
        alert("Ошибка при сохранении оценок");
      } finally {
        this.savingAllGrades = false;
      }
    },

    clearLocalAudio() {
      this.localAudioFile = null;
      if (this.$refs.localAudioInput) {
        this.$refs.localAudioInput.value = "";
      }
    },
  },
};
</script>
<style scoped>
.project-defense-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    Helvetica, Arial, sans-serif;
}

.project-defense-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.filter-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1rem;
}

.filter-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f1f5f9;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  color: #1e293b;
}

.filter-icon {
  font-size: 1rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #e2e8f0;
  color: #1e293b;
}

.back-button:hover {
  background-color: #cbd5e1;
}

.grade-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #4892b4;
  color: white;
}

.grade-button:hover {
  background-color: #3a7a9a;
}

.button-icon {
  font-size: 1rem;
}

.project-defense {
  padding: 15px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

h2 {
  color: #1e293b;
  text-align: center;
  margin-bottom: 1.25rem;
  font-size: 1.8rem;
  font-weight: 700;
}

h3 {
  color: #1e293b;
  font-weight: 700;
  margin: 0;
}

h4 {
  color: #1e293b;
  font-weight: 600;
  margin: 0;
  font-size: 1.25rem;
}

h5 {
  color: #475569;
  font-weight: 500;
  margin: 0.5rem 0;
  font-size: 1rem;
}

.projects-table-container {
  flex: 1;
  border: 1px solid #444444;
  border-radius: 8px;
  overflow: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.projects-table th,
.projects-table td {
  padding: 12px 15px;
  text-align: center;
  border-bottom: 1px solid #868686d7;
  color: #1e293b;
}

.projects-table th {
  background-color: #f8fafc;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
  color: #1e293b;
  text-align: center;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f1f5f9;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  justify-content: center;
}

.status-active {
  background-color: #fef9c3;
  color: #854d0e;
}

.status-completed {
  background-color: #dcfce7;
  color: #166534;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-item {
  font-size: 0.875rem;
  padding: 0.25rem 0;
  border-bottom: 1px dashed #e2e8f0;
  color: #1e293b;
}

.student-item:last-child {
  border-bottom: none;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.questions-button {
  background-color: #eff6ff;
  color: #2563eb;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.6rem 1.2rem;
}

.questions-button:hover {
  background-color: #dbeafe;
}

.icon {
  font-size: 1rem;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  background-color: #f1f5f9;
}

.edit-button:hover {
  color: #2563eb;
}

.save-button:hover {
  color: #16a34a;
}

.delete-button:hover {
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: scroll;
}

.questions-modal-overlay {
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  position: relative;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  margin: 0 auto;
}

.questions-modal {
  max-width: 700px;
  overflow-y: visible;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.project-details-modal,
.grading-modal {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.close-button:hover {
  color: #dc2626;
  background-color: #fee2e2;
}

.project-details {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-title-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background-color: #f8fafc;
  border-left: 4px solid #3b82f6;
}

.project-title-card .status-badge {
  margin-top: 0.5rem;
  align-self: flex-start;
}

.detail-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.detail-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.detail-card-icon {
  font-size: 1.25rem;
}

.detail-card-title {
  font-weight: 600;
  color: #1e293b;
}

.detail-card-content {
  padding: 1rem;
  color: #1e293b;
  line-height: 1.5;
}

.students-card {
  width: 100%;
  margin-bottom: 1.5rem;
}

.students-card .detail-card-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 0;
}

.students-detail-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem;
}

.students-detail-list li {
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 0.25rem;
  transition: all 0.2s;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.students-detail-list li:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.audio-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.audio-recorder {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.record-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  background-color: #4ade80;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 200px;
}

.record-button:hover {
  background-color: #22c55e;
}

.record-button.recording {
  background-color: #ef4444;
}

.record-button.recording:hover {
  background-color: #dc2626;
}

.recording-indicator {
  width: 0.75rem;
  height: 0.75rem;
  background-color: white;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.95);
    opacity: 1;
  }
}

.audio-preview {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.audio-player {
  width: 100%;
  margin-bottom: 0.5rem;
  border-radius: 0.375rem;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.upload-button {
  background-color: #3b82f6;
  color: white;
}

.upload-button:hover {
  background-color: #2563eb;
}

.cancel-button {
  background-color: #64748b;
  color: white;
}

.cancel-button:hover {
  background-color: #475569;
}

.questions-container {
  max-height: 400px;
  overflow-y: auto;
  margin: 0 1rem;
}

.questions-list {
  margin: 1.5rem 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.question-item:hover {
  background-color: #f8fafc;
}

.question-item:last-child {
  border-bottom: none;
}

.question-content {
  flex: 1;
  margin-right: 1rem;
}

.question-text {
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
}

.question-edit-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #1e293b;
}

.question-actions {
  display: flex;
  gap: 0.25rem;
}

.add-question-form {
  display: flex;
  gap: 0.75rem;
  margin: 1.5rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
}

.question-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #1e293b;
}

.add-button {
  background-color: #4ade80;
  color: white;
}

.add-button:hover {
  background-color: #22c55e;
}

.no-questions {
  padding: 3rem 2rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.no-data-hint {
  font-size: 0.875rem;
  color: #94a3b8;
}

.grading-content {
  padding: 1.5rem;
}

.students-grading-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.student-grading-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.student-grading-item:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.project-title {
  font-size: 0.875rem;
  color: #64748b;
}

.grade-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-right: 1rem;
}

.grade-label {
  font-weight: 500;
  color: #1e293b;
}

.grade-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
  color: #1e293b;
  min-width: 150px;
}

.protocol-actions {
  display: flex;
  gap: 0.5rem;
}

.protocol-button {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.protocol-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.docx-button {
  background-color: #3b82f6;
  color: white;
}

.docx-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.grading-actions {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.generate-all-button {
  background-color: #4ade80;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.generate-all-button:hover:not(:disabled) {
  background-color: #22c55e;
}

.generate-all-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.generation-status {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f1f5f9;
  color: #1e293b;
  text-align: center;
  border-radius: 0.375rem;
  font-weight: 500;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
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

.loading-spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.alert {
  padding: 1rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.alert-error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.alert-icon {
  font-size: 1.25rem;
}

.error-text {
  color: #ef4444;
  font-size: 0.875rem;
}

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

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
}

.filter-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.filter-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .project-defense {
    padding: 0.75rem;
  }

  .filter-summary {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .filter-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .back-button,
  .grade-button {
    width: 100%;
  }

  .button-text {
    display: none;
  }

  .action-button {
    padding: 0.5rem;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .add-question-form {
    flex-direction: column;
  }

  .add-button {
    width: 100%;
  }

  .student-grading-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .grade-selector {
    width: 100%;
    justify-content: space-between;
  }

  .grade-select {
    flex: 1;
  }

  .protocol-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .protocol-button {
    flex: 1;
  }
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.start-defense-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.start-defense-content {
  text-align: center;
  padding: 1rem;
}

.start-defense-button-modal {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.start-defense-button-modal:hover:not(:disabled) {
  background-color: #059669;
}

.start-defense-button-modal:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.cancel-defense-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.cancel-defense-button:hover {
  background-color: #dc2626;
}

.time-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.status-icon {
  font-size: 1.1rem;
  margin-right: 0.15rem;
}

.status-not-started {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
  border: 1px solid #d1d5db;
}

.status-started {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.status-processing {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.status-ready {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
  border: 1px solid #86efac;
}

.status-unknown {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
}

.time-card {
  margin-bottom: 1.5rem;
}

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-input-group label {
  font-weight: 500;
  color: #1e293b;
}

.time-input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  color: #1e293b;
}

.time-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ok-button {
  background-color: #10b981;
  color: white;
}

.ok-button:hover:not(:disabled) {
  background-color: #059669;
}

.audio-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.local-upload-button {
  background-color: #6366f1;
}

.local-upload-button:hover {
  background-color: #4f46e5;
}

.projects-grading-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.project-grading-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
}

.project-grading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.project-grading-header:hover {
  background: #f1f5f9;
}

.project-grading-header.expanded {
  background: #ebf8ff;
  border-bottom: 1px solid #bee3f8;
}

.project-grading-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.expand-icon {
  font-size: 1rem;
  color: #718096;
  width: 20px;
  text-align: center;
}

.project-grading-title {
  display: flex;
  flex-direction: column;
}

.project-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.students-count {
  font-size: 0.85rem;
  color: #64748b;
}

.project-grading-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.graded-badge {
  padding: 0.25rem 0.75rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}

.not-graded-badge {
  padding: 0.25rem 0.75rem;
  background: #fef3c7;
  color: #d97706;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Список студентов внутри проекта */
.students-grading-sublist {
  background: #f8fafc;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.student-grading-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.student-grading-item:hover {
  background-color: #f1f5f9;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.student-group {
  font-size: 0.8rem;
  color: #64748b;
}

.grade-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-right: 1rem;
}

.grade-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
  color: #1e293b;
  min-width: 150px;
  font-size: 0.9rem;
}

.protocol-actions {
  display: flex;
  gap: 0.5rem;
}

.protocol-button {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.protocol-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ok-button {
  background-color: #10b981;
  color: white;
}

.ok-button:hover:not(:disabled) {
  background-color: #059669;
}

.save-all-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  margin-right: 1rem;
}

.save-all-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.save-all-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.grading-actions {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 1rem;
}
</style>
