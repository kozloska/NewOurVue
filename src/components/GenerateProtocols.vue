<template>
  <div class="protocol-generator">
    <h2>Подтверждение протоколов</h2>

    <!-- Фильтры: направление и дата защиты -->
    <div class="filters-container">
      <div class="filter-card">
        <div class="card-header">
          <div class="card-icon">🎓</div>
          <h3>Направление подготовки</h3>
        </div>
        <div class="card-content">
          <div v-if="loadingSpecializations" class="loading-indicator">
            <div class="loading-spinner"></div>
            <span>Загрузка направлений...</span>
          </div>
          <div v-else-if="errorSpecializations" class="error-message">
            <div class="error-icon">⚠️</div>
            <span>{{ errorSpecializations }}</span>
          </div>
          <div v-else class="select-container">
            <select
              v-model="selectedSpecialization"
              class="filter-select"
              @change="handleSpecializationChange"
            >
              <option value="" disabled>Выберите направление</option>
              <option
                v-for="spec in specializations"
                :key="spec.ID_Specialization.ID"
                :value="spec.ID_Specialization.ID"
              >
                {{ spec.ID_Specialization.Name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="filter-card" :class="{ disabled: !selectedSpecialization }">
        <div class="card-header">
          <div class="card-icon">📅</div>
          <h3>Дата защиты</h3>
        </div>
        <div class="card-content">
          <div v-if="loadingDefenses" class="loading-indicator">
            <div class="loading-spinner"></div>
            <span>Загрузка дат...</span>
          </div>
          <div v-else-if="errorDefenses" class="error-message">
            <div class="error-icon">⚠️</div>
            <span>{{ errorDefenses }}</span>
          </div>
          <div v-else class="select-container">
            <select
              v-model="selectedDefense"
              class="filter-select"
              :disabled="!selectedSpecialization"
              @change="handleDefenseChange"
            >
              <option value="" disabled>Выберите дату защиты</option>
              <option
                v-for="defense in defenses"
                :key="defense.ID"
                :value="defense.ID"
              >
                {{ formatDateTime(defense.DateTime) }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Список проектов -->
    <div v-if="selectedDefense" class="projects-container">
      <div v-if="loadingProjects" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Загрузка проектов...</p>
      </div>

      <div v-else-if="errorProjects" class="error-container">
        <div class="error-icon">⚠️</div>
        <p>{{ errorProjects }}</p>
        <button @click="loadProjects" class="retry-button">Повторить</button>
      </div>

      <div v-else-if="projects.length === 0" class="no-data-container">
        <div class="no-data-icon">📋</div>
        <p>Нет проектов для выбранной даты защиты</p>
      </div>

      <div v-else class="projects-list">
        <h3 class="projects-title">
          Проекты на {{ formatDateTime(selectedDefenseData?.DateTime) }}
        </h3>

        <div class="project-cards">
          <div
            v-for="project in projects"
            :key="project.ID"
            class="project-card"
            :class="{ collapsed: !expandedProjects[project.ID] }"
          >
            <!-- Заголовок карточки проекта -->
            <div class="project-header">
              <h4 class="project-title">{{ project.Title }}</h4>
              <div class="project-supervisor">
                <span class="supervisor-label">Руководитель:</span>
                <span class="supervisor-name">{{ project.Supervisor }}</span>
              </div>

              <!-- Отображение времени защиты -->
              <div
                v-if="projectDefenseTimes[project.ID]"
                class="project-defense-time"
              >
                <span class="time-label">Время защиты:</span>
                <span class="time-value">
                  {{ projectDefenseTimes[project.ID].startTime }} -
                  {{ projectDefenseTimes[project.ID].endTime }}
                </span>
              </div>

              <div class="project-controls">
                <button
                  @click="toggleProjectCard(project.ID)"
                  class="toggle-button"
                >
                  {{ expandedProjects[project.ID] ? "▲" : "▼" }}
                </button>
              </div>
            </div>

            <!-- Раскрывающаяся часть проекта -->
            <div v-if="expandedProjects[project.ID]" class="project-content">
              <!-- Секция студентов -->
              <div class="students-section">
                <div class="section-header">
                  <div class="section-icon">👥</div>
                  <h5>Студенты</h5>
                  <div v-if="loadingStudents[project.ID]" class="loading-mini">
                    <div class="loading-spinner-mini"></div>
                  </div>
                </div>
                <div v-if="errorStudents[project.ID]" class="error-mini">
                  {{ errorStudents[project.ID] }}
                </div>
                <div
                  v-else-if="students[project.ID]?.length === 0"
                  class="no-students"
                >
                  Нет студентов в проекте
                </div>
                <div v-else class="students-list">
                  <!-- ✅ ЦИКЛ ПО СТУДЕНТАМ - ВСЁ ВНУТРИ ЭТОГО DIV -->
                  <div
                    v-for="student in students[project.ID]"
                    :key="student.ID"
                    class="student-item"
                    :class="{ 'approved-student': project.isApproved }"
                  >
                    <div class="student-info">
                      <div class="student-name">
                        {{ student.Surname }} {{ student.Name }}
                        {{ student.Patronymic }}
                      </div>
                      <div class="student-details">
                        <span class="student-group">{{
                          student.ID_Group?.Name || "Группа не указана"
                        }}</span>
                        <!-- ✅ Оценка (после утверждения всегда видна) -->
                        <span v-if="student.Grade" class="student-grade">
                          📊 Оценка: {{ student.Grade }}
                        </span>
                      </div>
                      <!-- ✅ Назначенные вопросы (всегда видны после распределения) -->
                      <div
                        v-if="
                          student.questions &&
                          (student.questions.question1 ||
                            student.questions.question2)
                        "
                        class="student-questions"
                      >
                        <div class="questions-header">
                          <span class="questions-label"
                            >Назначенные вопросы:</span
                          >
                        </div>
                        <div class="assigned-questions">
                          <div
                            v-if="student.questions.question1"
                            class="assigned-question"
                          >
                            <span class="question-number">1.</span>
                            <span class="question-text">{{
                              truncateText(student.questions.question1, 100)
                            }}</span>
                          </div>
                          <div
                            v-if="student.questions.question2"
                            class="assigned-question"
                          >
                            <span class="question-number">2.</span>
                            <span class="question-text">{{
                              truncateText(student.questions.question2, 100)
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- ✅ === НОВЫЙ БЛОК: Выбор квалификации (ВНУТРИ цикла!) === -->
                      <div
                        class="student-qualification"
                        v-if="!project.isApproved"
                      >
                        <label class="qualification-label">Квалификация:</label>
                        <div class="qualification-select-wrapper">
                          <select
                            v-model="selectedQualifications[student.ID]"
                            class="qualification-select"
                            :disabled="
                              loadingQualifications[getSpecId(student)]
                            "
                          >
                            <option value="">Не выбрана</option>
                            <option
                              v-for="qual in getQualificationsForStudent(
                                student
                              )"
                              :key="qual.ID"
                              :value="qual.ID"
                            >
                              {{ qual.Name }}
                            </option>
                          </select>
                          <span
                            v-if="loadingQualifications[getSpecId(student)]"
                            class="loading-qual-mini"
                          >
                            ⏳
                          </span>
                        </div>
                      </div>

                      <!-- После утверждения показываем сохранённую квалификацию -->
                      <div
                        v-else-if="student.ID_Qualification"
                        class="student-qualification-approved"
                      >
                        <span class="qualification-badge">
                          🎓
                          {{
                            getQualificationName(
                              student.ID_Qualification,
                              student
                            )
                          }}
                        </span>
                      </div>
                    </div>
                    <!-- /.student-info -->

                    <!-- ✅ Кнопки действий для студента -->
                    <div class="student-actions">
                      <!-- Кнопка DOCX (доступна после распределения вопросов) -->
                      <button
                        @click="generateDocxForStudent(student, project)"
                        class="action-button docx-button"
                        :disabled="
                          generatingDocx[student.ID] ||
                          !project.questionsDistributed
                        "
                        :title="
                          !project.questionsDistributed
                            ? 'Сначала распределите вопросы'
                            : ''
                        "
                      >
                        <span class="button-icon">{{
                          generatingDocx[student.ID] ? "⏳" : "📄"
                        }}</span>
                        {{
                          generatingDocx[student.ID] ? "Генерация..." : "DOCX"
                        }}
                      </button>
                      <!-- ✅ Кнопка "Протокол утверждён" (после утверждения проекта) -->
                      <span
                        v-if="project.isApproved"
                        class="approved-student-badge"
                        title="Протокол утверждён"
                      >
                        ✅
                      </span>
                    </div>
                  </div>
                  <!-- ✅ ЗАКРЫВАЮЩИЙ DIV .student-item -->
                </div>
                <!-- /.students-list -->
              </div>
              <!-- /.students-section -->

              <!-- Секция вопросов (остается на уровне проекта, не внутри студента) -->
              <div class="questions-section">
                <div class="section-header">
                  <div class="section-icon">❓</div>
                  <h5>Вопросы ({{ questions[project.ID]?.length || 0 }})</h5>
                  <div v-if="loadingQuestions[project.ID]" class="loading-mini">
                    <div class="loading-spinner-mini"></div>
                  </div>
                </div>
                <div class="add-question-form">
                  <input
                    v-model="newQuestionText[project.ID]"
                    placeholder="Введите новый вопрос"
                    class="question-input"
                    @keyup.enter="addQuestion(project.ID)"
                  />
                  <button
                    @click="addQuestion(project.ID)"
                    class="add-question-btn"
                    :disabled="
                      !newQuestionText[project.ID]?.trim() ||
                      project.questionsDistributed
                    "
                    :title="
                      project.questionsDistributed
                        ? 'Вопросы уже распределены'
                        : ''
                    "
                  >
                    ➕
                  </button>
                </div>
                <div v-if="errorQuestions[project.ID]" class="error-mini">
                  {{ errorQuestions[project.ID] }}
                </div>
                <div
                  v-else-if="questions[project.ID]?.length === 0"
                  class="no-questions"
                >
                  Нет доступных вопросов
                </div>
                <div v-else class="questions-list">
                  <div
                    v-for="question in questions[project.ID]"
                    :key="question.ID"
                    class="question-item"
                  >
                    <div
                      v-if="editingQuestion === question.ID"
                      class="question-edit"
                    >
                      <input
                        v-model="editQuestionText"
                        class="question-edit-input"
                        @keyup.enter="saveQuestion(question.ID)"
                        @keyup.esc="cancelEdit"
                      />
                      <div class="question-edit-actions">
                        <button
                          @click="saveQuestion(question.ID)"
                          class="save-btn"
                        >
                          ✓
                        </button>
                        <button @click="cancelEdit" class="cancel-btn">
                          ✕
                        </button>
                      </div>
                    </div>
                    <div v-else class="question-display">
                      <div class="question-text">
                        {{ truncateText(question.Text, 80) }}
                      </div>
                      <div class="question-actions">
                        <button @click="startEdit(question)" class="edit-btn">
                          ✏️
                        </button>
                        <button
                          @click="deleteQuestion(question.ID, project.ID)"
                          class="delete-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- /.questions-section -->
            </div>
            <!-- /.project-content -->

            <!-- Кнопки действий проекта -->
            <div class="project-actions">
              <!-- Кнопка: Распределить вопросы -->
              <button
                v-if="!project.questionsDistributed"
                @click="distributeQuestionsForProject(project)"
                class="distribute-questions-button"
                :disabled="
                  !students[project.ID]?.length ||
                  distributingQuestions[project.ID]
                "
              >
                <span class="button-icon">{{
                  distributingQuestions[project.ID] ? "⏳" : "🔀"
                }}</span>
                {{
                  distributingQuestions[project.ID]
                    ? "Распределяем..."
                    : "Распределить вопросы"
                }}
              </button>

              <!-- ✅ Кнопки после распределения вопросов -->
              <template v-else>
                <!-- Скачать все протоколы -->
                <button
                  @click="generateAllDocx(project)"
                  class="generate-all-docx-button"
                  :disabled="
                    !students[project.ID]?.length || generatingDocx[project.ID]
                  "
                >
                  <span class="button-icon">{{
                    generatingDocx[project.ID] ? "⏳" : "📥"
                  }}</span>
                  {{
                    generatingDocx[project.ID]
                      ? "Генерация..."
                      : "Скачать все протоколы"
                  }}
                </button>

                <!-- Утвердить проект -->
                <button
                  v-if="!project.isApproved"
                  @click="approveProject(project)"
                  class="approve-project-button"
                  :disabled="
                    !students[project.ID]?.length ||
                    approvingProject[project.ID]
                  "
                >
                  <span class="button-icon">{{
                    approvingProject[project.ID] ? "⏳" : "✅"
                  }}</span>
                  {{
                    approvingProject[project.ID]
                      ? "Утверждаем..."
                      : "Утвердить проект"
                  }}
                </button>
              </template>
            </div>
            <!-- /.project-actions -->
          </div>
          <!-- /.project-card -->
        </div>
        <!-- /.project-cards -->
      </div>
      <!-- /.projects-list -->
    </div>
    <!-- /.projects-container -->

    <!-- Модальное окно текста проекта -->
    <div
      v-if="showProjectTextModal"
      class="mini-modal-overlay"
      @click="closeProjectTextModal"
    >
      <div class="mini-modal-content" @click.stop>
        <div class="mini-modal-header">
          <h4>Текст проекта</h4>
          <button class="mini-close-button" @click="closeProjectTextModal">
            ✕
          </button>
        </div>
        <div class="mini-modal-body">
          <div class="project-text-content">
            {{ selectedProjectText || "Текст проекта отсутствует" }}
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщения -->
    <div class="messages-container">
      <div v-if="successMessage" class="success-message">
        <div class="message-icon">✅</div>
        <div class="message-text">{{ successMessage }}</div>
      </div>
      <div v-if="errorMessage" class="error-message">
        <div class="message-icon">❌</div>
        <div class="message-text">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/services/api";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export default {
  name: "GenerateProtocols",
  data() {
    return {
      selectedSpecialization: "",
      selectedDefense: "",
      selectedDefenseData: null,
      specializations: [],
      defenses: [],
      projects: [],
      students: {},
      questions: {},
      projectDefenseTimes: {},
      loadingSpecializations: false,
      loadingDefenses: false,
      loadingProjects: false,
      loadingStudents: {},
      loadingQuestions: {},
      errorSpecializations: null,
      errorDefenses: null,
      errorProjects: null,
      errorStudents: {},
      errorQuestions: {},
      distributingQuestions: {},
      generatingDocx: {},
      approvingProject: {},
      successMessage: "",
      errorMessage: "",
      secretaryId: null,
      newQuestionText: {},
      editingQuestion: null,
      editQuestionText: "",
      showProjectTextModal: false,
      selectedProjectText: "",
      expandedProjects: {},
      templateBuffer: null,
      qualifications: {}, // qualifications[specId] = массив квалификаций
      loadingQualifications: {}, // loadingQualifications[specId] = boolean
      selectedQualifications: {}, // selectedQualifications[studentId] = qualificationId (или null)
    };
  },
  mounted() {
    this.initializeSecretary();
    this.expandedProjects = {};
    this.loadTemplate();
  },
  methods: {
    // Инициализация и загрузка данных
    initializeSecretary() {
      const secretary = JSON.parse(localStorage.getItem("secretary"));
      if (secretary?.ID) {
        this.secretaryId = secretary.ID;
        this.loadSpecializations();
      } else {
        this.errorSpecializations =
          "ID секретаря не найден. Пожалуйста, войдите в систему заново.";
      }
    },

    async loadTemplate() {
      try {
        const response = await fetch("/templates/test.docx");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        this.templateBuffer = await response.arrayBuffer();
        console.log("Шаблон успешно загружен");
      } catch (error) {
        console.error("Ошибка загрузки шаблона:", error);
        this.errorMessage = "Не удалось загрузить шаблон документа";
      }
    },

    async loadQualificationsForSpecialization(specializationId) {
      if (!specializationId || this.qualifications[specializationId]) return;

      this.loadingQualifications[specializationId] = true;
      try {
        const response = await api.get("/api/qualifications/", {
          params: { ID_Specialization: specializationId },
        });
        this.qualifications[specializationId] = response.data;
      } catch (error) {
        console.error(
          `Ошибка загрузки квалификаций для специализации ${specializationId}:`,
          error
        );
      } finally {
        this.loadingQualifications[specializationId] = false;
      }
    },

    // === ВСПОМОГАТЕЛЬНЫЙ МЕТОД: получить квалификации для студента ===
    getQualificationsForStudent(student) {
      const specId = student.ID_Specialization?.ID || student.ID_Specialization;
      return specId ? this.qualifications[specId] || [] : [];
    },

    // === ОБНОВЛЕНИЕ КВАЛИФИКАЦИИ СТУДЕНТА (отдельный вызов) ===
    async updateStudentQualification(studentId, qualificationId) {
      try {
        await api.patch(`/api/students/${studentId}/`, {
          ID_Qualification: qualificationId || null, // null если не выбрана
        });
        return true;
      } catch (error) {
        console.error(
          `Ошибка обновления квалификации студента ${studentId}:`,
          error
        );
        return false;
      }
    },

    async loadSpecializations() {
      if (!this.secretaryId) return;
      this.loadingSpecializations = true;
      this.errorSpecializations = null;
      try {
        const response = await api.get("/api/secretary_specialization/", {
          params: {
            ID_Secretary: this.secretaryId,
            specialization_status: true,
          },
        });
        this.specializations = response.data;
      } catch (error) {
        console.error("Ошибка загрузки направлений:", error);
        this.errorSpecializations =
          "Не удалось загрузить направления подготовки";
      } finally {
        this.loadingSpecializations = false;
      }
    },

    async loadDefenses() {
      if (!this.selectedSpecialization) return;
      this.loadingDefenses = true;
      this.errorDefenses = null;
      try {
        const response = await api.get("/api/defenses/", {
          params: { specialization_id: this.selectedSpecialization },
        });
        this.defenses = response.data;
      } catch (error) {
        console.error("Ошибка загрузки дат защиты:", error);
        this.errorDefenses = "Не удалось загрузить даты защиты";
      } finally {
        this.loadingDefenses = false;
      }
    },

    async loadProjects() {
      if (!this.selectedDefense) return;
      this.loadingProjects = true;
      this.errorProjects = null;
      try {
        const response = await api.get("/api/projects/", {
          params: { defense_schedule_id: this.selectedDefense },
        });

        // ✅ Шаг 1: Фильтруем только неутверждённые проекты
        let projects = response.data.filter((project) => !project.isApproved);

        this.initializeExpandedProjects();

        // ✅ Шаг 2: Загружаем студентов и вопросы для ВСЕХ проектов
        for (const project of projects) {
          await this.loadStudentsForProject(project.ID);
          await this.loadQuestionsForProject(project.ID);
          await this.checkProjectApprovalStatus(project.ID);
        }

        // ✅ Шаг 3: ФИЛЬТРУЕМ — оставляем только проекты со студентами
        this.projects = projects.filter(
          (project) => this.students[project.ID]?.length > 0
        );
      } catch (error) {
        console.error("Ошибка загрузки проектов:", error);
        this.errorProjects = "Не удалось загрузить проекты";
      } finally {
        this.loadingProjects = false;
      }
    },
    async loadStudentsForProject(projectId) {
      this.loadingStudents[projectId] = true;
      this.errorStudents[projectId] = null;
      try {
        // ✅ Загружаем только студентов с protocol__Status=false и нужным ID_DefenseSchedule
        const response = await api.get("/api/students/", {
          params: {
            ID_Project: projectId,
            ID_DefenseSchedule: this.selectedDefense,
            protocol__Status: false,
          },
        });
        const students = response.data;

        // ✅ Фильтруем только студентов с оценкой
        const studentsWithGrade = students.filter((s) => s.grade);
        const specIds = [
          ...new Set(
            studentsWithGrade
              .map((s) => s.ID_Specialization?.ID || s.ID_Specialization)
              .filter((id) => id)
          ),
        ];

        for (const specId of specIds) {
          await this.loadQualificationsForSpecialization(specId);
        }

        // === НОВОЕ: инициализируем выбранные квалификации из данных студента ===
        for (const student of studentsWithGrade) {
          if (student.ID_Qualification) {
            this.selectedQualifications[student.ID] = student.ID_Qualification;
          }
        }
        for (const student of studentsWithGrade) {
          try {
            const protocolResponse = await api.get("/api/protocols/", {
              params: {
                ID_Student: student.ID,
                ID_DefenseSchedule: this.selectedDefense,
              },
            });
            if (protocolResponse.data?.length > 0) {
              const protocol = protocolResponse.data[0];
              student.Grade = protocol.Grade;
              // Сохраняем время защиты из протокола
              if (
                !this.projectDefenseTimes[projectId] &&
                protocol.DefenseStartTime &&
                protocol.DefenseEndTime
              ) {
                this.projectDefenseTimes[projectId] = {
                  startTime: this.formatTime(protocol.DefenseStartTime),
                  endTime: this.formatTime(protocol.DefenseEndTime),
                };
              }
              student.questions = {};
              if (protocol.ID_Question) {
                try {
                  const q1 = await api.get(
                    `/api/questions/${protocol.ID_Question}/`
                  );
                  student.questions.question1 = q1.data.Text;
                } catch (e) {
                  console.error("Ошибка вопроса 1:", e);
                }
              }
              if (protocol.ID_Question2) {
                try {
                  const q2 = await api.get(
                    `/api/questions/${protocol.ID_Question2}/`
                  );
                  student.questions.question2 = q2.data.Text;
                } catch (e) {
                  console.error("Ошибка вопроса 2:", e);
                }
              }
            }
          } catch (error) {
            console.error(
              `Ошибка загрузки протокола для студента ${student.ID}:`,
              error
            );
          }
        }
        this.students[projectId] = studentsWithGrade;
      } catch (error) {
        console.error(
          `Ошибка загрузки студентов для проекта ${projectId}:`,
          error
        );
        this.errorStudents[projectId] = "Ошибка загрузки студентов";
      } finally {
        this.loadingStudents[projectId] = false;
      }
    },

    async loadQuestionsForProject(projectId) {
      this.loadingQuestions[projectId] = true;
      this.errorQuestions[projectId] = null;
      try {
        const response = await api.get("/api/questions/", {
          params: { ID_Project: projectId, Status: false },
        });
        this.questions[projectId] = response.data;
      } catch (error) {
        console.error(
          `Ошибка загрузки вопросов для проекта ${projectId}:`,
          error
        );
        this.errorQuestions[projectId] = "Ошибка загрузки вопросов";
      } finally {
        this.loadingQuestions[projectId] = false;
      }
    },

    // Проверка статуса утверждения проекта
    async checkProjectApprovalStatus(projectId) {
      const students = this.students[projectId];
      if (!students?.length) return;
      try {
        // Проверяем, что у ВСЕХ студентов протоколы имеют Status: true
        const checks = students.map(async (student) => {
          try {
            const res = await api.get("/api/protocols/", {
              params: {
                ID_Student: student.ID,
                ID_DefenseSchedule: this.selectedDefense,
              },
            });
            return res.data?.[0]?.Status === true;
          } catch {
            return false;
          }
        });
        const results = await Promise.all(checks);
        const isApproved =
          results.every((r) => r === true) && results.length > 0;

        // ✅ Если проект утверждён — удаляем его из списка
        if (isApproved) {
          const projectIndex = this.projects.findIndex(
            (p) => p.ID === projectId
          );
          if (projectIndex !== -1) {
            // ✅ Удаляем проект из массива
            this.projects.splice(projectIndex, 1);
            // ✅ Очищаем связанные данные
            delete this.students[projectId];
            delete this.questions[projectId];
            delete this.projectDefenseTimes[projectId];
            delete this.expandedProjects[projectId];
          }
        }
      } catch (error) {
        console.error(`Ошибка проверки статуса проекта ${projectId}:`, error);
      }
    },

    // === Обработчики фильтров ===
    handleSpecializationChange() {
      this.selectedDefense = "";
      this.selectedDefenseData = null;
      this.defenses = [];
      this.projects = [];
      this.students = {};
      this.questions = {};
      this.projectDefenseTimes = {};
      this.clearMessages();
      if (this.selectedSpecialization) this.loadDefenses();
    },
    handleDefenseChange() {
      this.projects = [];
      this.students = {};
      // ✅ ДОБАВЛЕНО: сбрасываем все связанные объекты
      this.studentsLoading = {};
      this.studentsError = {};
      this.questions = {};
      this.projectDefenseTimes = {};
      this.clearMessages();

      if (this.selectedDefense) {
        this.selectedDefenseData = this.defenses.find(
          (d) => d.ID === this.selectedDefense
        );
        this.loadProjects();
      }
    },
    // === ВСПОМОГАТЕЛЬНЫЙ МЕТОД: получить название квалификации ===
    getQualificationName(qualificationId, student) {
      if (!qualificationId) return "";
      // Если это объект (уже загружен)
      if (typeof qualificationId === "object") return qualificationId.Name;

      // Ищем в загруженных квалификациях
      const specId = student.ID_Specialization?.ID || student.ID_Specialization;
      const quals = this.qualifications[specId] || [];
      const qual = quals.find((q) => q.ID === qualificationId);
      return qual?.Name || "Загрузка...";
    },
    // === Форматирование ===
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return "";
      const date = new Date(dateTimeStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    },

    formatTime(timeStr) {
      if (!timeStr || timeStr.trim() === "") return "Не указано";
      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const parts = timeStr.split(":");
        return `${parts[0]}:${parts[1]}`;
      }
      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}$/))
        return timeStr;
      try {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          const h = date.getHours().toString().padStart(2, "0");
          const m = date.getMinutes().toString().padStart(2, "0");
          return `${h}:${m}`;
        }
      } catch (e) {
        console.error("Ошибка форматирования времени:", e);
      }
      return "Не указано";
    },

    parseTime(timeStr) {
      if (!timeStr) return { hours: "00", minutes: "00" };
      const parts = timeStr.split(":");
      return { hours: parts[0] || "00", minutes: parts[1] || "00" };
    },
    formatDateTimeForDoc(dateTimeStr) {
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

      // ✅ Добавляем год и "г." в конце
      return `${date.getDate()} ${
        months[date.getMonth()]
      } ${date.getFullYear()} г.`;
    },

    truncateText(text, maxLength) {
      if (!text) return "";
      return text.length <= maxLength
        ? text
        : text.substring(0, maxLength) + "...";
    },

    getFullName(person) {
      if (!person) return "Не указан";
      return `${person.Surname || ""} ${person.Name || ""} ${
        person.Patronymic || ""
      }`.trim();
    },

    getInitials(person) {
      if (!person) return "Не указан";
      const surname = person.Surname || "";
      const name = person.Name ? person.Name.charAt(0).toUpperCase() + "." : "";
      const patronymic = person.Patronymic
        ? person.Patronymic.charAt(0).toUpperCase() + "."
        : "";
      return `${surname} ${name}${patronymic}`.trim();
    },

    capitalizeFirstLetter(str) {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // === Управление интерфейсом ===
    toggleProjectCard(projectId) {
      this.expandedProjects[projectId] = !this.expandedProjects[projectId];
    },

    initializeExpandedProjects() {
      this.projects.forEach((project) => {
        if (this.expandedProjects[project.ID] === undefined) {
          this.expandedProjects[project.ID] = false;
        }
      });
    },

    getSpecId(student) {
      const spec = student?.ID_Specialization;
      return spec?.ID ?? spec ?? null;
    },

    showProjectText(project) {
      this.selectedProjectText = project.Text;
      this.showProjectTextModal = true;
    },

    closeProjectTextModal() {
      this.showProjectTextModal = false;
      this.selectedProjectText = "";
    },

    clearMessages() {
      this.successMessage = "";
      this.errorMessage = "";
    },

    // === Работа с вопросами ===
    async addQuestion(projectId) {
      const text = this.newQuestionText[projectId];
      if (!text?.trim()) return;
      try {
        await api.post("/api/questions/", {
          Text: text.trim(),
          ID_Project: projectId,
          Status: false,
        });
        this.newQuestionText[projectId] = "";
        await this.loadQuestionsForProject(projectId);
        this.successMessage = "Вопрос успешно добавлен";
      } catch (error) {
        console.error("Ошибка добавления вопроса:", error);
        this.errorMessage = "Ошибка при добавлении вопроса";
      }
    },

    startEdit(question) {
      this.editingQuestion = question.ID;
      this.editQuestionText = question.Text;
    },

    cancelEdit() {
      this.editingQuestion = null;
      this.editQuestionText = "";
    },

    async saveQuestion(questionId) {
      if (!this.editQuestionText.trim()) {
        this.errorMessage = "Вопрос не может быть пустым";
        return;
      }
      try {
        await api.patch(`/api/questions/${questionId}/`, {
          Text: this.editQuestionText.trim(),
        });
        this.cancelEdit();
        this.projects.forEach((p) => this.loadQuestionsForProject(p.ID));
        this.successMessage = "Вопрос успешно обновлен";
      } catch (error) {
        console.error("Ошибка сохранения вопроса:", error);
        this.errorMessage = "Ошибка при сохранении вопроса";
      }
    },

    async deleteQuestion(questionId, projectId) {
      if (!confirm("Вы уверены, что хотите удалить этот вопрос?")) return;
      try {
        await api.delete(`/api/questions/${questionId}/`);
        await this.loadQuestionsForProject(projectId);
        this.successMessage = "Вопрос успешно удален";
      } catch (error) {
        console.error("Ошибка удаления вопроса:", error);
        this.errorMessage = "Ошибка при удалении вопроса";
      }
    },

    // Распределение вопросов (первый шаг)
    async distributeQuestionsForProject(project) {
      const students = this.students[project.ID];
      if (!students?.length) {
        this.errorMessage = "Нет студентов для распределения вопросов";
        return;
      }
      if (
        !confirm(
          "Распределить вопросы между студентами? После этого вопросы нельзя будет изменить."
        )
      )
        return;

      this.distributingQuestions[project.ID] = true;
      this.clearMessages();

      try {
        // 1. Загружаем все доступные вопросы (Status: false)
        const questionsRes = await api.get("/api/questions/", {
          params: { ID_Project: project.ID, Status: false },
        });
        const questions = questionsRes.data;

        if (questions.length === 0) throw new Error("Нет доступных вопросов");
        if (questions.length < students.length) {
          throw new Error(
            `Недостаточно вопросов. Нужно: ${students.length}, есть: ${questions.length}`
          );
        }

        // 2. Перемешиваем и распределяем
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        const assignments = [];
        const assignedQuestionIds = new Set(); // ✅ Отслеживаем назначенные вопросы

        let idx = 0;
        // Первый вопрос каждому
        for (let i = 0; i < students.length && idx < shuffled.length; i++) {
          assignments.push({
            studentId: students[i].ID,
            q1: shuffled[idx].ID,
            q2: null,
          });
          assignedQuestionIds.add(shuffled[idx].ID); // ✅ Добавляем в набор
          idx++;
        }

        // Второй вопрос, если есть
        let sIdx = 0;
        while (idx < shuffled.length && sIdx < students.length) {
          if (assignments[sIdx]) {
            assignments[sIdx].q2 = shuffled[idx].ID;
            assignedQuestionIds.add(shuffled[idx].ID); // ✅ Добавляем в набор
          }
          idx++;
          sIdx++;
        }

        // 3. Обновляем протоколы в БД
        for (const a of assignments) {
          const protoRes = await api.get("/api/protocols/", {
            params: {
              ID_Student: a.studentId,
              ID_DefenseSchedule: this.selectedDefense,
            },
          });
          if (protoRes.data?.length > 0) {
            const proto = protoRes.data[0];
            const update = {};
            if (a.q1) update.ID_Question = a.q1;
            if (a.q2) update.ID_Question2 = a.q2;
            if (Object.keys(update).length > 0) {
              await api.patch(`/api/protocols/${proto.ID}/`, update);
            }
          }
        }

        // ✅ 4. Обновляем Статус ТОЛЬКО для назначенных вопросов
        for (const qId of assignedQuestionIds) {
          try {
            await api.patch(`/api/questions/${qId}/`, { Status: true });
          } catch (e) {
            console.error(`Ошибка обновления вопроса ${qId}:`, e);
          }
        }

        // ✅ 5. Обновляем статус проекта
        await api.patch(`/api/projects/${project.ID}/`);

        // 6. Обновляем локальные данные
        project.questionsDistributed = true;
        this.successMessage = `Вопросы распределены для "${project.Title}"!`;
        await this.loadStudentsForProject(project.ID);
        await this.loadQuestionsForProject(project.ID);
      } catch (error) {
        console.error("Ошибка распределения вопросов:", error);
        this.errorMessage = "Ошибка: " + error.message;
      } finally {
        this.distributingQuestions[project.ID] = false;
      }
    },

    // Генерация DOCX для одного студента
    async generateDocxForStudent(student, project) {
      if (!this.templateBuffer) {
        alert("Шаблон документа не загружен");
        return;
      }
      if (!project.questionsDistributed) {
        alert("Сначала распределите вопросы");
        return;
      }

      this.generatingDocx[student.ID] = true;

      try {
        // Находим протокол студента
        const protoRes = await api.get("/api/protocols/", {
          params: {
            ID_Student: student.ID,
            ID_DefenseSchedule: this.selectedDefense,
          },
        });
        if (!protoRes.data?.length) {
          alert("Протокол не найден для студента");
          return;
        }
        const protocol = protoRes.data[0];

        const templateData = await this.prepareTemplateData(
          student,
          protocol,
          project
        );

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
        link.download = `Протокол_${
          protocol.Number || protocol.ID
        }_${templateData.student.replace(/\s+/g, "_")}.docx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        this.successMessage = `Протокол для ${student.Surname} сгенерирован!`;
      } catch (error) {
        console.error("Ошибка генерации DOCX:", error);
        alert("Ошибка: " + error.message);
      } finally {
        this.generatingDocx[student.ID] = false;
      }
    },

    async generateAllDocx(project) {
      const students = this.students[project.ID];
      if (!students?.length) {
        this.errorMessage = "Нет студентов для генерации";
        return;
      }
      if (!this.templateBuffer) {
        alert("Шаблон не загружен");
        return;
      }
      if (!project.questionsDistributed) {
        alert("Сначала распределите вопросы");
        return;
      }

      this.generatingDocx[project.ID] = true;
      this.clearMessages();

      try {
        let successCount = 0;
        // ✅ Последовательная генерация
        for (const student of students) {
          try {
            const protoRes = await api.get("/api/protocols/", {
              params: {
                ID_Student: student.ID,
                ID_DefenseSchedule: this.selectedDefense,
              },
            });
            if (protoRes.data?.length > 0) {
              await this.generateDocxForStudent(student, project);
              successCount++;
              // Небольшая пауза для обработки браузером
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          } catch (e) {
            console.error(`Ошибка генерации для ${student.Surname}:`, e);
          }
        }
        this.successMessage = `Сгенерировано: ${successCount} из ${students.length}`;
      } catch (error) {
        console.error("Ошибка массовой генерации:", error);
        this.errorMessage = "Ошибка при генерации протоколов";
      } finally {
        this.generatingDocx[project.ID] = false;
      }
    },

    // === ✅ Подготовка данных для шаблона ===
    async prepareTemplateData(student, protocol, project) {
      const specialization = student.ID_Specialization;
      const commission = protocol.ID_DefenseSchedule?.ID_Commission;
      const defenseSchedule = protocol.ID_DefenseSchedule;

      const startTime = this.parseTime(protocol.DefenseStartTime);
      const endTime = this.parseTime(protocol.DefenseEndTime);
      const dateTime = this.formatDateTimeForDoc(defenseSchedule?.DateTime);

      // === Загрузка состава комиссии (ИСПРАВЛЕННЫЙ ВАРИАНТ) ===
      let commissionMembers = [];
      if (commission?.ID) {
        try {
          // ✅ Запрос к списку с фильтром по ID комиссии
          // Эндпоинт: /api/composition/?commission_id=5
          const response = await api.get(
            `/api/commission_compositions/?commission_id=${commission.ID}`
          );

          // DRF по умолчанию возвращает "плоский" список (массив),
          // но на всякий случай проверяем тип данных
          commissionMembers = Array.isArray(response.data)
            ? response.data
            : response.data.results || []; // Если используется пагинация

          // ✅ Если нужны только данные участников (без роли и лишнего), можно "вытащить" их:
          // commissionMembers = commissionMembers.map(item => item.ID_Member);
        } catch (e) {
          console.error("Ошибка загрузки состава комиссии:", e);
          commissionMembers = []; // Сбрасываем при ошибке
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
      let studentDative = this.getFullName(student);
      try {
        const dative = await api.post("/api/fio_to_dative/", {
          fio: this.getFullName(student),
        });
        studentDative = dative.data.dative_fio;
      } catch (e) {
        console.error("Ошибка склонения:", e);
      }

      return {
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
        // В методе prepareTemplateData, внутри return:
        qualification:
          this.getQualificationName(student.ID_Qualification, student) ||
          "Не указана",
        secretary: secretary
          ? this.getInitials(secretary.ID_Member)
          : "Не указан",
        question1,
        question2,
        number: protocol.Number || "Не указан",
        members: members.map((m) => ({ name: this.getInitials(m.ID_Member) })),
      };
    },

    //  4. Утверждение проекта (последовательное обновление статусов) ===
    async approveProject(project) {
      const students = this.students[project.ID];
      if (!students?.length) {
        this.errorMessage = "Нет студентов для утверждения";
        return;
      }
      if (!project.questionsDistributed) {
        alert("Сначала распределите вопросы");
        return;
      }
      if (
        !confirm(
          `Утвердить протоколы для всех ${students.length} студентов проекта "${project.Title}"?`
        )
      )
        return;

      this.approvingProject[project.ID] = true;
      this.clearMessages();

      try {
        for (const student of students) {
          const qualId = this.selectedQualifications[student.ID];
          // Обновляем только если квалификация изменена или выбрана впервые
          if (qualId !== undefined && qualId !== student.ID_Qualification) {
            const success = await this.updateStudentQualification(
              student.ID,
              qualId
            );
            if (success) {
              // Обновляем локально, чтобы отобразить в интерфейсе
              student.ID_Qualification = qualId;
            }
          }
        }
        // ✅ Последовательное утверждение каждого протокола
        for (const student of students) {
          try {
            const protoRes = await api.get("/api/protocols/", {
              params: {
                ID_Student: student.ID,
                ID_DefenseSchedule: this.selectedDefense,
              },
            });
            if (protoRes.data?.length > 0) {
              const protocol = protoRes.data[0];
              // ✅ Обновляем статус протокола
              await api.patch(`/api/protocols/${protocol.ID}/`, {
                Status: true,
              });
              // ✅ Обновляем локально данные студента
              student.Grade = protocol.Grade || student.Grade;

              // ✅ Загружаем вопросы для студента
              student.questions = {};
              if (protocol.ID_Question) {
                try {
                  const q1 = await api.get(
                    `/api/questions/${protocol.ID_Question}/`
                  );
                  student.questions.question1 = q1.data.Text;
                } catch (e) {
                  console.error("Ошибка вопроса 1:", e);
                }
              }
              if (protocol.ID_Question2) {
                try {
                  const q2 = await api.get(
                    `/api/questions/${protocol.ID_Question2}/`
                  );
                  student.questions.question2 = q2.data.Text;
                } catch (e) {
                  console.error("Ошибка вопроса 2:", e);
                }
              }

              // ✅ Сохраняем время защиты
              if (protocol.DefenseStartTime && protocol.DefenseEndTime) {
                this.projectDefenseTimes[project.ID] = {
                  startTime: this.formatTime(protocol.DefenseStartTime),
                  endTime: this.formatTime(protocol.DefenseEndTime),
                };
              }
            }
          } catch (e) {
            console.error(`Ошибка утверждения для студента ${student.ID}:`, e);
          }
        }

        // ✅ Обновляем статус проекта
        project.isApproved = true;
        project.questionsDistributed = true;

        this.successMessage = `Протоколы проекта "${project.Title}" успешно утверждены!`;

        // ✅ Перезагружаем студентов для отображения всех данных
        await this.loadStudentsForProject(project.ID);

        // ✅ УДАЛЯЕМ проект из списка после утверждения
        this.projects = this.projects.filter((p) => p.ID !== project.ID);

        // ✅ Очищаем данные проекта
        delete this.students[project.ID];
        delete this.questions[project.ID];
        delete this.projectDefenseTimes[project.ID];
        delete this.expandedProjects[project.ID];
      } catch (error) {
        console.error("Ошибка массового утверждения:", error);
        this.errorMessage = "Ошибка при утверждении протоколов";
      } finally {
        this.approvingProject[project.ID] = false;
      }
    },
  },
};
</script>

<style scoped>
protocol-generator {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}
h2 {
  color: #1e293b;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 700;
}
.filters-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.filter-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: opacity 0.3s;
}
.filter-card.disabled {
  opacity: 0.6;
  pointer-events: none;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.card-icon {
  font-size: 1.25rem;
}
.card-content {
  padding: 1rem;
}
h3 {
  color: #1e293b;
  font-weight: 600;
  margin: 0;
  font-size: 1.1rem;
}
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.9rem;
}
.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.loading-spinner-mini {
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
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.9rem;
}
.error-icon {
  font-size: 1.1rem;
}
.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
  color: #1e293b;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.filter-select:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
}
.projects-container {
  margin-top: 2rem;
}
.loading-container,
.error-container,
.no-data-container {
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
  font-weight: 500;
}
.retry-button:hover {
  background-color: #2563eb;
}
.projects-title {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}
.project-cards {
  display: grid;
  gap: 1.5rem;
}
.project-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}
.project-card.collapsed {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.project-card:hover {
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}
.project-header {
  padding: 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.project-title {
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}
.project-supervisor {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.supervisor-label {
  color: #64748b;
  font-weight: 500;
}
.supervisor-name {
  color: #1e293b;
}
.project-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}
.toggle-button {
  padding: 0.375rem 0.5rem;
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.toggle-button:hover {
  background-color: #e2e8f0;
  color: #475569;
}
.project-content {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
.students-section,
.questions-section {
  display: flex;
  flex-direction: column;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.section-icon {
  font-size: 1.1rem;
}
h5 {
  color: #1e293b;
  font-weight: 600;
  margin: 0;
  font-size: 1rem;
}
.loading-mini {
  margin-left: auto;
}
.error-mini {
  color: #ef4444;
  font-size: 0.85rem;
  padding: 0.5rem;
  background-color: #fee2e2;
  border-radius: 0.25rem;
}
.no-students,
.no-questions {
  color: #64748b;
  font-style: italic;
  font-size: 0.9rem;
  padding: 1rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 0.375rem;
}
.students-list,
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.student-item {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #fafbfc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.student-info {
  flex: 1;
}
.student-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
}
.student-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}
.student-group {
  color: #64748b;
}
.student-grade {
  color: #059669;
  font-weight: 500;
}
.student-questions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}
.questions-header {
  margin-bottom: 0.5rem;
}
.questions-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.85rem;
}
.assigned-questions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.assigned-question {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  line-height: 1.4;
}
.question-number {
  color: #4892b4;
  font-weight: 600;
  min-width: 1.5rem;
}
.question-text {
  color: #1e293b;
  flex: 1;
}
.question-item {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: #fafbfc;
  margin-bottom: 0.5rem;
}
.question-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.question-actions {
  display: flex;
  gap: 0.25rem;
}
.edit-btn,
.delete-btn,
.save-btn,
.cancel-btn {
  padding: 0.25rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  background: none;
}
.edit-btn:hover {
  background-color: #dbeafe;
}
.delete-btn:hover {
  background-color: #fee2e2;
}
.save-btn {
  background-color: #10b981;
  color: white;
}
.cancel-btn {
  background-color: #ef4444;
  color: white;
}
.question-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.question-edit-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  font-size: 0.85rem;
}
.question-edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.add-question-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.question-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  font-size: 0.85rem;
}
.add-question-btn {
  padding: 0.5rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.add-question-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
.messages-container {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
}
.success-message {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.message-icon {
  font-size: 1.25rem;
}

/* ✅ Стили для кнопок проекта */
.project-actions {
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.generate-all-docx-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}
.generate-all-docx-button:hover:not(:disabled) {
  background-color: #4f46e5;
}
.generate-all-docx-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
.approve-project-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}
.approve-project-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}
.approve-project-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.button-icon {
  font-size: 1rem;
}
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
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
.student-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}
.mini-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.mini-modal-content {
  background: white;
  border-radius: 0.5rem;
  width: 400px;
  max-width: 90%;
  max-height: 300px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.mini-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}
.mini-modal-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}
.mini-close-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}
.mini-close-button:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}
.mini-modal-body {
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}
.project-text-content {
  color: #1e293b;
  line-height: 1.5;
  font-size: 0.9rem;
  white-space: pre-wrap;
}
.project-defense-time {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
.time-label {
  color: #64748b;
  font-weight: 500;
}
.time-value {
  color: #1e293b;
  font-weight: 500;
}

@media (max-width: 768px) {
  .protocol-generator {
    padding: 1rem;
  }
  .filters-container {
    grid-template-columns: 1fr;
  }
  .project-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .student-details {
    flex-direction: column;
    gap: 0.25rem;
  }
  .mini-modal-content {
    width: 95%;
    margin: 1rem;
  }
  .student-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .student-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
.project-actions {
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.distribute-questions-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #8b5cf6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}
.distribute-questions-button:hover:not(:disabled) {
  background-color: #7c3aed;
}
.distribute-questions-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.generate-all-docx-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}
.generate-all-docx-button:hover:not(:disabled) {
  background-color: #4f46e5;
}
.generate-all-docx-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.approve-project-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}
.approve-project-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}
.approve-project-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.approved-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #dcfce7;
  color: #166534;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid #bbf7d0;
}

.button-icon {
  font-size: 1rem;
}
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
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
.student-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}
/* === Стили для выбора квалификации === */
.student-qualification {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.qualification-label {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.qualification-select-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qualification-select {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  background-color: white;
  color: #1e293b;
  transition: border-color 0.2s;
}

.qualification-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.qualification-select:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
  color: #94a3b8;
}

.loading-qual-mini {
  font-size: 0.9rem;
  color: #64748b;
}

/* Бейдж утверждённой квалификации */
.student-qualification-approved {
  margin-top: 0.75rem;
}

.qualification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
}
</style>
