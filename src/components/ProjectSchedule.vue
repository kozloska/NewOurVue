<template>
  <div class="schedule-container">
    <div class="schedule-header">
      <h1>Расписание защиты проектов</h1>
      <div class="header-info">
        <div class="year-info">{{ currentYear }} год</div>
        <div class="stats">
          <span class="stat-item">
            <CalendarIcon class="stat-icon" />
            Дат защиты: {{ defenseSchedules.length }}
          </span>
          <span class="stat-item">
            <FolderIcon class="stat-icon" />
            Нераспределенных проектов: {{ unassignedProjects.length }}
          </span>
        </div>
      </div>
    </div>

    <div class="schedule-content">
      <div class="unassigned-pool">
        <div class="pool-header">
          <h2>
            <FolderIcon class="section-icon" />
            Нераспределенные проекты
          </h2>
          <div class="pool-count">{{ unassignedProjects.length }}</div>
        </div>

        <div class="projects-grid" v-if="unassignedProjects.length > 0">
          <div
            v-for="project in unassignedProjects"
            :key="project.ID"
            class="project-card"
            :class="{ selected: selectedProjects.includes(project.ID) }"
            @click="toggleProjectSelection(project.ID)"
          >
            <div class="project-header">
              <div class="project-id">#{{ project.ID }}</div>
              <div class="project-status">{{ project.Status }}</div>
              <div class="project-checkbox">
                <input
                  type="checkbox"
                  :checked="selectedProjects.includes(project.ID)"
                  @click.stop
                  @change="toggleProjectSelection(project.ID)"
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
                v-if="getProjectStudents(project.ID).length > 0"
              >
                <UsersIcon class="detail-icon" />
                {{
                  getProjectStudents(project.ID)
                    .map((s) => `${s.Surname} ${s.Name}`)
                    .join(", ")
                }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-pool">
          <CheckCircleIcon class="empty-icon" />
          <p>Все проекты распределены</p>
        </div>

        <div v-if="selectedProjects.length > 0" class="selected-projects-panel">
          <div class="selected-info">
            <span>Выбрано проектов: {{ selectedProjects.length }}</span>
            <button @click="clearSelection" class="clear-btn">
              <XIcon class="btn-icon" />
              Очистить
            </button>
          </div>
        </div>
      </div>

      <div class="defense-schedule">
        <div class="schedule-header-section">
          <h2>
            <CalendarIcon class="section-icon" />
            Расписание защит
          </h2>
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            <RefreshCwIcon class="btn-icon" :class="{ spinning: loading }" />
            Обновить
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка расписания...</p>
        </div>

        <div v-else-if="defenseSchedules.length === 0" class="empty-schedule">
          <CalendarXIcon class="empty-icon" />
          <p>Нет запланированных защит на {{ currentYear }} год</p>
        </div>

        <div v-else class="schedule-grid">
          <div
            v-for="schedule in sortedSchedules"
            :key="schedule.ID"
            class="schedule-card"
          >
            <div class="schedule-header-card">
              <div class="schedule-datetime">
                <div class="schedule-date">
                  {{ formatDate(schedule.DateTime) }}
                </div>
                <div class="schedule-time">
                  {{ formatTime(schedule.DateTime) }}
                </div>
              </div>
              <div class="schedule-info">
                <div class="schedule-class">
                  <MapPinIcon class="info-icon" />
                  {{ schedule.Class }}
                </div>
                <div class="schedule-capacity">
                  <UsersIcon class="info-icon" />
                  {{ getAssignedCount(schedule.ID) }} / {{ schedule.Count }}
                </div>
              </div>
            </div>

            <div
              class="assigned-projects"
              v-if="getAssignedProjects(schedule.ID).length > 0"
            >
              <div
                v-for="project in getAssignedProjects(schedule.ID)"
                :key="project.ID"
                class="assigned-project"
              >
                <div class="assigned-project-header">
                  <span class="assigned-project-id">#{{ project.ID }}</span>
                  <button
                    @click="unassignProject(project, schedule)"
                    class="unassign-btn"
                    title="Убрать из расписания"
                    :disabled="assigningProjects"
                  >
                    <XIcon class="unassign-icon" />
                  </button>
                </div>
                <div class="assigned-project-title">{{ project.Title }}</div>
                <div class="assigned-project-student">
                  {{
                    getProjectStudents(project.ID)
                      .map((s) => `${s.Surname} ${s.Name}`)
                      .join(", ")
                  }}
                </div>
              </div>
            </div>

            <div class="assignment-section">
              <div
                v-if="
                  selectedProjects.length > 0 && getAvailableSlots(schedule) > 0
                "
                class="assign-controls"
              >
                <div class="assign-info">
                  <span
                    >Назначить
                    {{
                      Math.min(
                        selectedProjects.length,
                        getAvailableSlots(schedule)
                      )
                    }}
                    проект(ов)</span
                  >
                  <span class="slots-info">
                    (свободно мест: {{ getAvailableSlots(schedule) }})
                  </span>
                </div>
                <button
                  @click="assignSelectedProjects(schedule)"
                  class="assign-btn"
                  :disabled="assigningProjects"
                >
                  <CheckIcon class="btn-icon" />
                  {{ assigningProjects ? "Назначение..." : "Назначить" }}
                </button>
              </div>

              <div
                v-else-if="getAvailableSlots(schedule) === 0"
                class="schedule-full"
              >
                <AlertCircleIcon class="full-icon" />
                <span>Все места заняты</span>
              </div>

              <div v-else class="no-selection">
                <InfoIcon class="info-icon" />
                <span>Выберите проекты для назначения</span>
              </div>
            </div>
          </div>
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
import { ref, computed, onMounted } from "vue";
import axios from "axios";
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
} from "lucide-vue-next";

