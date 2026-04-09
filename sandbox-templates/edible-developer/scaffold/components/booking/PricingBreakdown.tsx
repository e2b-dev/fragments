import type { DisplayPricing } from '@/engine'

interface PricingBreakdownProps {
  pricing: DisplayPricing
}

export function PricingBreakdown({ pricing }: PricingBreakdownProps) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {pricing.nightly} x {pricing.nights} night{pricing.nights !== 1 ? 's' : ''}
        </span>
        <span>{pricing.subtotal}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Cleaning fee</span>
        <span>{pricing.cleaningFee}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Service fee</span>
        <span>{pricing.serviceFee}</span>
      </div>
      <div className="flex justify-between font-semibold border-t border-border pt-3">
        <span>Total</span>
        <span>{pricing.total}</span>
      </div>
    </div>
  )
}
