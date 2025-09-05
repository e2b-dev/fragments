import { useState } from 'react'
import type { Fragment, GenerateResponse } from '../types'

interface PreviewPanelProps {
  fragment: Fragment | null
  result: GenerateResponse | null
}

export function PreviewPanel({ fragment, result }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview')

  if (!fragment || !result) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-lg font-medium mb-2">No project selected</div>
          <div className="text-sm">
            Start a chat to generate your first project
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{fragment.title}</h2>
          <p className="text-sm text-gray-600">{fragment.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {fragment.template}
          </span>
          {result.shortUrl && (
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Open ↗
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Code
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full">
            <iframe
              src={result.previewUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
              title={`Preview of ${fragment.title}`}
            />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <pre className="p-4 text-sm font-mono bg-gray-50 text-gray-900 whitespace-pre-wrap">
              <code>{fragment.code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            File: {fragment.file_path} 
            {fragment.port && ` • Port: ${fragment.port}`}
          </div>
          <div>
            ID: {result.id.slice(0, 8)}...
          </div>
        </div>
        {fragment.has_additional_dependencies && (
          <div className="mt-1">
            Dependencies: {fragment.additional_dependencies.join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}