const defenseSchedules = ref([]);
const projects = ref([]);
const students = ref([]);
const protocols = ref([]);
const selectedProjects = ref([]);
const assigningProjects = ref(false);
const loading = ref(false);
const notifications = ref([]);
const currentYear = new Date().getFullYear();

const abortController = ref(null);

const sortedSchedules = computed(() => {
  return [...defenseSchedules.value].sort(
    (a, b) => new Date(a.DateTime) - new Date(b.DateTime)
  );
});

const unassignedProjects = computed(() => {
  const assignedProjectIds = new Set();

  protocols.value.forEach((protocol) => {
    if (protocol.ID_DefenseSchedule && protocol.ID_Student?.ID_Project) {
      assignedProjectIds.add(protocol.ID_Student.ID_Project.ID);
    }
  });

  return projects.value.filter(
    (project) => !assignedProjectIds.has(project.ID)
  );
});

const loadDefenseSchedules = async () => {
  try {
    let allSchedules = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get("http://localhost:8000/api/defenses/", {
        params: {
          page_size: 100,
          page: page,
          signal: abortController.value.signal,
        },
      });

      const data = response.data.results || response.data;
      allSchedules = [...allSchedules, ...data];

      hasMore = response.data.next ? true : false;
      page++;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const currentYearSchedules = allSchedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.DateTime);
      const scheduleYear = scheduleDate.getFullYear();
      return scheduleYear === currentYear;
    });

    defenseSchedules.value = currentYearSchedules;
    console.log(
      `Загружено ${defenseSchedules.value.length} расписаний защит для ${currentYear} года`
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки расписания защит:", error);
      addNotification("Ошибка загрузки расписания защит", "error");
    }
  }
};

const loadProjects = async () => {
  try {
    let allProjects = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get("http://localhost:8000/api/projects/", {
        params: {
          page_size: 100,
          page: page,
          signal: abortController.value.signal,
        },
      });

      const data = response.data.results || response.data;
      allProjects = [...allProjects, ...data];

      hasMore = response.data.next ? true : false;
      page++;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    projects.value = allProjects;
    console.log(`Загружено ${projects.value.length} проектов`);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки проектов:", error);
      addNotification("Ошибка загрузки проектов", "error");
    }
  }
};

const loadStudents = async () => {
  try {
    let allStudents = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get("http://localhost:8000/api/students/", {
        params: {
          page_size: 100,
          page: page,
          signal: abortController.value.signal,
        },
      });

      const data = response.data.results || response.data;
      allStudents = [...allStudents, ...data];

      hasMore = response.data.next ? true : false;
      page++;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    students.value = allStudents;
    console.log(`Загружено ${students.value.length} студентов`);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки студентов:", error);
      addNotification("Ошибка загрузки студентов", "error");
    }
  }
};

