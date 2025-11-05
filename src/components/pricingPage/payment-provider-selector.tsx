"use client"

import { Phone, Smartphone, Banknote } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"
import type { JSX } from "react"

type ProviderId = "cbe" | "telebirr" | "abyssinia"

interface Provider {
  id: ProviderId
  name: string
  icon: LucideIcon
  description: string
  gradient: string
  accentColor: string
}

const providers: ReadonlyArray<Provider> = [
  {
    id: "cbe",
    name: "CBE",
    icon: Banknote,
    description: "Commercial Bank",
    gradient: "from-blue-500 to-blue-600",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "telebirr",
    name: "Telebirr",
    icon: Phone,
    description: "Mobile Money",
    gradient: "from-orange-500 to-orange-600",
    accentColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "abyssinia",
    name: "Abyssinia",
    icon: Smartphone,
    description: "Bank Transfer",
    gradient: "from-emerald-500 to-emerald-600",
    accentColor: "text-emerald-600 dark:text-emerald-400",
  },
]

type PaymentProviderSelectorProps = Readonly<{
  selectedProvider: ProviderId | null
  onProviderSelect: (id: ProviderId) => void
  amount: number
}>

export default function PaymentProviderSelector({
  selectedProvider,
  onProviderSelect,
  amount,
}: PaymentProviderSelectorProps): JSX.Element {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-semibold text-foreground mb-1">Select Payment Provider</h3>
        <p className="text-sm text-muted-foreground">
          Pay <span className="font-bold text-primary">{amount} ETB</span>
        </p>
      </div>

      <motion.div
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
      >
        {providers.map((provider, index) => {
          const Icon = provider.icon
          const isSelected = selectedProvider === provider.id

          return (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onProviderSelect(provider.id)}
              className={`relative group rounded-xl overflow-hidden p-4 border-2 transition-all duration-300 ${
                isSelected ? `border-primary bg-primary/10` : "border-muted bg-card hover:border-muted-foreground/30"
              }`}
            >
              {/* Background gradient on hover */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${provider.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              <div className="relative z-10 flex flex-col items-center text-center gap-3">
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: isSelected ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-lg p-2.5 bg-linear-to-br ${provider.gradient} text-white`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                {/* Text */}
                <div>
                  <p className="font-bold text-sm text-foreground">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>

                {/* Check indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border border-border/50 bg-muted/40 p-3"
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span> Ensure you have{" "}
          <span className="font-bold text-primary">{amount} ETB</span> available before proceeding.
        </p>
      </motion.div>
    </div>
  )
}
