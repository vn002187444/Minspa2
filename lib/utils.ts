import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively normalizes all strings in an object/array to NFC form.
 * Fixes "decomposed" Vietnamese characters (e.g., 'viê´t' -> 'viết').
 */
export function normalizeNFC<T>(data: T): T {
  if (typeof data === 'string') {
    return data.normalize('NFC') as unknown as T
  }
  if (Array.isArray(data)) {
    return data.map(normalizeNFC) as unknown as T
  }
  if (data !== null && typeof data === 'object') {
    const normalized: Record<string, any> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        normalized[key] = normalizeNFC((data as any)[key])
      }
    }
    return normalized as T
  }
  return data
}
