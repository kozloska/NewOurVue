<template>
  <div class="admin-panel">
    <h1 class="admin-title">Панель управления</h1>
    <div class="tables-menu">
      <button
        v-for="table in availableTables"
        :key="table.name"
        :class="['menu-item', { active: selectedTable === table.name }]"
        @click="onSelectTable(table.name)"
      >
        {{ table.label }}
      </button>
    </div>

    <div class="table-container">
      <template v-if="selectedTable">
        <div class="table-header">
          <h2>{{ getSelectedTableLabel() }}</h2>
          <div class="header-controls">
            <div class="search-container">
              <input
                type="text"
                v-model="searchQuery"
                :placeholder="getSearchPlaceholder()"
                class="search-input"
                @input="filterData"
              />
            </div>
            <button class="add-button" @click="showAddModal = true">
              Добавить запись
            </button>
          </div>
        </div>

        <div v-if="selectedTable === 'specialization'" class="table-wrapper">
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else-if="errorSpecializations" class="error-message">
            {{ errorSpecializations }}
          </div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Квалификация</th>
                    <th>Номер</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ item.Name }}</td>
                    <td>{{ item.Qualification }}</td>
                    <td>{{ item.Number }}</td>
                    <td>{{ item.Status ? "Активно" : "Неактивно" }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div
          v-else-if="selectedTable === 'commission_member'"
          class="table-wrapper"
        >
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Фамилия</th>
                    <th>Имя</th>
                    <th>Отчество</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ item.Surname }}</td>
                    <td>{{ item.Name }}</td>
                    <td>{{ item.Patronymic }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                      <button
                        class="delete-button"
                        @click="confirmDelete(item)"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedTable === 'project'" class="table-wrapper">
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Руководитель</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ item.Title }}</td>
                    <td>{{ item.Supervisor }}</td>
                    <td>{{ item.Status }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedTable === 'student'" class="table-wrapper">
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Фамилия</th>
                    <th>Имя</th>
                    <th>Отчество</th>
                    <th>Группа</th>
                    <th>Специализация</th>
                    <th>Проект</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ item.Surname }}</td>
                    <td>{{ item.Name }}</td>
                    <td>{{ item.Patronymic }}</td>
                    <td>{{ getGroupName(item.ID_Group) }}</td>
                    <td>{{ getSpecializationName(item.ID_Specialization) }}</td>
                    <td>{{ getProjectName(item.ID_Project) }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedTable === 'commission'" class="table-wrapper">
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Специализация</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ item.Name }}</td>
                    <td>{{ getSpecializationName(item.ID_Specialization) }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                      <button
                        class="delete-button"
                        @click="confirmDelete(item)"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div
          v-else-if="selectedTable === 'commission_composition'"
          class="table-wrapper"
        >
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Член комиссии</th>
                    <th>Роль</th>
                    <th>Комиссия</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ getCommissionMemberName(item.ID_Member) }}</td>
                    <td>{{ item.Role }}</td>
                    <td>{{ getCommissionName(item.ID_Commission) }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                      <button
                        class="delete-button"
                        @click="confirmDelete(item)"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedTable === 'question'" class="table-wrapper">
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Текст вопроса</th>
                    <th>Проект</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.ID }}</td>
                    <td>{{ item.Text }}</td>
                    <td>{{ getProjectName(item.ID_Project) }}</td>
                    <td>{{ item.Status ? "Активен" : "Неактивен" }}</td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                      <button
                        class="delete-button"
                        @click="confirmDelete(item)"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedTable === 'protocol'" class="table-wrapper">
          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Год</th>
                    <th>Оценка</th>
                    <th>Студент</th>
                    <th>Время начала</th>
                    <th>Время окончания</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in paginatedData" :key="item.ID">
                    <td>{{ item.Number || "-" }}</td>
                    <td>{{ item.Year || "-" }}</td>
                    <td>{{ item.Grade || "-" }}</td>
                    <td>{{ getStudentNameForProtocol(item.ID_Student) }}</td>
                    <td>{{ formatTime(item.DefenseStartTime) || "-" }}</td>
                    <td>{{ formatTime(item.DefenseEndTime) || "-" }}</td>
                    <td>
                      {{
                        item.Status === true
                          ? "Утвержден"
                          : item.Status === false
                          ? "Не утвержден"
                          : item.Status || "-"
                      }}
                    </td>
                    <td class="actions">
                      <button class="edit-button" @click="editItem(item)">
                        Изменить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                Предыдущая
              </button>
              <span class="pagination-info">
                Страница {{ currentPage }} из {{ totalPages }} ({{
                  filteredData.length
                }}
                записей)
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="no-selection">Выберите таблицу из меню выше</div>
    </div>

    <div
      v-if="showEditModal && selectedTable === 'specialization'"
      class="modal"
    >
      <div class="modal-content">
        <h3>
          {{ isNewItem ? "Добавить направление" : "Редактировать направление" }}
        </h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="name">Название:</label>
            <input type="text" id="name" v-model="editingItem.Name" required />
          </div>
          <div class="form-group">
            <label for="qualification">Квалификация:</label>
            <input
              type="text"
              id="qualification"
              v-model="editingItem.Qualification"
              required
            />
          </div>
          <div class="form-group">
            <label for="number">Номер:</label>
            <input
              type="text"
              id="number"
              v-model="editingItem.Number"
              required
            />
          </div>
          <div class="form-group">
            <label for="status">Статус:</label>
            <select id="status" v-model="editingItem.Status" required>
              <option :value="true">Активно</option>
              <option :value="false">Неактивно</option>
            </select>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showEditModal && selectedTable === 'commission_member'"
      class="modal"
    >
      <div class="modal-content">
        <h3>
          {{
            isNewItem
              ? "Добавить члена комиссии"
              : "Редактировать члена комиссии"
          }}
        </h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="surname">Фамилия:</label>
            <input
              type="text"
              id="surname"
              v-model="editingItem.Surname"
              required
            />
          </div>
          <div class="form-group">
            <label for="name">Имя:</label>
            <input type="text" id="name" v-model="editingItem.Name" required />
          </div>
          <div class="form-group">
            <label for="patronymic">Отчество:</label>
            <input
              type="text"
              id="patronymic"
              v-model="editingItem.Patronymic"
              required
            />
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal && selectedTable === 'project'" class="modal">
      <div class="modal-content">
        <h3>{{ isNewItem ? "Добавить проект" : "Редактировать проект" }}</h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="title">Название:</label>
            <input
              type="text"
              id="title"
              v-model="editingItem.Title"
              required
            />
          </div>
          <div class="form-group">
            <label for="supervisor">Руководитель:</label>
            <input
              type="text"
              id="supervisor"
              v-model="editingItem.Supervisor"
              required
            />
          </div>
          <div v-if="isNewItem" class="form-group">
            <label for="text">Описание проекта:</label>
            <textarea
              id="text"
              v-model="editingItem.Text"
              placeholder="Введите описание проекта"
              required
            ></textarea>
          </div>
          <div v-if="!isNewItem" class="form-group">
            <label for="status">Статус:</label>
            <select id="status" v-model="editingItem.Status" required>
              <option value="Защита не начата">Защита не начата</option>
              <option value="Защита начата">Защита начата</option>
              <option value="Вопросы расшифровываются">
                Вопросы расшифровываются
              </option>
              <option value="Готов">Готов</option>
            </select>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal && selectedTable === 'student'" class="modal">
      <div class="modal-content">
        <h3>
          {{ isNewItem ? "Добавить студента" : "Редактировать студента" }}
        </h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="surname">Фамилия:</label>
            <input
              type="text"
              id="surname"
              v-model="editingItem.Surname"
              required
            />
          </div>
          <div class="form-group">
            <label for="name">Имя:</label>
            <input type="text" id="name" v-model="editingItem.Name" required />
          </div>
          <div class="form-group">
            <label for="patronymic">Отчество:</label>
            <input
              type="text"
              id="patronymic"
              v-model="editingItem.Patronymic"
              required
            />
          </div>
          <div class="form-group">
            <label for="group">Группа:</label>
            <select id="group" v-model="editingItem.ID_Group" required>
              <option value="">Выберите группу</option>
              <option
                v-for="group in groupsList"
                :key="group.ID"
                :value="group.ID"
              >
                {{ group.Name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="specialization">Специализация:</label>
            <select
              id="specialization"
              v-model="editingItem.ID_Specialization"
              required
            >
              <option value="">Выберите специализацию</option>
              <option
                v-for="spec in specializationsList"
                :key="spec.ID"
                :value="spec.ID"
              >
                {{ spec.Name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="project">Проект:</label>
            <select id="project" v-model="editingItem.ID_Project">
              <option value="">Выберите проект (необязательно)</option>
              <option
                v-for="project in projectsList"
                :key="project.ID"
                :value="project.ID"
              >
                {{ project.Title }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal && selectedTable === 'commission'" class="modal">
      <div class="modal-content">
        <h3>
          {{ isNewItem ? "Добавить комиссию" : "Редактировать комиссию" }}
        </h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="name">Название:</label>
            <input type="text" id="name" v-model="editingItem.Name" required />
          </div>
          <div v-if="isNewItem" class="form-group">
            <label for="specialization">Специализация:</label>
            <select
              id="specialization"
              v-model="editingItem.ID_Specialization"
              required
            >
              <option value="">Выберите специализацию</option>
              <option
                v-for="spec in specializationsList"
                :key="spec.ID"
                :value="spec.ID"
              >
                {{ spec.Name }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showEditModal && selectedTable === 'commission_composition'"
      class="modal"
    >
      <div class="modal-content">
        <h3>
          {{
            isNewItem
              ? "Добавить состав комиссии"
              : "Редактировать состав комиссии"
          }}
        </h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="member">Член комиссии:</label>
            <select id="member" v-model="editingItem.ID_Member" required>
              <option value="">Выберите члена комиссии</option>
              <option
                v-for="member in commissionMembersList"
                :key="member.ID"
                :value="member.ID"
              >
                {{ member.Surname }} {{ member.Name }} {{ member.Patronymic }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="role">Роль:</label>
            <select id="role" v-model="editingItem.Role" required>
              <option value="">Выберите роль</option>
              <option value="Секретарь">Секретарь</option>
              <option value="Председатель">Председатель</option>
              <option value="Член аттестационной комиссии">
                Член аттестационной комиссии
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="commission">Комиссия:</label>
            <select
              id="commission"
              v-model="editingItem.ID_Commission"
              required
            >
              <option value="">Выберите комиссию</option>
              <option
                v-for="commission in commissionsList"
                :key="commission.ID"
                :value="commission.ID"
              >
                {{ commission.Name }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal && selectedTable === 'question'" class="modal">
      <div class="modal-content">
        <h3>{{ isNewItem ? "Добавить вопрос" : "Редактировать вопрос" }}</h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label for="text">Текст вопроса:</label>
            <textarea id="text" v-model="editingItem.Text" required></textarea>
          </div>
          <div class="form-group">
            <label for="project">Проект:</label>
            <select id="project" v-model="editingItem.ID_Project" required>
              <option value="">Выберите проект</option>
              <option
                v-for="project in projectsList"
                :key="project.ID"
                :value="project.ID"
              >
                {{ project.Title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="status">Статус:</label>
            <select id="status" v-model="editingItem.Status">
              <option :value="true">Активен</option>
              <option :value="false">Неактивен</option>
            </select>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal && selectedTable === 'protocol'" class="modal">
      <div class="modal-content">
        <h3>
          {{ isNewItem ? "Добавить протокол" : "Редактировать протокол" }}
        </h3>
        <form @submit.prevent="saveItem">
          <div v-if="isNewItem">
            <div class="form-group">
              <label for="number">Номер:</label>
              <input
                type="text"
                id="number"
                v-model="editingItem.Number"
                required
              />
            </div>
            <div class="form-group">
              <label for="year">Год:</label>
              <input
                type="number"
                id="year"
                v-model="editingItem.Year"
                required
              />
            </div>
            <div class="form-group">
              <label for="student">Студент:</label>
              <select id="student" v-model="editingItem.ID_Student" required>
                <option value="">Выберите студента</option>
                <option
                  v-for="student in studentsList"
                  :key="student.ID"
                  :value="student.ID"
                >
                  {{ student.Surname }} {{ student.Name }}
                  {{ student.Patronymic }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="status">Статус:</label>
              <select id="status" v-model="editingItem.Status" required>
                <option value="">Выберите статус</option>
                <option :value="true">Утвержден</option>
                <option :value="false">Не утвержден</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="grade">Оценка:</label>
            <select id="grade" v-model="editingItem.Grade">
              <option value="">Выберите оценку</option>
              <option value="Неудовлетворительно">Неудовлетворительно</option>
              <option value="Удовлетворительно">Удовлетворительно</option>
              <option value="Хорошо">Хорошо</option>
              <option value="Отлично">Отлично</option>
            </select>
          </div>
          <div class="form-group">
            <label for="timestart">Время начала:</label>
            <input
              type="time"
              id="timestart"
              v-model="editingItem.DefenseStartTime"
            />
          </div>
          <div class="form-group">
            <label for="timeend">Время окончания:</label>
            <input
              type="time"
              id="timeend"
              v-model="editingItem.DefenseEndTime"
            />
          </div>
          <div class="form-group">
            <label for="question1">Вопрос 1:</label>
            <select id="question1" v-model="editingItem.ID_Question">
              <option value="">Выберите вопрос (необязательно)</option>
              <option
                v-for="question in questionsList"
                :key="question.ID"
                :value="question.ID"
              >
                {{ question.Text.substring(0, 50)
                }}{{ question.Text.length > 50 ? "..." : "" }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="question2">Вопрос 2:</label>
            <select id="question2" v-model="editingItem.ID_Question2">
              <option value="">Выберите вопрос (необязательно)</option>
              <option
                v-for="question in questionsList"
                :key="question.ID"
                :value="question.ID"
              >
                {{ question.Text.substring(0, 50)
                }}{{ question.Text.length > 50 ? "..." : "" }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button type="submit" class="save-button">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Подтверждение удаления</h3>
        <p v-if="selectedTable === 'commission_member'">
          Вы уверены, что хотите удалить этого члена комиссии?
        </p>
        <p v-else-if="selectedTable === 'commission'">
          Вы уверены, что хотите удалить эту комиссию? Это также удалит весь
          состав комиссии.
        </p>
        <p v-else-if="selectedTable === 'commission_composition'">
          Вы уверены, что хотите удалить этого члена из состава комиссии?
        </p>
        <p v-else-if="selectedTable === 'question'">
          Вы уверены, что хотите удалить этот вопрос?
        </p>
        <div class="form-actions">
          <button
            type="button"
            class="cancel-button"
            @click="showDeleteModal = false"
          >
            Отмена
          </button>
          <button type="button" class="delete-button" @click="deleteItem">
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedTable: null,
      tableData: [],
      filteredData: [],
      loading: false,
      showEditModal: false,
      showAddModal: false,
      showDeleteModal: false,
      editingItem: {},
      itemToDelete: null,
      isNewItem: false,
      searchQuery: "",
      currentPage: 1,
      itemsPerPage: 15,
      secretaryId: null,
      errorSpecializations: null,
      projectsList: [],
      specializationsList: [],
      commissionMembersList: [],
      commissionsList: [],
      groupsList: [],
      studentsList: [],
      questionsList: [],
      defensesList: [],
      availableTables: [
        {
          name: "specialization",
          label: "Направления",
          endpoint: "secretary_specialization",
          searchFields: ["Name"],
        },
        {
          name: "commission_member",
          label: "Члены комиссии",
          endpoint: "commission_members",
          searchFields: ["Surname", "Name", "Patronymic"],
        },
        {
          name: "project",
          label: "Проекты",
          endpoint: "projects",
          searchFields: ["Title", "Supervisor"],
        },
        {
          name: "student",
          label: "Студенты",
          endpoint: "students",
          searchFields: ["Surname", "ID_Group"],
        },
        {
          name: "commission",
          label: "Комиссии",
          endpoint: "commissions",
          searchFields: ["Name", "ID_Specialization"],
        },
        {
          name: "commission_composition",
          label: "Состав комиссии",
          endpoint: "commission_compositions",
          searchFields: ["ID_Member"],
        },
        {
          name: "question",
          label: "Вопросы",
          endpoint: "questions",
          searchFields: ["Text", "ID_Project", "Status"],
        },
        {
          name: "protocol",
          label: "Протоколы",
          endpoint: "protocols",
          searchFields: ["Student", "Number"],
        },
      ],
    };
  },
  computed: {
    projectsMap() {
      const map = {};
      this.projectsList.forEach((project) => {
        map[project.ID] = project;
      });
      return map;
    },

    specializationsMap() {
      const map = {};
      this.specializationsList.forEach((spec) => {
        map[spec.ID] = spec;
      });
      return map;
    },

    commissionMembersMap() {
      const map = {};
      this.commissionMembersList.forEach((member) => {
        map[member.ID] = member;
      });
      return map;
    },

    commissionsMap() {
      const map = {};
      this.commissionsList.forEach((commission) => {
        map[commission.ID] = commission;
      });
      return map;
    },

    groupsMap() {
      const map = {};
      this.groupsList.forEach((group) => {
        map[group.ID] = group;
      });
      return map;
    },

    studentsMap() {
      const map = {};
      this.studentsList.forEach((student) => {
        map[student.ID] = student;
      });
      return map;
    },

    questionsMap() {
      const map = {};
      this.questionsList.forEach((question) => {
        map[question.ID] = question;
      });
      return map;
    },

    defensesMap() {
      const map = {};
      this.defensesList.forEach((defense) => {
        map[defense.ID] = defense;
      });
      return map;
    },

    totalPages() {
      return Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
    },

    paginatedData() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredData.slice(start, end);
    },

    currentSearchFields() {
      const table = this.availableTables.find(
        (t) => t.name === this.selectedTable
      );
      return table ? table.searchFields : [];
    },
  },
  methods: {
    initializeSecretary() {
      const secretary = JSON.parse(localStorage.getItem("secretary"));
      if (secretary?.ID) {
        this.secretaryId = secretary.ID;
        console.log("ID секретаря:", this.secretaryId);
      } else {
        this.errorSpecializations =
          "ID секретаря не найден. Пожалуйста, войдите в систему заново.";
        console.error("ID секретаря не найден");
      }
    },

    getSearchPlaceholder() {
      switch (this.selectedTable) {
        case "specialization":
          return "Поиск по названию";
        case "commission_member":
          return "Поиск по ФИО";
        case "project":
          return "Поиск по названию или руководителю";
        case "student":
          return "Поиск по фамилии или группе";
        case "commission":
          return "Поиск по названию или специализации";
        case "commission_composition":
          return "Поиск по члену комиссии";
        case "question":
          return "Поиск по всем полям";
        case "protocol":
          return "Поиск по студенту или номеру";
        default:
          return "Поиск...";
      }
    },

    onSelectTable(tableName) {
      this.selectedTable = tableName;
      this.searchQuery = "";
      this.currentPage = 1;
      this.fetchTableData();
    },

    getSelectedTableLabel() {
      const table = this.availableTables.find(
        (t) => t.name === this.selectedTable
      );
      return table ? table.label : "";
    },

    getTableEndpoint() {
      const table = this.availableTables.find(
        (t) => t.name === this.selectedTable
      );
      return table ? table.endpoint : "";
    },

    filterData() {
      if (!this.searchQuery.trim()) {
        this.filteredData = [...this.tableData];
        return;
      }

      const query = this.searchQuery.toLowerCase();
      const searchFields = this.currentSearchFields;

      this.filteredData = this.tableData.filter((item) => {
        return searchFields.some((field) => {
          let value = item[field];

          if (field === "ID_Group") {
            value = this.getGroupName(value);
          } else if (field === "ID_Specialization") {
            value = this.getSpecializationName(value);
          } else if (field === "ID_Project") {
            value = this.getProjectName(value);
          } else if (field === "ID_Member") {
            value = this.getCommissionMemberName(value);
          } else if (field === "Student") {
            value = this.getStudentNameForProtocol(value);
          }

          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        });
      });

      this.currentPage = 1;
    },

    getProjectName(projectData) {
      if (!projectData) return "Не назначен";

      if (typeof projectData === "object" && projectData !== null) {
        return projectData.Title || `ID: ${projectData.ID}`;
      }

      const project = this.projectsMap[projectData];
      return project ? project.Title : `ID: ${projectData}`;
    },

    getSpecializationName(specData) {
      if (typeof specData === "object" && specData !== null) {
        return specData.Name || `ID: ${specData.ID}`;
      }
      const spec = this.specializationsMap[specData];
      return spec ? spec.Name : `ID: ${specData}`;
    },

    getCommissionMemberName(memberData) {
      if (typeof memberData === "object" && memberData !== null) {
        if (memberData.Surname && memberData.Name && memberData.Patronymic) {
          return `${memberData.Surname} ${memberData.Name} ${memberData.Patronymic}`;
        }
        return `ID: ${memberData.ID}`;
      }
      const member = this.commissionMembersMap[memberData];
      if (!member) return `ID: ${memberData}`;
      return `${member.Surname} ${member.Name} ${member.Patronymic}`;
    },

    getCommissionName(commissionData) {
      if (typeof commissionData === "object" && commissionData !== null) {
        return commissionData.Name || `ID: ${commissionData.ID}`;
      }
      const commission = this.commissionsMap[commissionData];
      return commission ? commission.Name : `ID: ${commissionData}`;
    },

    getGroupName(groupData) {
      if (typeof groupData === "object" && groupData !== null) {
        return groupData.Name || `ID: ${groupData.ID}`;
      }
      const group = this.groupsMap[groupData];
      return group ? group.Name : `ID: ${groupData}`;
    },

    getStudentName(studentData) {
      if (typeof studentData === "object" && studentData !== null) {
        if (studentData.Surname && studentData.Name && studentData.Patronymic) {
          return `${studentData.Surname} ${studentData.Name} ${studentData.Patronymic}`;
        }
        return `ID: ${studentData.ID}`;
      }
      const student = this.studentsMap[studentData];
      if (!student) return `ID: ${studentData}`;
      return `${student.Surname} ${student.Name} ${student.Patronymic}`;
    },

    getStudentNameForProtocol(studentData) {
      console.log("Protocol student data:", studentData);

      if (!studentData) return "Не указан";

      if (typeof studentData === "object" && studentData !== null) {
        if (studentData.Surname && studentData.Name && studentData.Patronymic) {
          return `${studentData.Surname} ${studentData.Name} ${studentData.Patronymic}`;
        }
        if (studentData.ID) {
          const student = this.studentsMap[studentData.ID];
          if (student) {
            return `${student.Surname} ${student.Name} ${student.Patronymic}`;
          }
          return `ID: ${studentData.ID}`;
        }
        return "Данные студента некорректны";
      }

      if (
        typeof studentData === "number" ||
        (typeof studentData === "string" && !isNaN(studentData))
      ) {
        const student = this.studentsMap[studentData];
        if (student) {
          return `${student.Surname} ${student.Name} ${student.Patronymic}`;
        }
        return `ID: ${studentData}`;
      }

      return `Неизвестный формат: ${studentData}`;
    },

    getQuestionText(questionId) {
      const question = this.questionsMap[questionId];
      if (!question) return `ID: ${questionId}`;
      const text = question.Text;
      return text.length > 50 ? text.substring(0, 50) + "..." : text;
    },

    formatTime(timeString) {
      if (!timeString) return "";
      if (timeString.includes(":")) {
        const parts = timeString.split(":");
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    },

    async fetchTableData() {
      this.loading = true;
      this.errorSpecializations = null;

      try {
        const endpoint = this.getTableEndpoint();
        let url;

        if (this.selectedTable === "specialization") {
          url = `http://127.0.0.1:8000/api/specializations/`;
        } else {
          url = `http://localhost:8000/api/${endpoint}/`;
        }

        console.log(`Запрос к API: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Данные для ${this.selectedTable}:`, data);
        this.tableData = data;
        this.filterData();

        if (this.selectedTable === "question") {
          await this.fetchProjects();
        } else if (this.selectedTable === "commission") {
          await this.fetchSpecializations();
        } else if (this.selectedTable === "commission_composition") {
          await this.fetchCommissionMembers();
          await this.fetchCommissions();
        } else if (this.selectedTable === "student") {
          await this.fetchSpecializations();
          await this.fetchProjects();
          await this.fetchGroups();
        } else if (this.selectedTable === "protocol") {
          await this.fetchStudents();
          await this.fetchQuestions();
        }
      } catch (error) {
        console.error("Ошибка:", error);
        if (this.selectedTable === "specialization") {
          this.errorSpecializations = `Не удалось загрузить данные: ${error.message}`;
        } else {
          alert("Не удалось загрузить данные: " + error.message);
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchProjects() {
      try {
        const projectsResponse = await fetch(
          "http://localhost:8000/api/projects/"
        );
        if (projectsResponse.ok) {
          const allProjects = await projectsResponse.json();
          this.projectsList = allProjects;
          console.log("Загружены проекты:", allProjects);
        } else {
          console.error("Ошибка загрузки проектов:", projectsResponse.status);
        }
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      }
    },

    async fetchSpecializations() {
      try {
        const url = `http://127.0.0.1:8000/api/specializations/`;
        const specsResponse = await fetch(url);
        if (specsResponse.ok) {
          const allSpecs = await specsResponse.json();
          this.specializationsList = allSpecs;
          console.log("Загружены специализации:", allSpecs);
        } else {
          console.error("Ошибка загрузки специализаций:", specsResponse.status);
        }
      } catch (error) {
        console.error("Ошибка при загрузке специализаций:", error);
      }
    },

    async fetchCommissionMembers() {
      try {
        const membersResponse = await fetch(
          "http://localhost:8000/api/commission_members/"
        );
        if (membersResponse.ok) {
          const allMembers = await membersResponse.json();
          this.commissionMembersList = allMembers;
          console.log("Загружены члены комиссии:", allMembers);
        } else {
          console.error(
            "Ошибка загрузки членов комиссии:",
            membersResponse.status
          );
        }
      } catch (error) {
        console.error("Ошибка при загрузке членов комиссии:", error);
      }
    },

    async fetchCommissions() {
      try {
        const commissionsResponse = await fetch(
          "http://localhost:8000/api/commissions/"
        );
        if (commissionsResponse.ok) {
          const allCommissions = await commissionsResponse.json();
          this.commissionsList = allCommissions;
          console.log("Загружены комиссии:", allCommissions);
        } else {
          console.error(
            "Ошибка загрузки комиссий:",
            commissionsResponse.status
          );
        }
      } catch (error) {
        console.error("Ошибка при загрузке комиссий:", error);
      }
    },

    async fetchGroups() {
      try {
        const groupsResponse = await fetch("http://localhost:8000/api/groups/");
        if (groupsResponse.ok) {
          const allGroups = await groupsResponse.json();
          this.groupsList = allGroups;
          console.log("Загружены группы:", allGroups);
        } else {
          console.error("Ошибка загрузки групп:", groupsResponse.status);
        }
      } catch (error) {
        console.error("Ошибка при загрузке групп:", error);
      }
    },

    async fetchStudents() {
      try {
        const studentsResponse = await fetch(
          "http://localhost:8000/api/students/"
        );
        if (studentsResponse.ok) {
          const allStudents = await studentsResponse.json();
          this.studentsList = allStudents;
          console.log("Загружены студенты:", allStudents);
        } else {
          console.error("Ошибка загрузки студентов:", studentsResponse.status);
        }
      } catch (error) {
        console.error("Ошибка при загрузке студентов:", error);
      }
    },

    async fetchQuestions() {
      try {
        const questionsResponse = await fetch(
          "http://localhost:8000/api/questions/"
        );
        if (questionsResponse.ok) {
          const allQuestions = await questionsResponse.json();
          this.questionsList = allQuestions;
          console.log("Загружены вопросы:", allQuestions);
        } else {
          console.error("Ошибка загрузки вопросов:", questionsResponse.status);
        }
      } catch (error) {
        console.error("Ошибка при загрузке вопросов:", error);
      }
    },

    editItem(item) {
      this.isNewItem = false;
      this.editingItem = { ...item };

      if (this.selectedTable === "student") {
        if (item.ID_Group && typeof item.ID_Group === "object") {
          this.editingItem.ID_Group = item.ID_Group.ID;
        }
        if (
          item.ID_Specialization &&
          typeof item.ID_Specialization === "object"
        ) {
          this.editingItem.ID_Specialization = item.ID_Specialization.ID;
        }
        if (item.ID_Project && typeof item.ID_Project === "object") {
          this.editingItem.ID_Project = item.ID_Project.ID;
        }
      }

      if (this.selectedTable === "commission_composition") {
        if (item.ID_Member && typeof item.ID_Member === "object") {
          this.editingItem.ID_Member = item.ID_Member.ID;
        }
        if (item.ID_Commission && typeof item.ID_Commission === "object") {
          this.editingItem.ID_Commission = item.ID_Commission.ID;
        }
      }

      if (this.selectedTable === "protocol") {
        if (item.ID_Student && typeof item.ID_Student === "object") {
          this.editingItem.ID_Student = item.ID_Student.ID;
        }
        if (item.ID_Question && typeof item.ID_Question === "object") {
          this.editingItem.ID_Question = item.ID_Question.ID;
        }
        if (item.ID_Question2 && typeof item.ID_Question2 === "object") {
          this.editingItem.ID_Question2 = item.ID_Question2.ID;
        }
      }

      this.showEditModal = true;
    },

    addNewItem() {
      this.isNewItem = true;

      if (this.selectedTable === "question") {
        this.editingItem = {
          Text: "",
          ID_Project: "",
          Status: true,
        };
      } else if (this.selectedTable === "commission") {
        this.editingItem = {
          Name: "",
          ID_Specialization: "",
        };
      } else if (this.selectedTable === "commission_composition") {
        this.editingItem = {
          ID_Member: "",
          Role: "",
          ID_Commission: "",
        };
      } else if (this.selectedTable === "specialization") {
        this.editingItem = {
          Name: "",
          Qualification: "",
          Number: "",
          Status: true,
          ID_Secretary: this.secretaryId,
        };
      } else if (this.selectedTable === "commission_member") {
        this.editingItem = {
          Surname: "",
          Name: "",
          Patronymic: "",
        };
      } else if (this.selectedTable === "project") {
        this.editingItem = {
          Title: "",
          Supervisor: "",
          Status: "Защита не начата",
          Text: "",
        };
      } else if (this.selectedTable === "student") {
        this.editingItem = {
          Surname: "",
          Name: "",
          Patronymic: "",
          ID_Group: "",
          ID_Specialization: "",
          ID_Project: "",
        };
      } else if (this.selectedTable === "protocol") {
        this.editingItem = {
          Number: "",
          Year: new Date().getFullYear(),
          ID_Student: "",
          Status: "",
          Grade: "",
          DefenseStartTime: "",
          DefenseEndTime: "",
          ID_Question: "",
          ID_Question2: "",
        };
      }

      this.showEditModal = true;
      this.showAddModal = false;
    },

    async saveItem() {
      try {
        const endpoint = this.getTableEndpoint();
        let url;

        if (this.selectedTable === "specialization") {
          if (this.isNewItem) {
            url = `http://127.0.0.1:8000/api/specializations/`;
          } else {
            url = `http://127.0.0.1:8000/api/specializations/${this.editingItem.ID}/`;
          }

          if (this.isNewItem) {
            this.editingItem.ID_Secretary = this.secretaryId;
          }
        } else {
          if (this.isNewItem) {
            url = `http://localhost:8000/api/${endpoint}/`;
          } else {
            url = `http://localhost:8000/api/${endpoint}/${this.editingItem.ID}/`;
          }
        }

        let dataToSend = { ...this.editingItem };

        if (this.selectedTable === "protocol" && !this.isNewItem) {
          dataToSend = {
            Grade: this.editingItem.Grade,
            DefenseStartTime: this.editingItem.DefenseStartTime,
            DefenseEndTime: this.editingItem.DefenseEndTime,
          };

          if (this.editingItem.ID_Question) {
            dataToSend.ID_Question = this.editingItem.ID_Question;
          }
          if (this.editingItem.ID_Question2) {
            dataToSend.ID_Question2 = this.editingItem.ID_Question2;
          }
        } else if (this.selectedTable === "project") {
          if (this.isNewItem) {
            dataToSend = {
              Title: this.editingItem.Title,
              Supervisor: this.editingItem.Supervisor,
              Status: "Защита не начата",
              Text: this.editingItem.Text || "Описание проекта",
            };
          } else {
            dataToSend = {
              Title: this.editingItem.Title,
              Supervisor: this.editingItem.Supervisor,
              Status: this.editingItem.Status,
            };
          }
        }

        console.log(`Сохранение данных: ${url}`, dataToSend);

        let response;
        if (this.isNewItem) {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSend),
          });
        } else {
          response = await fetch(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSend),
          });
        }

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(`Ошибка: ${JSON.stringify(errorData)}`);
          } else {
            const errorText = await response.text();
            console.error("Ответ сервера (не JSON):", errorText);
            throw new Error(
              `Ошибка сервера: ${response.status} ${response.statusText}`
            );
          }
        }

        await this.fetchTableData();
        this.showEditModal = false;

        alert(
          this.isNewItem
            ? "Запись успешно создана!"
            : "Запись успешно обновлена!"
        );
      } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось сохранить данные: " + error.message);
      }
    },

    confirmDelete(item) {
      this.itemToDelete = item;
      this.showDeleteModal = true;
    },

    async deleteItem() {
      if (!this.itemToDelete) return;

      try {
        const endpoint = this.getTableEndpoint();
        let url;

        if (this.selectedTable === "specialization") {
          url = `http://127.0.0.1:8000/api/specializations/${this.itemToDelete.ID}/`;
        } else {
          url = `http://localhost:8000/api/${endpoint}/${this.itemToDelete.ID}/`;
        }

        console.log(`Удаление данных: ${url}`);

        const response = await fetch(url, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Ошибка при удалении: ${response.status}`);
        }

        if (this.selectedTable === "commission") {
          try {
            const compositionResponse = await fetch(
              `http://localhost:8000/api/commission_compositions/?ID_Commission=${this.itemToDelete.ID}`
            );

            if (compositionResponse.ok) {
              const compositions = await compositionResponse.json();

              for (const composition of compositions) {
                await fetch(
                  `http://localhost:8000/api/commission_compositions/${composition.ID}/`,
                  {
                    method: "DELETE",
                  }
                );
              }
            }
          } catch (compositionError) {
            console.warn(
              "Ошибка при удалении состава комиссии:",
              compositionError
            );
          }
        }

        await this.fetchTableData();
        this.showDeleteModal = false;
        this.itemToDelete = null;

        let successMessage = "";
        switch (this.selectedTable) {
          case "commission_member":
            successMessage = "Член комиссии успешно удален!";
            break;
          case "commission":
            successMessage = "Комиссия и её состав успешно удалены!";
            break;
          case "commission_composition":
            successMessage = "Член успешно удален из состава комиссии!";
            break;
          case "question":
            successMessage = "Вопрос успешно удален!";
            break;
          default:
            successMessage = "Запись успешно удалена!";
        }

        alert(successMessage);
      } catch (error) {
        console.error("Ошибка:", error);

        let errorMessage = "";
        switch (this.selectedTable) {
          case "commission_member":
            errorMessage = "Не удалось удалить члена комиссии: ";
            break;
          case "commission":
            errorMessage = "Не удалось удалить комиссию: ";
            break;
          case "commission_composition":
            errorMessage = "Не удалось удалить из состава комиссии: ";
            break;
          case "question":
            errorMessage = "Не удалось удалить вопрос: ";
            break;
          default:
            errorMessage = "Не удалось удалить запись: ";
        }

        alert(errorMessage + error.message);
      }
    },
  },
  mounted() {
    this.initializeSecretary();
    this.onSelectTable("specialization");
  },
  watch: {
    showAddModal(newVal) {
      if (newVal) {
        this.addNewItem();
      }
    },
    selectedTable(newVal) {
      if (newVal === "commission") {
        this.fetchSpecializations();
      } else if (newVal === "commission_composition") {
        this.fetchCommissionMembers();
        this.fetchCommissions();
      } else if (newVal === "student") {
        this.fetchSpecializations();
        this.fetchProjects();
        this.fetchGroups();
      } else if (newVal === "question") {
        this.fetchProjects();
      } else if (newVal === "protocol") {
        this.fetchStudents();
        this.fetchQuestions();
      }
    },
  },
};
</script>

<style scoped>
.admin-panel {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.admin-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.tables-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-item {
  padding: 10px 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.menu-item:hover {
  background: #e9e9e9;
  border-color: #bbb;
}

.menu-item.active {
  background: #4892b4;
  color: white;
  border-color: #4892b4;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: calc(100vh - 200px);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.table-header h2 {
  margin: 0;
  color: #333;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-container {
  position: relative;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 250px;
}

.search-input:focus {
  outline: none;
  border-color: #4892b4;
}

.add-button {
  background: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
}

.add-button:hover {
  background: #3aa876;
}

.table-wrapper {
  padding: 20px;
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tr:hover {
  background: #f9f9f9;
}

.actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.edit-button {
  background: #4892b4;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-button:hover {
  background: #3a7a9a;
}

.delete-button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-button:hover {
  background: #c0392b;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #e0e0e0;
  margin-top: 20px;
}

.pagination-btn {
  background: #4892b4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.pagination-btn:hover {
  background: #3a7a9a;
}

.pagination-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
  font-size: 18px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  padding: 20px;
}

.modal {
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

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-button {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  background: #4892b4;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:hover {
  background: #3a7a9a;
}

@media (max-width: 768px) {
  .admin-panel {
    padding: 10px;
  }

  .tables-menu {
    flex-direction: column;
    gap: 5px;
  }

  .menu-item {
    text-align: center;
    padding: 12px 15px;
  }

  .table-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-controls {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .search-input {
    width: 100%;
  }

  .add-button {
    width: 100%;
  }

  .table-wrapper {
    padding: 10px;
  }

  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 12px;
  }

  .actions {
    flex-direction: column;
    gap: 4px;
  }

  .edit-button,
  .delete-button {
    padding: 4px 8px;
    font-size: 11px;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .pagination-info {
    order: -1;
  }

  .modal-content {
    width: 95%;
    padding: 15px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .data-table {
    min-width: 600px;
  }

  .data-table th,
  .data-table td {
    padding: 6px 8px;
    font-size: 11px;
  }
}
</style>
