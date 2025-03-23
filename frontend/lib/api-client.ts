/**
 * Типы вопросов в опроснике
 */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'rating';

/**
 * Структура вопроса
 */
export interface Question {
  text: string;
  type: string;
  options?: string[] | null;
}

/**
 * Интерфейс для API опросников
 */
export interface Questionnaire {
  id?: number;
  title: string;
  description: string;
  questions: Question[] | Record<string, Question>;
  created_by: number;
  is_anonymous: boolean;
  created_at?: string;
}

/**
 * Данные для создания опросника
 */
export interface CreateQuestionnaireData {
  title: string;
  description: string;
  questions: Question[];
  is_anonymous: boolean;
  created_by: number;
  due_date?: string | null;
}

/**
 * Данные для назначения опросника группе
 */
export interface QuestionnaireAssignment {
  group_id: number;
  due_date: string;
}

/**
 * API для работы с опросниками
 */
export const questionnaireApi = {
  /**
   * Получить список всех опросников
   */
  async getQuestionnaires(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetch(`/api/${params}`);

    if (!response.ok) {
      throw new Error(`Error fetching questionnaires: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questionnaires as Questionnaire[];
  },

  /**
   * Получить последние опросники
   */
  async getLatestQuestionnaires(limit: number = 10) {
    const response = await fetch(`/api/latest?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Error fetching latest questionnaires: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questionnaires as Questionnaire[];
  },

  /**
   * Получить опросник по ID
   */
  async getQuestionnaire(id: number) {
    const response = await fetch(`/api/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching questionnaire: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questionnaire as Questionnaire;
  },

  /**
   * Создать новый опросник
   */
  async createQuestionnaire(questionnaire: Questionnaire) {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionnaire),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Error creating questionnaire: ${response.statusText}`
      );
    }

    return await response.json();
  },

  /**
   * Обновить существующий опросник
   */
  async updateQuestionnaire(id: number, questionnaire: Omit<Questionnaire, 'created_by' | 'created_at'>) {
    const response = await fetch(`/api/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionnaire),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Error updating questionnaire: ${response.statusText}`
      );
    }

    return await response.json();
  },

  /**
   * Удалить опросник
   */
  async deleteQuestionnaire(id: number) {
    const response = await fetch(`/api/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Error deleting questionnaire: ${response.statusText}`
      );
    }

    return await response.json();
  },

  /**
   * Назначить опросник группе
   */
  async assignQuestionnaire(questionnaireId: number, groupId: number, dueDate: Date) {
    const response = await fetch(`/api/${questionnaireId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        group_id: groupId,
        due_date: dueDate.toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Error assigning questionnaire: ${response.statusText}`
      );
    }

    return await response.json();
  },

  /**
   * Получить схему опросника (для генерации форм)
   */
  async getSchema() {
    const response = await fetch('/api/schema');

    if (!response.ok) {
      throw new Error(`Error fetching schema: ${response.statusText}`);
    }

    return await response.json();
  }
};