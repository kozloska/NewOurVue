// Сервис для работы с API
const API_BASE_URL = ""; // Базовый URL API (пустой, если API находится на том же домене)

export default {
  // Получение списка записей из таблицы
  async fetchTableData(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  },

  // Получение одной записи по ID
  async fetchItemById(endpoint, id) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}${id}/`);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching item:", error);
      throw error;
    }
  },

  // Создание новой записи
  async createItem(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  },

  // Обновление существующей записи
  async updateItem(endpoint, id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  },

  // Удаление записи
  async deleteItem(endpoint, id) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}${id}/`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  },
};
