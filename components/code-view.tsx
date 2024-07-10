export function CodeView({ code }: { code: string }) {
  return (
    <pre className="max-h-full p-4 text-sm rounded-md">
      <code className="whitespace-pre-wrap">{code}</code>
    </pre>
  )
}