import { Survey } from './survey-service';

export interface Group {
  group_id: number;
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
    let response;
    try {
      response = await fetch('/groups/active', {
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.log("Failed to fetch from /groups/active, trying /groups");
      response = await fetch('/groups', {
        headers: {
          'Accept': 'application/json'
        }
      });
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch active groups');
    }

    const data = await response.json();
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
    const response = await fetch(`/questionnaires/${questionnaireId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(assignmentData)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to assign questionnaire');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in assignQuestionnaire service:', error);
    throw error;
  }
}


export async function getScheduledSurveys(): Promise<ScheduledSurvey[]> {
  try {
    const response = await fetch('/questionnaires/assignments', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch scheduled surveys');
    }

    const data = await response.json();
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