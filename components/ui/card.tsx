import { cn } from '@/lib/utils'

export function Card({
  isSelected,
  onClick,
  children
}: {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
    className={cn("shadow-sm shadow-[#FF8800]/50 border border-[#FF8800]/20 bg-[#FFE7CC]/20 px-3 py-2 rounded-md text-[#3d3929] text-sm cursor-pointer hover:bg-[#FF8800]/40 hover:border-[#FF8800]/40 transition-all", {
      "border-[#FF8800]/40 bg-[#FF8800]/40": isSelected,
    })}
    onClick={onClick}
    >
      {children}
    </div>
  )
}