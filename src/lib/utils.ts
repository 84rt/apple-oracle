import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return 'Today'
  } else if (diffInHours < 48) {
    return 'Yesterday'
  } else if (diffInHours < 168) {
    return 'This Week'
  } else {
    return 'Older'
  }
}

export function generateChatTitle(firstMessage: string, mode: 'continuous' | 'single'): string {
  const truncated = firstMessage.length > 50 
    ? firstMessage.substring(0, 50) + '...' 
    : firstMessage
  
  const modeLabel = mode === 'continuous' ? 'Continuous' : 'Single Q'
  return `${truncated} (${modeLabel})`
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
