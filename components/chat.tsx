import { ArrowUp, ImagePlus, Square, Terminal, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Message, MessageText } from '@/lib/messages'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'

// simulate simple monte carlo method with 1000 iterations. At each iteration, create a point and check if that point was inside the unit circle. If the point was inside, make it green. At the end show me visualization that shows all the points that you created in every iteration

export function Chat({
  isLoading,
  stop,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
}: {
  isLoading: boolean,
  stop: () => void,
  messages: Message[],
  input: string,
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
  isMultiModal: boolean,
  files: FileList | null,
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
}) {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  return (
    <div className="flex-1 flex flex-col py-4 gap-4 max-h-full max-w-[800px] mx-auto justify-between">
      <div id="chat-container" className="flex flex-col gap-2 overflow-y-auto max-h-full px-4 rounded-lg">
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

      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-row gap-2 items-center">
          <div className="relative">
            <input type="file" id="multimodal" name="multimodal" accept="image/*" multiple={true} className="hidden" onChange={handleFileChange} />
            <Button disabled={!isMultiModal} type="button" variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={(e) => { e.preventDefault(); document.getElementById('multimodal')?.click() }}>
              <ImagePlus className="h-5 w-5" />
            </Button>
            { files && <div className="absolute top-[-3px] right-[-3px] bg-[#ff8800] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{files.length}</div> }
          </div>
          <Input className="ring-0 rounded-xl" required={true} placeholder="Describe your app..." value={input} onChange={handleInputChange}/>
          { !isLoading ? (
              <Button variant="secondary" size="icon" className='rounded-full h-10 w-11'>
                <ArrowUp className="h-5 w-5" />
              </Button>
          ) : (
              <Button variant="secondary" size="icon" className='rounded-full h-10 w-11' onClick={(e) => { e.preventDefault(); stop() }}>
                <Square className="h-5 w-5" />
              </Button>
            )
          }
        </form>
      </div>
    </div>
  )
}
