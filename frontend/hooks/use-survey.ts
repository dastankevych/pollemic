// /hooks/use-surveys.ts
import { useState, useEffect, useCallback } from 'react'
import { getSurveys, getLatestSurveys, deleteSurvey, Survey } from '@/services/survey-service'
import { useToast } from '@/hooks/use-toast'

interface UseSurveysOptions {
  limit?: number
  latest?: boolean
  initialLoad?: boolean
}

/**
 * Custom hook for managing surveys
 * @param options Options for fetching surveys
 * @returns Object with surveys state and related functions
 */
export function useSurveys(options: UseSurveysOptions = {}) {
  const { limit = 20, latest = false, initialLoad = true } = options
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(initialLoad)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchSurveys = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let data: Survey[]

      if (latest) {
        data = await getLatestSurveys(limit)
      } else {
        data = await getSurveys(limit)
      }

      setSurveys(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(err instanceof Error ? err : new Error(errorMessage))

      // Only show toast if explicitly requested (avoids error toast on initial mount)
      if (initialLoad) {
        toast({
          variant: 'destructive',
          title: 'Failed to load surveys',
          description: errorMessage
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [limit, latest, toast, initialLoad])

  // Initial load of surveys
  useEffect(() => {
    if (initialLoad) {
      fetchSurveys()
    }
  }, [fetchSurveys, initialLoad])

  // Function to delete a survey and update state
  const removeSurvey = async (id: number) => {
    try {
      await deleteSurvey(id)
      setSurveys(prevSurveys => prevSurveys.filter(survey => survey.id !== id))

      toast({
        title: 'Survey deleted',
        description: 'The survey has been successfully deleted.'
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'

      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: errorMessage
      })

      return false
    }
  }

  // Function to manually reload surveys
  const reloadSurveys = () => {
    fetchSurveys()
  }

  // Function to add a survey to the list (useful after creation)
  const addSurvey = (survey: Survey) => {
    setSurveys(prevSurveys => [survey, ...prevSurveys])
  }

  // Function to update a survey in the list
  const updateSurvey = (updatedSurvey: Survey) => {
    setSurveys(prevSurveys =>
      prevSurveys.map(survey =>
        survey.id === updatedSurvey.id ? updatedSurvey : survey
      )
    )
  }

  return {
    surveys,
    isLoading,
    error,
    fetchSurveys,
    removeSurvey,
    reloadSurveys,
    addSurvey,
    updateSurvey
  }
}