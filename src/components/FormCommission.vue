<template>
  <div class="commission-form">
    <h2>Формирование комиссии</h2>

    <div class="form-container">
      <div class="left-column">
        <div class="form-card specialization-card">
          <div class="card-header">
            <div class="card-icon">🎓</div>
            <h3>Специализация</h3>
          </div>
          <div class="card-content">
            <div class="form-group">
              <label for="specialization-select">Специализация:</label>
              <select
                id="specialization-select"
                v-model="selectedSpecialization"
                class="form-select"
                :disabled="loadingSpecializations"
              >
                <option value="" disabled>
                  {{
                    loadingSpecializations
                      ? "Загрузка..."
                      : "Выберите специализацию"
                  }}
                </option>
                <option
                  v-for="specialization in specializations"
                  :key="specialization.ID"
                  :value="specialization.ID"
                >
                  {{ specialization.Name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-card commission-name-card">
          <div class="card-header">
            <div class="card-icon">📝</div>
            <h3>Название комиссии</h3>
          </div>
          <div class="card-content">
            <div class="form-group">
              <label for="commission-name">Название комиссии:</label>
              <input
                id="commission-name"
                v-model="commissionName"
                type="text"
                placeholder="Введите название комиссии"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <div class="form-card main-members-card">
          <div class="card-header">
            <div class="card-icon">👑</div>
            <h3>Председатель комиссии</h3>
          </div>
          <div class="card-content">
            <div class="form-group">
              <label for="chairman">Председатель комиссии:</label>
              <select
                id="chairman"
                v-model="selectedChairman"
                class="form-select"
              >
                <option value="" disabled selected>
                  Выберите председателя
                </option>
                <option
                  v-for="member in availableChairmanMembers"
                  :key="member.ID"
                  :value="member.ID"
                >
                  {{ fullName(member) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="createCommission"
            class="action-button submit-button"
            :disabled="!canSubmit || creating"
          >
            <span class="button-icon">{{ creating ? "⏳" : "✓" }}</span>
            {{ creating ? "Создание..." : "Сформировать комиссию" }}
          </button>
        </div>
      </div>

      <div class="right-column">
        <div class="form-card members-card">
          <div class="card-header">
            <div class="card-icon">👥</div>
            <h3>Члены комиссии</h3>
            <button
              @click="addMember"
              class="action-button add-button small-button"
              title="Добавить члена комиссии"
            >
              <span>+</span>
            </button>
          </div>
          <div class="card-content">
            <div class="members-list">
              <div
                v-for="(memberId, index) in selectedMembers"
                :key="`member-${index}`"
                class="member-item"
              >
                <div class="form-group member-select">
                  <label>Член комиссии {{ index + 1 }}:</label>
                  <div class="select-with-action">
                    <select
                      v-model="selectedMembers[index]"
                      class="form-select"
                    >
                      <option value="" disabled selected>
                        Выберите члена комиссии
                      </option>
                      <option
                        v-for="member in getAvailableMembersForIndex(index)"
                        :key="member.ID"
                        :value="member.ID"
                      >
                        {{ fullName(member) }}
                      </option>
                    </select>
                    <button
                      @click="removeMember(index)"
                      class="remove-button"
                      title="Удалить члена комиссии"
                    >
                      <span>✕</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="successMessage" class="message success">
      <div class="message-icon">✅</div>
      <span>{{ successMessage }}</span>
    </div>

    <div v-if="errorMessage" class="message error">
      <div class="message-icon">❌</div>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      selectedSpecialization: "",
      specializations: [],
      loadingSpecializations: false,
      commissionName: "",
      selectedChairman: "",
      selectedMembers: ["", "", ""],

      commissionMembersList: [],
      creating: false,
      successMessage: "",
      errorMessage: "",
      secretaryId: null,
    };
  },
  async mounted() {
    await this.loadData();
    this.initializeSecretary();
  },
  computed: {
    canSubmit() {
      return (
        this.selectedSpecialization &&
        this.commissionName.trim() &&
        this.selectedChairman &&
        this.selectedMembers.some((id) => id)
      );
    },

    availableChairmanMembers() {
      const usedIds = this.selectedMembers.filter((id) => id);
      return this.commissionMembersList.filter(
        (m) => !usedIds.includes(m.ID) && m.ID !== this.secretaryId
      );
    },
  },
  methods: {
    initializeSecretary() {
      const secretary = JSON.parse(localStorage.getItem("secretary"));
      if (secretary?.ID) {
        this.secretaryId = secretary.ID;
        console.log("ID секретаря:", this.secretaryId);
        console.log("Данные секретаря:", secretary);
      } else {
        this.errorMessage =
          "ID секретаря не найден. Пожалуйста, войдите в систему заново.";
      }
    },

    async loadData() {
      try {
        this.loadingSpecializations = true;
        const specializationsRes = await axios.get(
          "http://localhost:8000/api/specializations/"
        );
        this.specializations = specializationsRes.data;

        const membersRes = await axios.get(
          "http://localhost:8000/api/commission_members/"
        );
        this.commissionMembersList = membersRes.data;
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        this.errorMessage = "Ошибка загрузки данных";
      } finally {
        this.loadingSpecializations = false;
      }
    },

    fullName(member) {
      return `${member.Surname} ${member.Name} ${member.Patronymic}`;
    },

    getAvailableMembersForIndex(index) {
      const usedIds = [
        this.selectedChairman,
        ...this.selectedMembers.filter(
          (_, i) => i !== index && this.selectedMembers[i]
        ),
      ].filter((id) => id);

      return this.commissionMembersList.filter(
        (m) => !usedIds.includes(m.ID) && m.ID !== this.secretaryId
      );
    },

    addMember() {
      this.selectedMembers.push("");
    },

    removeMember(index) {
      if (this.selectedMembers.length > 1) {
        this.selectedMembers.splice(index, 1);
      }
    },

    async createCommission() {
      if (!this.canSubmit) {
        this.errorMessage = "Заполните все обязательные поля";
        return;
      }

      if (!this.secretaryId) {
        this.errorMessage = "ID секретаря не найден";
        return;
      }

      if (!this.selectedSpecialization) {
        this.errorMessage = "Выберите специализацию";
        return;
      }

      if (this.selectedChairman === this.secretaryId) {
        this.errorMessage = "Секретарь не может быть председателем комиссии";
        return;
      }

      if (this.selectedMembers.includes(this.secretaryId)) {
        this.errorMessage = "Секретарь не может быть членом комиссии";
        return;
      }

      try {
        this.creating = true;
        this.errorMessage = "";
        this.successMessage = "";

        const commissionData = {
          Name: this.commissionName.trim(),
          ID_Specialization: parseInt(this.selectedSpecialization),
        };

        console.log("Отправляем данные комиссии:", commissionData);

        const commissionResponse = await axios.post(
          "http://localhost:8000/api/commissions/",
          commissionData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Ответ сервера при создании комиссии:",
          commissionResponse.data
        );
        const commissionId = commissionResponse.data.ID;

        console.log("Добавляем председателя:", this.selectedChairman);
        await axios.post("http://localhost:8000/api/commission_compositions/", {
          ID_Commission: commissionId,
          ID_Member: parseInt(this.selectedChairman),
          Role: "Председатель",
        });

        const validMembers = this.selectedMembers.filter((id) => id);
        console.log("Добавляем членов комиссии:", validMembers);

        for (const memberId of validMembers) {
          await axios.post(
            "http://localhost:8000/api/commission_compositions/",
            {
              ID_Commission: commissionId,
              ID_Member: parseInt(memberId),
              Role: "Член аттестационной комиссии",
            }
          );
        }

        console.log("Добавляем секретаря:", this.secretaryId);
        await axios.post("http://localhost:8000/api/commission_compositions/", {
          ID_Commission: commissionId,
          ID_Member: parseInt(this.secretaryId),
          Role: "Секретарь",
        });

        this.successMessage = `Комиссия "${this.commissionName}" успешно сформирована!`;
        this.resetForm();
      } catch (error) {
        console.error("Ошибка создания комиссии:", error);
        console.error("Детали ошибки:", error.response?.data);
        console.error("Статус ошибки:", error.response?.status);

        let errorMsg = "Ошибка при создании комиссии: ";

        if (error.response?.data) {
          if (typeof error.response.data === "string") {
            errorMsg += error.response.data;
          } else if (error.response.data.Name) {
            errorMsg += `Название: ${error.response.data.Name[0]}`;
          } else if (error.response.data.ID_Specialization) {
            errorMsg += `Специализация: ${error.response.data.ID_Specialization[0]}`;
          } else if (error.response.data.message) {
            errorMsg += error.response.data.message;
          } else if (error.response.data.detail) {
            errorMsg += error.response.data.detail;
          } else {
            errorMsg += JSON.stringify(error.response.data);
          }
        } else {
          errorMsg += error.message;
        }

        this.errorMessage = errorMsg;
      } finally {
        this.creating = false;
      }
    },

    resetForm() {
      this.selectedSpecialization = "";
      this.commissionName = "";
      this.selectedChairman = "";
      this.selectedMembers = ["", "", ""];
    },
  },
};
</script>

<style scoped>
.commission-form {
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
  font-weight: 600;
  margin: 0;
  font-size: 1.25rem;
}

.form-container {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 40%;
  min-width: 350px;
}

.right-column {
  flex: 1;
  min-width: 350px;
}

.form-card {
  border: 1px solid #adafb3;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  height: fit-content;
}

.specialization-card,
.commission-name-card,
.main-members-card {
  width: 100%;
}

.members-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-icon {
  font-size: 1.5rem;
}

.card-content {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.mb-0 {
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
  color: #1e293b;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background-color: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
}

.member-item {
  width: 100%;
}

.select-with-action {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.select-with-action .form-select {
  flex: 1;
}

.remove-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #fee2e2;
  color: #dc2626;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.remove-button:hover {
  background-color: #fecaca;
}

.small-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  margin-left: auto;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-button {
  background-color: #4ade80;
  color: white;
}

.add-button:hover {
  background-color: #22c55e;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  font-size: 1.1rem;
  padding: 0.75rem 1.75rem;
  width: 100%;
}

.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.button-icon {
  font-size: 1.1rem;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message.success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.message.error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message-icon {
  font-size: 1.25rem;
}

@media (max-width: 900px) {
  .form-container {
    flex-direction: column;
  }

  .left-column,
  .right-column {
    width: 100%;
  }

  .members-list {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .commission-form {
    padding: 0.75rem;
  }

  .card-content {
    padding: 1rem;
  }
}
</style>