const loadProtocols = async () => {
  try {
    let allProtocols = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get("http://localhost:8000/api/protocols/", {
        params: {
          page_size: 100,
          page: page,
          signal: abortController.value.signal,
        },
      });

      const data = response.data.results || response.data;
      allProtocols = [...allProtocols, ...data];

      hasMore = response.data.next ? true : false;
      page++;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (allProtocols) {
      protocols.value = allProtocols;
    } else {
      protocols.value = [];
    }

    console.log(`Загружено ${protocols.value.length} протоколов`);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки протоколов:", error);
      if (protocols.value.length === 0) {
        console.warn(
          "Протоколы не загружены, но это может быть нормально при первом запуске"
        );
      } else {
        addNotification("Ошибка загрузки протоколов", "error");
      }
    }
  }
};

const getProjectStudents = (projectId) => {
  return students.value.filter(
    (student) => student.ID_Project?.ID === projectId
  );
};

const getAssignedProjects = (scheduleId) => {
  const assignedProjectIds = protocols.value
    .filter((protocol) => protocol.ID_DefenseSchedule?.ID === scheduleId)
    .map((protocol) => protocol.ID_Student?.ID_Project?.ID)
    .filter(Boolean);

  return projects.value.filter((project) =>
    assignedProjectIds.includes(project.ID)
  );
};

const getAssignedCount = (scheduleId) => {
  return getAssignedProjects(scheduleId).length;
};

const getAvailableSlots = (schedule) => {
  return schedule.Count - getAssignedCount(schedule.ID);
};

const toggleProjectSelection = (projectId) => {
  const index = selectedProjects.value.indexOf(projectId);
  if (index > -1) {
    selectedProjects.value.splice(index, 1);
  } else {
    selectedProjects.value.push(projectId);
  }
};

const clearSelection = () => {
  selectedProjects.value = [];
};

const assignSelectedProjects = async (schedule) => {
  if (selectedProjects.value.length === 0) return;

  const availableSlots = getAvailableSlots(schedule);
  if (availableSlots === 0) {
    addNotification("Нет свободных мест в этом расписании", "error");
    return;
  }

  assigningProjects.value = true;

  try {
    const projectsToAssign = selectedProjects.value.slice(0, availableSlots);
    let successCount = 0;
    let errorCount = 0;

    for (const projectId of projectsToAssign) {
      try {
        const studentsResponse = await axios.get(
          "http://localhost:8000/api/students/",
          {
            params: {
              ID_Project: projectId,
              signal: abortController.value.signal,
            },
          }
        );

        const projectStudents =
          studentsResponse.data.results || studentsResponse.data;
        console.log(
          `Найдено ${projectStudents.length} студентов для проекта ${projectId}`
        );

        if (projectStudents.length === 0) {
          console.warn(`У проекта ${projectId} нет студентов`);
          errorCount++;
          continue;
        }

        for (const student of projectStudents) {
          try {
            const protocolResponse = await axios.get(
              "http://localhost:8000/api/protocols/",
              {
                params: {
                  ID_Student: student.ID,
                  signal: abortController.value.signal,
                },
              }
            );

            const studentProtocols =
              protocolResponse.data.results || protocolResponse.data;

            if (studentProtocols.length > 0) {
              const protocol = studentProtocols[0]; 

              await axios.patch(
                `http://localhost:8000/api/protocols/${protocol.ID}/`,
                {
                  ID_DefenseSchedule: schedule.ID,
                }
              );

              const protocolIndex = protocols.value.findIndex(
                (p) => p.ID === protocol.ID
              );
              if (protocolIndex !== -1) {
                protocols.value[protocolIndex].ID_DefenseSchedule = {
                  ID: schedule.ID,
                  DateTime: schedule.DateTime,
                  Count: schedule.Count,
                  Class: schedule.Class,
                };
              }

              console.log(
                `Протокол ${protocol.ID} студента ${student.ID} обновлен`
              );
            } else {
              console.warn(`Протокол для студента ${student.ID} не найден`);
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              console.error(
                `Ошибка обновления протокола для студента ${student.ID}:`,
                error
              );
            }
          }
        }

        successCount++;

        const index = selectedProjects.value.indexOf(projectId);
        if (index > -1) {
          selectedProjects.value.splice(index, 1);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(`Ошибка назначения проекта ${projectId}:`, error);
          errorCount++;
        }
      }
    }

    if (successCount > 0) {
      addNotification(
        `Успешно назначено ${successCount} проект(ов) на ${formatDate(
          schedule.DateTime
        )} ${formatTime(schedule.DateTime)}`,
        "success"
      );
    }

    if (errorCount > 0) {
      addNotification(`Ошибка назначения ${errorCount} проект(ов)`, "error");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка назначения проектов:", error);
      addNotification("Ошибка при назначении проектов", "error");
    }
  } finally {
    assigningProjects.value = false;
  }
};

