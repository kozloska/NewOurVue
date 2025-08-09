<template>
  <div class="protocol-generator">
    <h2>Подтверждение протоколов</h2>

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
            <div class="project-header">
              <h4 class="project-title">{{ project.Title }}</h4>
              <div class="project-supervisor">
                <span class="supervisor-label">Руководитель:</span>
                <span class="supervisor-name">{{ project.Supervisor }}</span>
              </div>

              <div
                v-if="projectDefenseTimes[project.ID]"
                class="project-defense-time"
              >
                <span class="time-label">Время защиты:</span>
                <span class="time-value"
                  >{{ projectDefenseTimes[project.ID].startTime }} -
                  {{ projectDefenseTimes[project.ID].endTime }}</span
                >
              </div>

              <div class="project-controls">
                <button @click="showProjectText(project)" class="text-button">
                  📄 Текст
                </button>
                <button
                  @click="toggleProjectCard(project.ID)"
                  class="toggle-button"
                >
                  {{ expandedProjects[project.ID] ? "▲" : "▼" }}
                </button>
              </div>
            </div>

            <div v-if="expandedProjects[project.ID]" class="project-content">
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
                  <div
                    v-for="student in students[project.ID]"
                    :key="student.ID"
                    class="student-item"
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
                        <span v-if="student.Grade" class="student-grade">
                          Оценка: {{ student.Grade }}
                        </span>
                      </div>

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
                    </div>
                  </div>
                </div>
              </div>

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
                    :disabled="!newQuestionText[project.ID]?.trim()"
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
            </div>

            <div class="project-actions">
              <button
                @click="generateProtocolForProject(project)"
                class="generate-protocol-button"
                :disabled="
                  !students[project.ID]?.length ||
                  generatingProtocol[project.ID]
                "
              >
                <span class="button-icon">
                  {{ generatingProtocol[project.ID] ? "⏳" : "📄" }}
                </span>
                {{
                  generatingProtocol[project.ID]
                    ? "Генерация..."
                    : "Сформировать протокол"
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import axios from "axios";

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

      generatingProtocol: {},

      successMessage: "",
      errorMessage: "",

      secretaryId: null,

      newQuestionText: {},
      editingQuestion: null,
      editQuestionText: "",

      showProjectTextModal: false,
      selectedProjectText: "",

      expandedProjects: {},
    };
  },

  mounted() {
    this.initializeSecretary();
    this.expandedProjects = {};
  },

  methods: {
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

    async loadSpecializations() {
      if (!this.secretaryId) return;

      this.loadingSpecializations = true;
      this.errorSpecializations = null;

      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/secretary_specialization/`,
          {
            params: {
              ID_Secretary: this.secretaryId,
              specialization_status: true,
            },
          }
        );
        this.specializations = response.data;
        console.log("Загружены направления:", this.specializations);
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
        const response = await axios.get(
          `http://127.0.0.1:8000/api/defenses/`,
          {
            params: {
              specialization_id: this.selectedSpecialization,
            },
          }
        );
        this.defenses = response.data;
        console.log("Загружены даты защиты:", this.defenses);
      } catch (error) {
        console.error("Ошибка загрузки дат защ��ты:", error);
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
        const response = await axios.get(
          `http://127.0.0.1:8000/api/projects/`,
          {
            params: {
              defense_schedule_id: this.selectedDefense,
            },
          }
        );
        this.projects = response.data;
        console.log("Загружены проекты:", this.projects);

        this.initializeExpandedProjects();

        this.projects.forEach((project) => {
          this.loadStudentsForProject(project.ID);
          this.loadQuestionsForProject(project.ID);
        });
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
        const response = await axios.get(
          `http://127.0.0.1:8000/api/students/`,
          {
            params: {
              ID_Project: projectId,
            },
          }
        );

        const students = response.data;

        for (const student of students) {
          try {
            const protocolResponse = await axios.get(
              "http://127.0.0.1:8000/api/protocols/",
              {
                params: {
                  ID_Student: student.ID,
                },
              }
            );

            if (protocolResponse.data && protocolResponse.data.length > 0) {
              const protocol = protocolResponse.data[0];
              student.Grade = protocol.Grade;

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
                  const q1Response = await axios.get(
                    `http://127.0.0.1:8000/api/questions/${protocol.ID_Question}/`
                  );
                  student.questions.question1 = q1Response.data.Text;
                } catch (error) {
                  console.error(
                    `Ошибка загрузки первого вопроса для студента ${student.ID}:`,
                    error
                  );
                }
              }

              if (protocol.ID_Question2) {
                try {
                  const q2Response = await axios.get(
                    `http://127.0.0.1:8000/api/questions/${protocol.ID_Question2}/`
                  );
                  student.questions.question2 = q2Response.data.Text;
                } catch (error) {
                  console.error(
                    `Ошибка загрузки второго вопроса для студента ${student.ID}:`,
                    error
                  );
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

        this.students[projectId] = students;
        console.log(`Загружены студенты для проекта ${projectId}:`, students);
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
        const response = await axios.get(
          `http://127.0.0.1:8000/api/questions/`,
          {
            params: {
              ID_Project: projectId,
              Status: false,
            },
          }
        );
        this.questions[projectId] = response.data;
        console.log(
          `Загружены вопросы для проекта ${projectId}:`,
          response.data
        );
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

    handleSpecializationChange() {
      this.selectedDefense = "";
      this.selectedDefenseData = null;
      this.defenses = [];
      this.projects = [];
      this.students = {};
      this.questions = {};
      this.clearMessages();

      if (this.selectedSpecialization) {
        this.loadDefenses();
      }
    },

    handleDefenseChange() {
      this.projects = [];
      this.students = {};
      this.questions = {};
      this.clearMessages();

      if (this.selectedDefense) {
        this.selectedDefenseData = this.defenses.find(
          (d) => d.ID === this.selectedDefense
        );
        this.loadProjects();
      }
    },

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
      if (!timeStr) return "Не указано";

      if (typeof timeStr === "string" && timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const timeParts = timeStr.split(":");
        const hours = timeParts[0];
        const minutes = timeParts[1];
        return `${hours}:${minutes}`;
      }

      try {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (error) {
        console.error("Ошибка форматирования времени:", error);
      }

      return "Не указано";
    },

    truncateText(text, maxLength) {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    },

    async distributeQuestions(projectId) {
      try {
        const questionsResponse = await axios.get(
          "http://127.0.0.1:8000/api/questions/",
          {
            params: {
              ID_Project: projectId,
              Status: false,
            },
          }
        );
        const questions = questionsResponse.data;

        const studentsResponse = await axios.get(
          "http://127.0.0.1:8000/api/students/",
          {
            params: { ID_Project: projectId },
          }
        );
        const students = studentsResponse.data;

        if (questions.length === 0) {
          throw new Error("Нет доступных вопросов для распределения");
        }

        if (students.length === 0) {
          throw new Error("Нет студентов для распределения вопросов");
        }

        if (questions.length < students.length) {
          throw new Error(
            `Недостаточно вопросов для распределения. Необходимо минимум ${students.length} вопросов, доступно: ${questions.length}`
          );
        }

        const shuffledQuestions = [...questions].sort(
          () => Math.random() - 0.5
        );

        const questionAssignments = [];
        const assignedQuestionIds = [];
        let questionIndex = 0;

        for (
          let i = 0;
          i < students.length && questionIndex < shuffledQuestions.length;
          i++
        ) {
          const student = students[i];
          const question = shuffledQuestions[questionIndex];

          questionAssignments.push({
            studentId: student.ID,
            question1Id: question.ID,
            question2Id: null,
          });

          assignedQuestionIds.push(question.ID);
          questionIndex++;
        }

        let studentIndex = 0;
        while (
          questionIndex < shuffledQuestions.length &&
          studentIndex < students.length
        ) {
          const question = shuffledQuestions[questionIndex];

          if (questionAssignments[studentIndex]) {
            questionAssignments[studentIndex].question2Id = question.ID;
            assignedQuestionIds.push(question.ID);
          }

          questionIndex++;
          studentIndex++;
        }

        for (const assignment of questionAssignments) {
          const protocolResponse = await axios.get(
            "http://127.0.0.1:8000/api/protocols/",
            {
              params: {
                ID_Student: assignment.studentId,
                ID_DefenseSchedule: this.selectedDefense,
              },
            }
          );

          if (protocolResponse.data && protocolResponse.data.length > 0) {
            const protocol = protocolResponse.data[0];

            const updateData = {};
            if (assignment.question1Id) {
              updateData.ID_Question = assignment.question1Id;
            }
            if (assignment.question2Id) {
              updateData.ID_Question2 = assignment.question2Id;
            }

            if (Object.keys(updateData).length > 0) {
              await axios.patch(
                `http://127.0.0.1:8000/api/protocols/${protocol.ID}/`,
                updateData
              );
            }
          }
        }

        for (const questionId of assignedQuestionIds) {
          try {
            await axios.patch(
              `http://127.0.0.1:8000/api/questions/${questionId}/`,
              { Status: true }
            );
          } catch (error) {
            console.error(
              `Ошибка обновления статуса вопроса ${questionId}:`,
              error
            );
          }
        }

        console.log(
          `Проект ${projectId}: распределено ${assignedQuestionIds.length} вопросов между ${students.length} студентами`
        );
        return {
          success: true,
          message: `Распределено ${assignedQuestionIds.length} вопросов между ${students.length} студентами`,
        };
      } catch (error) {
        console.error(
          `Ошибка распределения вопросов для проекта ${projectId}:`,
          error
        );
        throw error;
      }
    },

    async generateProtocolForProject(project) {
      const projectStudents = this.students[project.ID];
      if (!projectStudents || projectStudents.length === 0) {
        this.errorMessage = "Нет студентов для генерации протокола";
        return;
      }

      if (
        !confirm(
          "Вы уверены, что хотите сформировать протокол? Это действие также распределит вопросы между студентами."
        )
      ) {
        return;
      }

      this.generatingProtocol[project.ID] = true;
      this.clearMessages();

      try {
        try {
          await this.distributeQuestions(project.ID);
        } catch (error) {
          if (
            error.message &&
            error.message.includes("Недостаточно вопросов")
          ) {
            this.errorMessage = error.message;
            throw new Error(error.message);
          } else {
            throw error;
          }
        }

        await axios.patch(`http://127.0.0.1:8000/api/projects/${project.ID}/`);

        const updatePromises = projectStudents.map(async (student) => {
          try {
            const protocolResponse = await axios.get(
              "http://127.0.0.1:8000/api/protocols/",
              {
                params: {
                  ID_Student: student.ID,
                  ID_DefenseSchedule: this.selectedDefense,
                },
              }
            );

            if (protocolResponse.data && protocolResponse.data.length > 0) {
              const protocol = protocolResponse.data[0];
              return axios.patch(
                `http://127.0.0.1:8000/api/protocols/${protocol.ID}/`,
                { Status: true }
              );
            }
          } catch (error) {
            console.error(
              `Ошибка обновления протокола для студента ${student.ID}:`,
              error
            );
          }
        });

        await Promise.all(updatePromises.filter(Boolean));

        this.successMessage = `Протокол для проекта "${project.Title}" успешно сформирован и вопросы распределены`;

        await this.loadStudentsForProject(project.ID);
        await this.loadQuestionsForProject(project.ID);
      } catch (error) {
        console.error("Ошибка генерации протокола:", error);
        if (!this.errorMessage) {
          this.errorMessage =
            "Ошибка при генерации протокола: " + error.message;
        }
      } finally {
        this.generatingProtocol[project.ID] = false;
      }
    },

    async addQuestion(projectId) {
      const questionText = this.newQuestionText[projectId];
      if (!questionText?.trim()) return;

      try {
        await axios.post("http://127.0.0.1:8000/api/questions/", {
          Text: questionText.trim(),
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
        await axios.patch(
          `http://127.0.0.1:8000/api/questions/${questionId}/`,
          {
            Text: this.editQuestionText.trim(),
          }
        );

        this.cancelEdit();
        this.projects.forEach((project) => {
          this.loadQuestionsForProject(project.ID);
        });
        this.successMessage = "Вопрос успешно обновлен";
      } catch (error) {
        console.error("Ошибка сохранения вопроса:", error);
        this.errorMessage = "Ошибка при сохранении вопроса";
      }
    },

    async deleteQuestion(questionId, projectId) {
      if (!confirm("Вы уверены, что хотите удалить этот вопрос?")) return;

      try {
        await axios.delete(
          `http://127.0.0.1:8000/api/questions/${questionId}/`
        );
        await this.loadQuestionsForProject(projectId);
        this.successMessage = "Вопрос успешно удален";
      } catch (error) {
        console.error("Ошибка удаления вопроса:", error);
        this.errorMessage = "Ошибка при удалении вопроса";
      }
    },

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
  },
};
</script>

<style scoped>
.protocol-generator {
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

.text-button {
  padding: 0.375rem 0.75rem;
  background-color: #4892b4;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.text-button:hover {
  background-color: #3a7a9a;
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

.question-text {
  flex: 1;
  color: #1e293b;
  font-size: 0.85rem;
  line-height: 1.4;
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

.project-actions {
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.generate-protocol-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #4892b4;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.generate-protocol-button:hover:not(:disabled) {
  background-color: #3a7a9a;
}

.generate-protocol-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.button-icon {
  font-size: 1rem;
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
</style>
