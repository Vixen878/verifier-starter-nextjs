import type { JSX } from "react"
import PackageCard from "./package-card"

type Package = Readonly<{
  id: number
  name: string
  tokens: number
  price: number
  description: string
  features: readonly string[]
  popular?: boolean
}>

type PackageGridProps = Readonly<{
  packages: ReadonlyArray<Package>
  onBuyClick: (pkg: Package) => void
}>

export default function PackageGrid({ packages, onBuyClick }: PackageGridProps): JSX.Element {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-foreground">Choose Your Package</h2>
        <p className="mt-2 text-muted-foreground">
          Select the perfect plan for your needs. All packages include instant activation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} package={pkg} onBuyClick={onBuyClick} />
        ))}
      </div>
    </div>
  )
}
