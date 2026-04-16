import { AppError, ErrorCode } from '@/lib/errors'
import { describe, expect, it } from 'vitest'
import { asyncError, asyncIdle, asyncLoading, asyncSuccess } from './types'
import type { AsyncState } from './types'

describe('AsyncState helpers', () => {
  it('asyncIdle returns idle state', () => {
    const state = asyncIdle<string>()
    expect(state).toEqual({ status: 'idle' })
  })

  it('asyncLoading returns loading state', () => {
    const state = asyncLoading<string>()
    expect(state).toEqual({ status: 'loading' })
  })

  it('asyncSuccess returns success state with data', () => {
    const state = asyncSuccess('hello')
    expect(state).toEqual({ status: 'success', data: 'hello' })
  })

  it('asyncSuccess<void>(undefined) returns success with undefined data', () => {
    const state = asyncSuccess<void>(undefined)
    expect(state).toEqual({ status: 'success', data: undefined })
  })

  it('asyncError returns error state with AppError', () => {
    const error = new AppError({
      code: ErrorCode.UNKNOWN,
      httpStatus: 500,
      userMessage: 'Something went wrong.',
      message: 'test error',
    })
    const state = asyncError<string>(error)
    expect(state).toEqual({ status: 'error', error })
  })

  it('AsyncState type narrows correctly', () => {
    const state: AsyncState<number> = asyncSuccess(42)
    if (state.status === 'success') {
      expect(state.data).toBe(42)
    }
  })
})
