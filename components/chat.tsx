import { Terminal } from 'lucide-react'
import { Message } from 'ai/react'

import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { SandboxTemplate } from '@/lib/types'

// simulate simple monte carlo method with 1000 iterations. At each iteration, create a point and check if that point was inside the unit circle. If the point was inside, make it green. At the end show me visualization that shows all the points that you created in every iteration

export function Chat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  selectedTemplate,
  onSelectedTemplateChange,
}: {
  messages: Message[],
  input: string,
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
  selectedTemplate: SandboxTemplate,
  onSelectedTemplateChange: (template: SandboxTemplate) => void,
}) {
  return (
    <div className="flex-1 flex flex-col py-4 gap-4 max-h-full max-w-[800px] mx-auto justify-between">
      <div className="flex flex-col gap-2 overflow-y-auto max-h-full px-4 rounded-lg">
        {messages.map(message => (
          <div className={`py-2 px-4 shadow-sm whitespace-pre-wrap ${message.role !== 'user' ? 'bg-white' : 'bg-white/40'} rounded-lg border-b border-[#FFE7CC] font-serif`} key={message.id}>
            {message.content}
            {message.toolInvocations && message.toolInvocations.length > 0 &&
              <div className="mt-4 flex justify-start items-start border border-[#FFE7CC] rounded-md">
                <div className="p-2 self-stretch border-r border-[#FFE7CC] bg-[#FFE7CC] w-14 flex items-center justify-center">
                  <Terminal strokeWidth={2} className="text-[#FF8800]"/>
                </div>
                <div className="p-2 flex flex-col space-y-1 justify-start items-start min-w-[100px]">
                  {message.toolInvocations[0].toolName === "runPython" &&
                    <>
                      <span className="font-bold font-sans text-sm">{message.toolInvocations[0].args.title}</span>
                      <span className="font-sans text-sm">{message.toolInvocations[0].args.description}</span>
                    </>
                  }
                  {message.toolInvocations[0].toolName === "writeCodeToPageTsx" &&
                    <>
                      <span className="font-bold font-sans text-sm">{message.toolInvocations[0].args.title}</span>
                      <span className="font-sans text-sm">{message.toolInvocations[0].args.description}</span>
                    </>
                  }
                </div>
              </div>
            }
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          <Card
            isSelected={selectedTemplate === SandboxTemplate.CodeInterpreterMultilang}
            onClick={() => onSelectedTemplateChange(SandboxTemplate.CodeInterpreterMultilang)}
          >
            Python data analyst
          </Card>
          <Card
            isSelected={selectedTemplate === SandboxTemplate.NextJS}
            onClick={() => onSelectedTemplateChange(SandboxTemplate.NextJS)}
          >
            Next.js developer
          </Card>
        </div>
        <form onSubmit={handleSubmit}>
          <Input className="ring-0" placeholder="Ask Claude..." value={input} onChange={handleInputChange}/>
        </form>
      </div>
    </div>
  )
}