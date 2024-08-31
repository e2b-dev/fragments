import { ArrowUp, ChevronDown, Loader2, Square, Terminal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Message } from "ai/react";
import Markdown from "react-markdown";
import { CodeView } from "./code-view";
import { File } from "lucide-react";

// simulate simple monte carlo method with 1000 iterations. At each iteration, create a point and check if that point was inside the unit circle. If the point was inside, make it green. At the end show me visualization that shows all the points that you created in every iteration

export function Chat({
  isLoading,
  stop,
  messages,
  input,
  handleInputChange,
  handleSubmit,
}: {
  isLoading: boolean;
  stop: () => void;
  messages: any;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="flex-1 flex flex-col py-4 gap-4 max-h-full max-w-[800px] mx-auto justify-between">
      <div className="flex flex-col gap-2 overflow-y-auto max-h-full px-4 rounded-lg">
        {messages.map((message: Message, index: number) => (
          <div
            className={`py-2 px-4 shadow-sm whitespace-pre-wrap ${
              message.role !== "user" ? "bg-white" : "bg-white/40"
            } rounded-lg border-b border-[#FFE7CC] font-serif`}
            key={index}
          >
            <Markdown
              children={message.content}
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const [lang, filename] = className?.split(",") || [];
                  return (
                    <details open={true}>
                      <summary className="font-bold bg-neutral-50 p-2 rounded-lg text-sm cursor-pointer mt-0 flex items-center gap-1 select-none">
                        <File className="h-4 w-4" />
                        {filename ? filename : "code"}
                      </summary>
                      <CodeView
                        code={String(children).replace(/\n$/, "")}
                        lang={lang ? lang.split("-")[1] : "javascript"}
                        {...rest}
                      />
                    </details>
                  )
                },
              }}
            />
            {message.toolInvocations && (
              <div className="mt-4 flex justify-start items-start border border-[#FFE7CC] rounded-md">
                <div className="p-2 self-stretch border-r border-[#FFE7CC] bg-[#FFE7CC] w-14 flex items-center justify-center">
                  <Terminal strokeWidth={2} className="text-[#FF8800]" />
                </div>
                <div className="p-2 flex flex-col space-y-1 justify-start items-start min-w-[100px]">
                  <span className="font-bold font-sans text-sm">
                    {message.toolInvocations[0].args.title}
                  </span>
                  <span className="font-sans text-sm">
                    {message.toolInvocations[0].args.description}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-row gap-2">
          <Input
            className="ring-0 rounded-xl"
            required={true}
            placeholder="Describe your app..."
            value={input}
            onChange={handleInputChange}
          />
          {!isLoading ? (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-11"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-11"
              onClick={(e) => {
                e.preventDefault();
                stop();
              }}
            >
              <Square className="h-5 w-5" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
