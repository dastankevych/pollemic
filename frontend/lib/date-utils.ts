// /lib/date-utils.ts

/**
 * Format date string for display in various formats
 * @param dateString ISO date string
 * @returns Object with formatted date parts
 */
export function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }

    const now = new Date()

    // Format time in 24-hour format (HH:MM)
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const time = `${hours}:${minutes}`

    // Check if the date is today
    const isToday = date.toDateString() === now.toDateString()

    // Check if the date is yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    // Format date based on how recent it is
    let formattedDate
    if (isToday) {
      formattedDate = 'Today'
    } else if (isYesterday) {
      formattedDate = 'Yesterday'
    } else {
      formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    // For Telegram-style month-day format
    const monthDay = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    })

    // For relative time (e.g., "2 days ago")
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    let relativeTime
    if (diffDays === 0) {
      relativeTime = 'Today'
    } else if (diffDays === 1) {
      relativeTime = 'Yesterday'
    } else if (diffDays < 7) {
      relativeTime = `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      relativeTime = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      relativeTime = `${months} ${months === 1 ? 'month' : 'months'} ago`
    } else {
      const years = Math.floor(diffDays / 365)
      relativeTime = `${years} ${years === 1 ? 'year' : 'years'} ago`
    }

    return {
      time,
      date: formattedDate,
      relativeTime,
      monthDay,
      full: `${formattedDate} at ${time}`,
      iso: date.toISOString()
    }
  } catch (error) {
    // Return fallback values if date parsing fails
    return {
      time: "00:00",
      date: dateString,
      relativeTime: "Unknown date",
      monthDay: "Unknown",
      full: dateString,
      iso: dateString
    }
  }
}

/**
 * Simple date formatter
 * @param dateString Date string to format
 * @returns Formatted date string (or original if invalid)
 */
export function formatSimpleDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}