import { Survey } from './survey-service';
import { getWithAuth, postWithAuth } from '@/lib/api';

export interface Group {
  group_id: number | string;
  title: string;
  is_active: boolean;
}

export interface ScheduledSurvey {
  id: string;
  name: string;
  date: string;
  recurrence: string;
  target: string;
  status: string;
}

export interface AssignmentRequest {
  group_id: number;
  due_date: string;
}

export interface AssignmentResponse {
  status: string;
  message: string;
  questionnaire?: Survey;
}

/**
 * Fetches all active groups from the API
 * @returns A promise that resolves to the list of active groups
 */
export async function getActiveGroups(): Promise<Group[]> {
  try {
    // Try to load from both endpoints to see which one works
    let data;
    try {
      data = await getWithAuth<{status: string, count: number, groups: Group[]}>('/groups/active');
    } catch (error) {
      console.log("Failed to fetch from /groups/active, trying /groups");
      data = await getWithAuth<{status: string, count: number, groups: Group[]}>('/groups');
    }

    // Log the response to debug
    console.log("Groups API response:", data);

    // If the response doesn't have a groups field, return empty array
    if (!data.groups) {
      console.error("API response doesn't contain groups field:", data);
      return [];
    }

    // Filter to only include active groups and convert groupId to string to avoid issues with large IDs
    return data.groups
      .filter((group: Group) => group.is_active)
      .map((group: Group) => ({
        ...group,
        // Ensure group_id is treated as a string to avoid precision issues with large integers
        group_id: String(group.group_id)
      }));
  } catch (error) {
    console.error('Error in getActiveGroups service:', error);
    throw error;
  }
}

/**
 * Assigns a questionnaire to a group with a scheduled due date
 * @param questionnaireId The ID of the questionnaire to assign
 * @param assignmentData The assignment data (group ID and due date)
 * @returns A promise that resolves to the assignment response
 */
export async function assignQuestionnaire(
  questionnaireId: number,
  assignmentData: AssignmentRequest
): Promise<AssignmentResponse> {
  try {
    return await postWithAuth<AssignmentResponse>(`/questionnaires/${questionnaireId}/assign`, assignmentData);
  } catch (error) {
    console.error('Error in assignQuestionnaire service:', error);
    throw error;
  }
}


export async function getScheduledSurveys(): Promise<ScheduledSurvey[]> {
  try {
    const data = await getWithAuth<{status: string, count: number, assignments: any[]}>('/questionnaires/assignments');
    console.log("Assignments API response:", data); // Add this for debugging

    // Transform API data to match the format expected by the UI
    const scheduledSurveys = data.assignments.map((assignment: any) => ({
      id: assignment.id.toString(),
      name: assignment.questionnaire.title,
      date: new Date(assignment.due_date).toLocaleDateString(),
      recurrence: assignment.recurrence || 'Once',
      target: assignment.group.title,
      status: assignment.is_active ? 'Scheduled' : 'Sent'
    }));

    return scheduledSurveys;
  } catch (error) {
    console.error('Error in getScheduledSurveys service:', error);
    // Still return empty array in case of error to avoid breaking the UI
    return [];
  }
}