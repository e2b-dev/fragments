import { Message } from '@/lib/messages'
import { Terminal } from 'lucide-react'
import { useEffect } from 'react'

export function Chat({
  messages,
}: {
  messages: Message[],
}) {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  return (
    <div id="chat-container" className="flex flex-col gap-2 overflow-y-auto max-h-full">
      {messages.map((message: Message, index: number) => (
        <div className={`py-2 px-4 shadow-sm whitespace-pre-wrap ${message.role !== 'user' ? 'bg-white/5 border text-muted-foreground' : 'bg-white/20'} rounded-lg font-serif`} key={index}>
          {message.content.map((content, id) => {
            if (content.type === 'text') {
              return <p key={content.text} className="flex-1">{content.text}</p>
            }
            if (content.type === 'image') {
              return <img key={id} src={content.image} alt="artifact" className="mr-2 inline-block w-[50px] h-[50px] object-contain border border-[#FFE7CC] rounded-lg bg-white mt-2" />
            }
          })}
          {message.meta &&
            <div className="mt-4 flex justify-start items-start border rounded-md">
              <div className="p-2 self-stretch border-r w-14 flex items-center justify-center">
                <Terminal strokeWidth={2} className="text-[#FF8800]"/>
              </div>
              <div className="p-2 flex flex-col space-y-1 justify-start items-start min-w-[100px]">
                <span className="font-bold font-sans text-sm text-primary">{message.meta.title}</span>
                <span className="font-sans text-sm">{message.meta.description}</span>
              </div>
            </div>
          }
        </div>
      ))}
    </div>
  )
}