const unassignProject = async (project, schedule) => {
  try {
    assigningProjects.value = true;

    const studentsResponse = await axios.get(
      "http://localhost:8000/api/students/",
      {
        params: {
          ID_Project: project.ID,
          signal: abortController.value?.signal,
        },
      }
    );

    const projectStudents =
      studentsResponse.data.results || studentsResponse.data;

    for (const student of projectStudents) {
      try {
        const protocolResponse = await axios.get(
          "http://localhost:8000/api/protocols/",
          {
            params: {
              ID_Student: student.ID,
              signal: abortController.value?.signal,
            },
          }
        );

        const studentProtocols =
          protocolResponse.data.results || protocolResponse.data;

        if (studentProtocols.length > 0) {
          const protocol = studentProtocols[0];

          if (protocol.ID_DefenseSchedule?.ID === schedule.ID) {
            await axios.patch(
              `http://localhost:8000/api/protocols/${protocol.ID}/`,
              {
                ID_DefenseSchedule: null,
              }
            );

            const protocolIndex = protocols.value.findIndex(
              (p) => p.ID === protocol.ID
            );
            if (protocolIndex !== -1) {
              protocols.value[protocolIndex].ID_DefenseSchedule = null;
            }

            console.log(
              `Протокол ${protocol.ID} студента ${student.ID} освобожден`
            );
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            `Ошибка освобождения протокола для студента ${student.ID}:`,
            error
          );
        }
      }
    }

    addNotification(`Проект "${project.Title}" убран из расписания`, "info");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка отмены назначения проекта:", error);
      addNotification("Ошибка при отмене назначения проекта", "error");
    }
  } finally {
    assigningProjects.value = false;
  }
};

const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return "Не указана";

  const date = new Date(dateTimeStr);

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return "Не указано";

  const date = new Date(dateTimeStr);

  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
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


const refreshData = async () => {
  if (abortController.value) {
    abortController.value.abort();
  }

  abortController.value = new AbortController();
  loading.value = true;

  try {
    await loadDefenseSchedules();
    await loadProjects();
    await loadStudents();
    await loadProtocols();

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
    if (protocols.value.length === 0) {
      console.log("Повторная попытка загрузки протоколов...");
      await loadProtocols();
    }
  }, 1000);
});
</script>

<style scoped>
.schedule-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.schedule-header {
  margin-bottom: 2rem;
}

.schedule-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.year-info {
  font-size: 1.125rem;
  font-weight: 600;
  color: #3b82f6;
  background: #dbeafe;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
}

.schedule-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

/* Пул нераспределенных проектов */
.unassigned-pool {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
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

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.project-id {
  font-weight: 600;
  color: #3b82f6;
}

.project-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  color: #d97706;
  border-radius: 0.25rem;
}

.project-checkbox input {
  width: 1rem;
  height: 1rem;
}

.project-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.project-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-supervisor,
.project-students {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-icon {
  width: 0.875rem;
  height: 0.875rem;
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
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.clear-btn:hover {
  background: #dc2626;
}

.empty-pool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: #10b981;
  margin-bottom: 1rem;
}

/* Расписание защит */
.defense-schedule {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.schedule-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
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
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
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
}

.schedule-time {
  color: #6b7280;
  font-size: 0.875rem;
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
  margin-bottom: 0.5rem;
}

.assigned-project-id {
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.875rem;
}

.unassign-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.unassign-btn:hover:not(:disabled) {
  background: #fee2e2;
}

.unassign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unassign-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.assigned-project-title {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.assigned-project-student {
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
  transition: background-color 0.2s;
  font-weight: 500;
}

.assign-btn:hover:not(:disabled) {
  background: #059669;
}

.assign-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.schedule-full,
.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.schedule-full {
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

/* Уведомления */
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

@media (max-width: 1200px) {
  .schedule-content {
    grid-template-columns: 1fr;
  }

  .schedule-container {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .header-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    flex-direction: column;
    gap: 0.5rem;
  }

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
}
</style>
