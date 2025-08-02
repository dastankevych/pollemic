import { Group } from './schedule-service';
import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '@/lib/api';

export type ScheduleType = 'single' | 'dates' | 'weekdays';

export interface SpecificDate {
  date: string;
  start_time?: string;
  end_time?: string;
}

export interface Schedule {
  id: number;
  questionnaire_id: number;
  title: string;
  schedule_type: ScheduleType;
  active: boolean;
  groups: Group[];
  start_date: string;
  end_date?: string;
  weekdays?: number[];
  start_time?: string;
  end_time?: string;
  specific_dates?: SpecificDate[];
  created_at: string;
}

export interface CreateScheduleRequest {
  questionnaire_id: number;
  title: string;
  schedule_type: ScheduleType;
  group_ids: number[];
  start_date?: string;
  end_date?: string;
  weekdays?: number[];
  start_time?: string;
  end_time?: string;
  specific_dates?: SpecificDate[];
}

export interface UpdateScheduleRequest {
  title?: string;
  active?: boolean;
  group_ids?: number[];
  end_date?: string;
  weekdays?: number[];
  start_time?: string;
  end_time?: string;
  specific_dates?: SpecificDate[];
}

export interface ScheduleResponse {
  status: string;
  message: string;
  schedule_id?: number;
  schedule?: Schedule;
}

export interface ScheduleListResponse {
  status: string;
  count: number;
  schedules: Schedule[];
}

/**
 * Gets a list of all schedules
 * @param activeOnly Get only active schedules
 * @returns List of schedules
 */
export async function getSchedules(activeOnly: boolean = true): Promise<Schedule[]> {
  try {
    const url = `/schedules?active_only=${activeOnly}`;
    const data = await getWithAuth<ScheduleListResponse>(url);
    return data.schedules || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
}

/**
 * Gets a schedule by ID
 * @param scheduleId Schedule ID
 * @returns Schedule
 */
export async function getScheduleById(scheduleId: number): Promise<Schedule> {
  try {
    const data = await getWithAuth<{schedule: Schedule}>(`/schedules/${scheduleId}`);
    return data.schedule;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

/**
 * Creates a new schedule
 * @param scheduleData Schedule data
 * @returns Response with created schedule ID
 */
export async function createSchedule(scheduleData: CreateScheduleRequest): Promise<ScheduleResponse> {
  try {
    return await postWithAuth<ScheduleResponse>('/schedules', scheduleData);
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
}

/**
 * Updates an existing schedule
 * @param scheduleId Schedule ID
 * @param scheduleData Data to update
 * @returns Updated schedule
 */
export async function updateSchedule(scheduleId: number, scheduleData: UpdateScheduleRequest): Promise<ScheduleResponse> {
  try {
    return await putWithAuth<ScheduleResponse>(`/schedules/${scheduleId}`, scheduleData);
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

/**
 * Deletes a schedule
 * @param scheduleId Schedule ID
 * @returns Deletion result
 */
export async function deleteSchedule(scheduleId: number): Promise<ScheduleResponse> {
  try {
    return await deleteWithAuth<ScheduleResponse>(`/schedules/${scheduleId}`);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

/**
 * Triggers processing of schedules to create new assignments
 * @returns Processing result
 */
export async function processSchedules(): Promise<ScheduleResponse> {
  try {
    return await postWithAuth<ScheduleResponse>('/schedules/process', {});
  } catch (error) {
    console.error('Error processing schedules:', error);
    throw error;
  }
}

/**
 * Converts numerical weekday representations to names
 * @param days Array of weekdays (0-6)
 * @returns Array of weekday names
 */
export function getWeekdayNames(days: number[]): string[] {
  const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map(day => weekdayNames[day]);
}

/**
 * Formats dates in schedule for display
 * @param specificDates Array of specific dates
 * @returns Formatted array of dates
 */
export function formatSpecificDates(specificDates: SpecificDate[]): string[] {
  return specificDates.map(date => {
    let result = new Date(date.date).toLocaleDateString();
    if (date.start_time && date.end_time) {
      result += ` (${date.start_time} - ${date.end_time})`;
    }
    return result;
  });
}

/**
 * Gets a string representation of schedule type
 * @param type Schedule type
 * @returns Human-readable schedule type name
 */
export function getScheduleTypeName(type: ScheduleType): string {
  switch (type) {
    case 'single':
      return 'One-time';
    case 'dates':
      return 'Specific dates';
    case 'weekdays':
      return 'Weekly schedule';
    default:
      return type;
  }
}