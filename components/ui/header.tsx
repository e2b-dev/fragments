import Link from 'next/link'
import Image from 'next/image'

import { Models } from '@/lib/models'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Header({
  defaultModel,
  onModelChange
}: {
  defaultModel: keyof typeof Models
  onModelChange: (model: keyof typeof Models) => void
}) {
  return (
    <div className="fixed top-0 left-0 right-0 py-4 px-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2" target="_blank">
          <Image src="/logo.svg" alt="logo" width={30} height={30} />
          <h1 className="whitespace-pre text-[#3d3929]">AI Artifacts by </h1>
        </Link>
        <Link href="https://e2b.dev" className="underline decoration-[#ff8800] decoration-2 text-[#ff8800]" target="_blank">E2B</Link>
      </div>

      <Select onValueChange={onModelChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={Models[defaultModel].name}/>
        </SelectTrigger>
        <SelectContent>
          {Object.values(Models).map((model) => (
            <SelectItem key={model.value} value={model.value}>{model.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
  </div>
  )
}
