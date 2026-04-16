import type { AppError } from '@/lib/errors'

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError }

export function asyncIdle<T>(): AsyncState<T> {
  return { status: 'idle' }
}

export function asyncLoading<T>(): AsyncState<T> {
  return { status: 'loading' }
}

export function asyncSuccess<T>(data: T): AsyncState<T> {
  return { status: 'success', data }
}

export function asyncError<T>(error: AppError): AsyncState<T> {
  return { status: 'error', error }
}
