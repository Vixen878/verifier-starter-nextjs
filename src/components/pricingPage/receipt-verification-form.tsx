"use client"

import type React from "react"
import { useState, type JSX } from "react"
import { AlertCircle, CheckCircle, Loader, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { env } from "@/env"

type ProviderId = "cbe" | "telebirr" | "abyssinia"

const providerNames: Record<ProviderId, string> = {
  cbe: "CBE",
  telebirr: "Telebirr",
  abyssinia: "Abyssinia Bank",
}

export default function ReceiptVerificationForm({
  provider,
  amount,
  onVerify,
  isVerifying,
  onGoBack,
  hints,
}: {
  provider: ProviderId | null
  amount: number
  onVerify: (reference: string) => Promise<void> | void
  isVerifying: boolean
  onGoBack: () => void
  hints?: { telebirr?: string; cbe?: string; abyssinia?: string }
}): JSX.Element {
  const [receiptNumber, setReceiptNumber] = useState<string>("")
  const [error, setError] = useState<string>("")

  const formattedAmount = Number.isFinite(amount)
    ? Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)
    : "0"

  // Use DB-provided hints exclusively (no env fallback)
  const labelsFromHints: Record<ProviderId, string> = {
    telebirr: hints?.telebirr ? `Telebirr ${hints.telebirr}` : "Telebirr",
    cbe: hints?.cbe ? `CBE account ${hints.cbe}` : "CBE account",
    abyssinia: hints?.abyssinia ? `Abyssinia account ${hints.abyssinia}` : "Abyssinia account",
  }
  const providerLabel = provider ? labelsFromHints[provider] : "your payment app"

  // Destination label used in instructions — from hints only
  const destinationFromHints: Record<ProviderId, string> = {
    telebirr: hints?.telebirr ? `Telebirr ${hints.telebirr}` : "Telebirr (configure number)",
    cbe: hints?.cbe ? `CBE account ${hints.cbe}` : "CBE account (configure account)",
    abyssinia: hints?.abyssinia ? `Abyssinia account ${hints.abyssinia}` : "Abyssinia account (configure account)",
  }
  const destinationLabel: string = provider ? destinationFromHints[provider] : providerLabel

  const accountDestinations: Record<ProviderId, string> = {
    telebirr: `Telebirr ${env.NEXT_PUBLIC_TELEBIRR_NUMBER}`,
    cbe: `CBE account ${env.NEXT_PUBLIC_CBE_ACCOUNT_NUMBER}`,
    abyssinia: `Abyssinia account ${env.NEXT_PUBLIC_ABYSSINIA_ACCOUNT_NUMBER}`,
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setReceiptNumber(value)
    setError("")
  }

  const validateReceipt = (): boolean => {
    const trimmed = receiptNumber.trim()
    if (!trimmed) {
      setError("Receipt reference number is required")
      return false
    }
    if (trimmed.length < 5) {
      setError("Receipt number must be at least 5 characters")
      return false
    }
    return true
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateReceipt()) return
    setError("")
    await onVerify(receiptNumber.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && receiptNumber.trim() && !isVerifying) {
      void handleSubmit()
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header with back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onGoBack}
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Change Provider
        </button>
        <h3 className="font-semibold text-foreground mb-1">Enter Receipt Reference</h3>
        <p className="text-sm text-muted-foreground">
          Complete payment in {providerLabel} app, then enter the reference number
        </p>
      </div>

      {/* Instructions box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-5"
      >
        <p className="text-xs text-foreground font-medium">
          <span className="font-bold">Instructions:</span> Send{" "}
          <span className="font-bold text-primary">{formattedAmount} ETB</span> to{" "}
          <span className="font-bold">{destinationLabel}</span>. You&apos;ll receive a receipt
          reference (5-15 characters).
        </p>
      </motion.div>

      {/* Input field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <label className="text-sm font-medium text-foreground mb-2 block">Receipt Reference Number</label>
        <Input
          type="text"
          value={receiptNumber}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., TXN123456789"
          disabled={isVerifying}
          className="font-mono text-sm"
          autoFocus
        />
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            aria-live="polite"
            className="mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3"
          >
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isVerifying || !receiptNumber.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
        >
          {isVerifying ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="mr-2"
              >
                <Loader className="h-4 w-4" />
              </motion.div>
              Verifying...
            </>
          ) : (
            "Buy & Verify"
          )}
        </Button>
      </motion.div>

      {/* What to expect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5 rounded-lg border border-border/50 bg-muted/40 p-3 space-y-2"
      >
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">What to expect</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <CheckCircle className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
            <span>Verification takes 10-30 seconds</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
            <span>Tokens credited instantly</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
            <span>Modal closes automatically</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  )
}
