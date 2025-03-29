// frontend/services/survey-service.ts

/**
 * Interface representing a question in a survey
 */
export interface QuestionModel {
  text: string;
  type: string;
  options: string[] | null;
}

/**
 * Interface for a full survey object from the API
 */
export interface Survey {
  id: number;
  title: string;
  description: string;
  questions: Record<string, any>;
  is_anonymous: boolean;
  created_at: string;
  created_by: number;
}

/**
 * Interface for creating a new survey
 */
export interface CreateSurveyRequest {
  title: string;
  description: string;
  questions: QuestionModel[];
  is_anonymous: boolean;
  created_by: number;
}

/**
 * Interface for survey response from API
 */
export interface SurveyResponse {
  status: string;
  questionnaire_id?: number;
  message?: string;
  questionnaire?: Survey;
}

/**
 * Interface for surveys list response
 */
export interface SurveyListResponse {
  status: string;
  count: number;
  questionnaires: Survey[];
}

/**
 * Creates a new survey by sending a request to the API
 * @param surveyData The survey data to submit
 * @returns A promise that resolves to the API response
 */
export async function createSurvey(surveyData: CreateSurveyRequest): Promise<SurveyResponse> {
  try {
    const response = await fetch('/questionnaires', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(surveyData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create survey');
    }

    return data;
  } catch (error) {
    console.error('Error in createSurvey service:', error);
    throw error;
  }
}

/**
 * Fetches all surveys from the API
 * @param limit Optional limit on the number of surveys to fetch
 * @returns A promise that resolves to the list of surveys
 */
export async function getSurveys(limit?: number): Promise<Survey[]> {
  try {
    const url = limit ? `/questionnaires?limit=${limit}` : '/questionnaires';
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch surveys');
    }

    const data = await response.json() as SurveyListResponse;
    return data.questionnaires || [];
  } catch (error) {
    console.error('Error in getSurveys service:', error);
    throw error;
  }
}

/**
 * Fetches a specific survey by its ID
 * @param id The ID of the survey to fetch
 * @returns A promise that resolves to the survey data
 */
export async function getSurveyById(id: number): Promise<Survey> {
  try {
    const response = await fetch(`/questionnaires/${id}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch survey');
    }

    const data = await response.json() as {status: string, questionnaire: Survey};
    return data.questionnaire;
  } catch (error) {
    console.error('Error in getSurveyById service:', error);
    throw error;
  }
}

/**
 * Updates an existing survey
 * @param id The ID of the survey to update
 * @param surveyData The updated survey data
 * @returns A promise that resolves to the updated survey
 */
export async function updateSurvey(id: number, surveyData: Partial<CreateSurveyRequest>): Promise<any> {
  try {
    const response = await fetch(`/questionnaires/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(surveyData)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to update survey');
    }

    const data = await response.json();
    return data.questionnaire;
  } catch (error) {
    console.error('Error in updateSurvey service:', error);
    throw error;
  }
}

/**
 * Deletes a survey by its ID
 * @param id The ID of the survey to delete
 * @returns A promise that resolves when the survey is successfully deleted
 */
export async function deleteSurvey(id: number): Promise<void> {
  try {
    const response = await fetch(`/questionnaires/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete survey');
    }
  } catch (error) {
    console.error('Error in deleteSurvey service:', error);
    throw error;
  }
}

/**
 * Assigns a survey to a group
 * @param surveyId The ID of the survey to assign
 * @param groupId The ID of the group to assign the survey to
 * @param dueDate The due date for the survey
 * @returns A promise that resolves to the assignment response
 */
export async function assignSurvey(surveyId: number, groupId: number, dueDate: Date): Promise<any> {
  try {
    const response = await fetch(`/questionnaires/${surveyId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        group_id: groupId,
        due_date: dueDate.toISOString()
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to assign survey');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in assignSurvey service:', error);
    throw error;
  }
}