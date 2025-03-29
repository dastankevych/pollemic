import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)

  // Форматирование в стиле Telegram
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return {
    date: date.toLocaleDateString("ru-RU", { month: "long", day: "numeric" }),
    time: `${hours}:${minutes}`,
  }
}

