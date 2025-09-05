# Fragments Frontend

A React-based frontend for the Fragments AI code generation platform, built with Vite, TypeScript, and Tailwind CSS.

## Features

- **Chat Interface**: Interactive chat for iterative code generation
- **Session Management**: Persistent chat sessions with history
- **Live Preview**: Real-time preview of generated code in E2B sandboxes
- **Multiple Models**: Support for GPT-4o, GPT-4, and GPT-3.5 Turbo
- **Multiple Templates**: Next.js, Vue.js, Python, Streamlit, and Gradio templates
- **Responsive Design**: Clean, modern UI with Tailwind CSS

## Architecture

```
src/
├── components/        # React components
│   ├── ChatInput.tsx     # Message input component
│   ├── ChatHistory.tsx   # Chat messages display
│   ├── ChatMessage.tsx   # Individual message component
│   └── PreviewPanel.tsx  # Code/preview display
├── hooks/            # React hooks
│   └── useChat.ts       # Chat state management
├── types/           # TypeScript type definitions
│   └── index.ts        # All shared types
├── utils/           # Utility functions
│   └── api.ts          # API integration
└── App.tsx          # Main application component
```

## Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- Backend API running on http://localhost:3000

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:5173

### Backend Integration

The frontend expects the following API endpoints to be available:

- `POST /api/generate/chat` - Chat-based generation
- `GET /api/generate/session/{sessionId}` - Get session history
- `DELETE /api/generate/session/{sessionId}` - Delete session

Make sure your backend is running on http://localhost:3000 with CORS enabled for the frontend.

## Usage

1. **Start a Chat**: Type a message describing what you want to build
2. **Select Model/Template**: Use the dropdowns to choose your preferred AI model and project template
3. **Iterative Development**: Continue the conversation to refine and extend your project
4. **View Code**: Switch between preview and code tabs to see the generated code
5. **Open Project**: Click the "Open ↗" link to view the live project in a new tab

## Session Management

- Sessions are automatically created when you start a chat
- Session IDs are displayed in the header (last 6 characters)
- Use the "Clear" button to start a new session
- Sessions persist for 24 hours on the backend

## API Integration

The frontend uses a clean API abstraction layer in `src/utils/api.ts`:

```typescript
// Send a chat message
await sendChatMessage({
  sessionId: 'session_123',
  message: 'Add dark mode to the app',
  model: 'gpt-4o',
  template: 'nextjs-developer'
})

// Get session history
const session = await getSession('session_123')

// Delete a session
await deleteSession('session_123')
```

## Components

### ChatInput
- Auto-resizing textarea
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Disabled state during loading

### ChatHistory
- Auto-scrolling to latest messages
- Loading indicators
- Clickable fragment previews

### PreviewPanel
- Tabbed interface (Preview/Code)
- Embedded iframe for live previews
- Syntax-highlighted code display
- Project metadata

## State Management

The `useChat` hook manages all chat-related state:

```typescript
const {
  sessionId,
  messages,
  fragments,
  currentFragment,
  currentResult,
  isLoading,
  error,
  sendMessage,
  clearChat,
  setCurrentFragment
} = useChat()
```

## Styling

Built with Tailwind CSS 4 for:
- Responsive design
- Dark/light mode support
- Consistent spacing and typography
- Modern UI components

## Error Handling

- Network errors are displayed in the UI
- Failed requests show helpful error messages
- Loading states prevent user confusion
- Session recovery on connection restore