import { useState, useCallback } from 'react'
import { FormErrors, WeekdaySettings, SpecificDateConfig } from '../components/schedule/types'
import { isAfter, isBefore, startOfDay } from 'date-fns'

export function useFormValidation() {
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const validateForm = useCallback((
    selectedSurvey: string,
    selectedGroups: string[],
    scheduleType: string,
    oneTimeDate: Date | undefined,
    oneTimeTime: string,
    weekdays: number[],
    weekdaySettings: WeekdaySettings,
    specificDatesConfig: SpecificDateConfig,
  ) => {
    const errors: FormErrors = {}

    // Validate survey selection
    if (!selectedSurvey) {
      errors.survey = "Please select a survey"
    }

    // Validate groups
    if (selectedGroups.length === 0) {
      errors.groups = "Please select at least one group"
    }

    // Schedule type specific validation
    switch (scheduleType) {
      case "ONE_TIME":
        if (!oneTimeDate || !oneTimeTime) {
          errors.oneTime = "Please set both date and time"
        }
        break

      case "WEEKLY":
        if (weekdays.length === 0) {
          errors.weekly = "Please select at least one weekday"
        }
        break

      case "SPECIFIC_DATES":
        if (!specificDatesConfig.startDate) {
          errors.specificDates = "Please set start date"
        }
        break
    }

    setFormErrors(errors)
    setIsFormValid(Object.keys(errors).length === 0)
    return Object.keys(errors).length === 0
  }, [])

  return { formErrors, isFormValid, validateForm }
}