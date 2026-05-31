export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

export function fail(message: string, errors?: Record<string, string[]>): ApiResponse {
  return { success: false, message, errors }
}
