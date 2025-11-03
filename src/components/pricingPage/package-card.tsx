"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JSX } from "react"

type Package = Readonly<{
  id: number
  name: string
  description: string
  price: number
  tokens: number
  popular?: boolean
  features: readonly string[]
}>

type PackageCardProps = Readonly<{
  package: Package
  onBuyClick: (pkg: Package) => void
}>

export default function PackageCard({
  package: pkg,
  onBuyClick,
}: PackageCardProps): JSX.Element {
  const formattedPrice = Number.isFinite(pkg.price)
    ? Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(pkg.price)
    : "0"

  const formattedTokens = Number.isFinite(pkg.tokens)
    ? Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(pkg.tokens)
    : "0"

  return (
    <div
      className={`relative rounded-xl border transition-all duration-300 ${
        pkg.popular
          ? "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-primary">{formattedPrice}</span>
          <span className="text-muted-foreground">ETB</span>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">{formattedTokens} AI Tokens</div>

        <Button
          type="button"
          onClick={() => onBuyClick(pkg)}
          className={`mt-6 w-full font-semibold cursor-pointer ${
            pkg.popular
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          }`}
        >
          Buy Now
        </Button>

        <div className="mt-6 space-y-3">
          {pkg.features.map((feature, idx) => (
            <div key={`${feature}-${idx}`} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
