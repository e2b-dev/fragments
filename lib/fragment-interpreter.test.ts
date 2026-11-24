import { FragmentInterpreter } from '@/components/fragment-interpreter'
import type { ExecutionResultInterpreter } from '@/lib/types'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

type CellResult = ExecutionResultInterpreter['cellResults'][number]

function renderResult(
  overrides: Partial<Omit<ExecutionResultInterpreter, 'cellResults'>> & {
    cellResults?: Partial<CellResult>[]
  } = {},
) {
  const { cellResults = [], ...rest } = overrides
  const result: ExecutionResultInterpreter = {
    sbxId: 'sandbox',
    template: 'code-interpreter-v1',
    stdout: [],
    stderr: [],
    ...rest,
    cellResults: cellResults as CellResult[],
  }
  return renderToStaticMarkup(createElement(FragmentInterpreter, { result }))
}

test('interpreter shows a text-only result as escaped text', () => {
  const html = renderResult({ cellResults: [{ text: '<b>four</b>' }] })

  assert.match(html, /&lt;b&gt;four&lt;\/b&gt;/)
  assert.doesNotMatch(html, /<img\b/)
})

test('interpreter keeps renderable results in order alongside logs', () => {
  const html = renderResult({
    cellResults: [
      { html: '<h1>Unsupported representation</h1>' },
      { text: 'FIRST cell' },
      { png: 'YWJj', text: 'Image fallback description' },
      { text: 'LAST cell' },
    ],
    stdout: ['A stdout line'],
    stderr: ['A stderr line'],
  })

  assert.match(html, /FIRST cell.*data:image\/png;base64,YWJj.*LAST cell/)
  assert.match(html, /A stdout line/)
  assert.match(html, /A stderr line/)
  assert.doesNotMatch(html, /Unsupported representation|Image fallback description/)
})

test('interpreter shows no broken image when results have no supported representation', () => {
  const html = renderResult({ cellResults: [{ html: '<h1>Skipped</h1>' }] })

  assert.match(html, /No previewable output/)
  assert.doesNotMatch(html, /<img\b|Skipped/)
})

test('interpreter retains the runtime error display', () => {
  const html = renderResult({
    runtimeError: {
      name: 'ValueError',
      value: 'bad input',
      traceback: 'A traceback',
    },
    cellResults: [{ text: 'not shown' }],
  })

  assert.match(html, /ValueError: bad input/)
  assert.match(html, /A traceback/)
  assert.doesNotMatch(html, /not shown/)
})
