// frontend/services/survey-service.ts
import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '@/lib/api';

/**
 * Interface representing a question in a survey
 */
export interface Question {
  id: number;
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
  questions: Question[] | Record<string, Question>;
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
  questions: Question[];
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
    const data = await postWithAuth<SurveyResponse>('/questionnaires', surveyData);
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
    const data = await getWithAuth<SurveyListResponse>(url);
    return data.questionnaires || [];
  } catch (error) {
    console.error('Error in getSurveys service:', error);
    throw error;
  }
}

/**
 * Fetches the latest surveys from the API
 * @param limit Optional limit on the number of surveys to fetch
 * @returns A promise that resolves to the list of latest surveys
 */
export async function getLatestSurveys(limit: number = 10): Promise<Survey[]> {
  try {
    const data = await getWithAuth<SurveyListResponse>(`/questionnaires/latest?limit=${limit}`);
    return data.questionnaires || [];
  } catch (error) {
    console.error('Error in getLatestSurveys service:', error);
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
    const data = await getWithAuth<{status: string, questionnaire: Survey}>(`/questionnaires/${id}`);
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
export async function updateSurvey(id: number, surveyData: Partial<CreateSurveyRequest>): Promise<Survey> {
  try {
    const data = await putWithAuth<{questionnaire: Survey}>(`/questionnaires/${id}`, surveyData);
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
    await deleteWithAuth<{status: string, message: string}>(`/questionnaires/${id}`);
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
    const data = await postWithAuth<any>(`/questionnaires/${surveyId}/assign`, {
      group_id: groupId,
      due_date: dueDate.toISOString()
    });
    return data;
  } catch (error) {
    console.error('Error in assignSurvey service:', error);
    throw error;
  }
}