<template>
  <div class="commission-form">
    <h2>Формирование комиссии</h2>

    <div class="form-container">
      <div class="left-column">
        <div class="form-card specialization-card">
          <div class="card-header">
            <div class="card-icon">🎓</div>
            <h3>Направление подготовки</h3>
          </div>
          <div class="card-content">
            <div class="form-group">
              <label for="specialization-select">Направление:</label>
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
                      : "Выберите направление"
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
                  v-for="member in availableForChairman"
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
              <!-- Секретарь -->
              <div class="member-item">
                <div class="form-group member-select">
                  <label>Секретарь:</label>
                  <div class="select-with-action">
                    <select v-model="selectedSecretary" class="form-select">
                      <option value="" disabled selected>
                        Выберите секретаря
                      </option>
                      <option
                        v-for="member in availableForSecretary"
                        :key="member.ID"
                        :value="member.ID"
                      >
                        {{ fullName(member) }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Члены комиссии -->
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
import api from "@/services/api";

export default {
  data() {
    return {
      selectedSpecialization: "",
      specializations: [],
      loadingSpecializations: false,
      commissionName: "",
      selectedChairman: "",
      selectedSecretary: "",
      selectedMembers: ["", "", ""],

      commissionMembersList: [],
      creating: false,
      successMessage: "",
      errorMessage: "",
    };
  },
  async mounted() {
    await this.loadData();
  },
  computed: {
    canSubmit() {
      return (
        this.selectedSpecialization &&
        this.commissionName.trim() &&
        this.selectedChairman &&
        this.selectedSecretary &&
        this.selectedMembers.some((id) => id)
      );
    },

    // Доступные для председателя (исключаем секретаря и членов)
    availableForChairman() {
      const usedIds = [
        this.selectedSecretary,
        ...this.selectedMembers.filter((id) => id),
      ].filter((id) => id);

      return this.commissionMembersList.filter(
        (member) => !usedIds.includes(member.ID)
      );
    },

    // Доступные для секретаря (исключаем председателя и членов)
    availableForSecretary() {
      const usedIds = [
        this.selectedChairman,
        ...this.selectedMembers.filter((id) => id),
      ].filter((id) => id);

      return this.commissionMembersList.filter(
        (member) => !usedIds.includes(member.ID)
      );
    },
  },
  methods: {
    async loadData() {
      try {
        this.loadingSpecializations = true;
        const specializationsRes = await api.get("/api/specializations/", {
          params: { Status: true },
        });
        this.specializations = specializationsRes.data;
        const membersRes = await api.get("/api/commission_members/");
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

    // Доступные для члена комиссии по индексу (исключаем председателя, секретаря и других членов)
    getAvailableMembersForIndex(index) {
      const usedIds = [
        this.selectedChairman,
        this.selectedSecretary,
        ...this.selectedMembers.filter((id, i) => i !== index && id),
      ].filter((id) => id);

      return this.commissionMembersList.filter(
        (member) => !usedIds.includes(member.ID)
      );
    },

    addMember() {
      this.selectedMembers.push("");
    },

    removeMember(index) {
      if (this.selectedMembers.length > 1) {
        this.selectedMembers.splice(index, 1);
      } else {
        this.selectedMembers[index] = "";
      }
    },
    async createCommission() {
      if (!this.canSubmit) {
        this.errorMessage = "Заполните все обязательные поля";
        return;
      }

      // Проверка на дубликаты
      const allIds = [
        this.selectedChairman,
        this.selectedSecretary,
        ...this.selectedMembers.filter((id) => id),
      ].filter((id) => id);

      const uniqueIds = new Set(allIds);
      if (allIds.length !== uniqueIds.size) {
        this.errorMessage =
          "Один сотрудник не может занимать несколько ролей в комиссии";
        return;
      }

      try {
        this.creating = true;
        this.errorMessage = "";
        this.successMessage = "";

        // 1. Создаём комиссию
        // ВАЖНО: Проверьте CommissionSerializer. Если там нет явных полей,
        // он тоже скорее всего ожидает snake_case (name, specialization_id)
        const commissionData = {
          name: this.commissionName.trim(),
          id_specialization: parseInt(this.selectedSpecialization),
        };

        console.log("Отправляем данные комиссии:", commissionData);

        const commissionResponse = await api.post(
          "/api/commissions/",
          commissionData
        );

        // Получаем ID созданной комиссии (учитываем, что бэкенд может вернуть 'id' или 'ID')
        const commissionId =
          commissionResponse.data.id || commissionResponse.data.ID;
        console.log("Комиссия создана, ID:", commissionId);

        const postComposition = async (memberId, role) => {
          await api.post("/api/commission_compositions/", {
            id_commission: commissionId, // ← Было ID_Commission / commission_id
            member_id: parseInt(memberId), // ← OK, благодаря write_only полю
            role: role, // ← OK, Role → role
          });
        };

        // 2. Добавляем председателя
        await postComposition(this.selectedChairman, "Председатель");

        // 3. Добавляем секретаря
        await postComposition(this.selectedSecretary, "Секретарь");

        // 4. Добавляем членов комиссии
        const validMembers = this.selectedMembers.filter((id) => id);
        for (const memberId of validMembers) {
          await postComposition(memberId, "Член аттестационной комиссии");
        }

        // 5. Привязываем секретаря к специализации
        await api.post("/api/secretary_specialization/", {
          specialization_id: parseInt(this.selectedSpecialization),
          secretary_id: parseInt(this.selectedSecretary),
        });

        this.successMessage = `Комиссия "${this.commissionName}" успешно сформирована!`;
        this.resetForm();
      } catch (error) {
        console.error("Ошибка создания комиссии:", error);
        console.error("Детали ошибки:", error.response?.data);

        let errorMsg = "Ошибка при создании комиссии: ";

        if (error.response?.data) {
          const data = error.response.data;
          // Красивый вывод ошибок валидации от DRF
          if (typeof data === "object" && !Array.isArray(data)) {
            const firstKey = Object.keys(data)[0];
            if (firstKey && Array.isArray(data[firstKey])) {
              errorMsg += data[firstKey][0];
            } else {
              errorMsg += JSON.stringify(data);
            }
          } else {
            errorMsg += data;
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
      this.selectedSecretary = "";
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    Helvetica, Arial, sans-serif;
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
