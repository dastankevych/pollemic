// /lib/survey-utils.ts
import { Survey, Question } from '@/services/survey-service';

/**
 * Normalizes survey questions to ensure consistent format
 * Handles cases where questions might be an object or array
 */
export function normalizeSurveyQuestions(survey: Survey): Survey {
  // Handle case where questions is an object with numeric keys
  if (survey.questions && typeof survey.questions === 'object' && !Array.isArray(survey.questions)) {
    // Convert object of questions to array
    const questionsArray: Question[] = Object.entries(survey.questions as Record<string, any>).map(([key, value]) => {
      // If the value is already a Question type, use it directly
      if (typeof value === 'object' && value !== null && 'text' in value && 'type' in value) {
        const question: Question = {
          id: parseInt(key, 10) || (value.id ? parseInt(String(value.id), 10) : 0),
          text: String(value.text || ''),
          type: String(value.type || 'text'),
          options: Array.isArray(value.options) ? value.options : null
        };
        return question;
      }

      // Otherwise, construct a default Question object
      return {
        id: parseInt(key, 10) || 0,
        text: typeof value === 'object' && value !== null && 'text' in value ? String(value.text || '') : 'Unknown question',
        type: typeof value === 'object' && value !== null && 'type' in value ? String(value.type || 'text') : 'text',
        options: typeof value === 'object' && value !== null && 'options' in value && Array.isArray(value.options) ? value.options : null
      };
    });

    return {
      ...survey,
      questions: questionsArray
    };
  }

  // If questions is already an array, ensure it has the right properties
  if (Array.isArray(survey.questions)) {
    const normalizedQuestions = survey.questions.map((q, index) => ({
      id: typeof q.id !== 'undefined' ? q.id : index,
      text: q.text || 'Unknown question',
      type: q.type || 'text',
      options: q.options || null
    }));

    return {
      ...survey,
      questions: normalizedQuestions
    };
  }

  // If questions is undefined or null, return empty array
  return {
    ...survey,
    questions: []
  };
}

/**
 * Maps UI question types to API question types
 */
export function mapQuestionTypeToApi(uiType: string): string {
  switch (uiType) {
    case 'text': return 'text';
    case 'radio': return 'single_choice';
    case 'checkbox': return 'multiple_choice';
    default: return uiType;
  }
}

/**
 * Maps API question types to UI question types
 */
export function mapQuestionTypeToUi(apiType: string): string {
  switch (apiType) {
    case 'text': return 'text';
    case 'single_choice': return 'radio';
    case 'multiple_choice': return 'checkbox';
    default: return apiType;
  }
}