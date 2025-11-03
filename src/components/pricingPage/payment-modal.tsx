"use client"

import { useState, useEffect, type JSX } from "react"
import { X, Info } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReceiptVerificationForm from "./receipt-verification-form"
import PaymentProviderSelector from "./payment-provider-selector"
import { api } from "@/trpc/react"

type ProviderId = "cbe" | "telebirr" | "abyssinia"

type Package = Readonly<{
  id: number
  name: string
  price: number
  tokens: number
  description?: string
  popular?: boolean
  features?: readonly string[]
}>

type PaymentModalProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  package: Package
  onPaymentSuccess: (tokens: number) => void
}>

export default function PaymentModal({
  isOpen,
  onClose,
  package: pkg,
  onPaymentSuccess,
}: PaymentModalProps): JSX.Element {
  const [step, setStep] = useState<"provider" | "receipt">("provider")
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const verifyMutation = api.purchase.verifyAndCredit.useMutation()

  useEffect(() => {
    if (!isOpen) {
      setStep("provider")
      setSelectedProvider(null)
      setIsVerifying(false)
      setError(null)
    }
  }, [isOpen])

  const handleProviderSelect = (provider: ProviderId) => {
    setSelectedProvider(provider)
    setError(null)
  }

  const handleProceedToReceipt = () => {
    if (!selectedProvider) {
      setError("Please select a payment provider")
      return
    }
    setStep("receipt")
  }

  const handleVerifyReceipt = async (receiptNumber: string) => {
    setIsVerifying(true)
    setError(null)
    try {
      if (!selectedProvider) throw new Error("No provider selected")
      await verifyMutation.mutateAsync({
        provider: selectedProvider,
        reference: receiptNumber,
        packageId: pkg.id,
      })
      onPaymentSuccess(pkg.tokens)
    } catch (err: unknown) {
      const getErrorMessage = (e: unknown): string => {
        if (e instanceof Error) return e.message
        if (typeof e === "object" && e) {
          const maybeWithData = e as { data?: unknown }
          const data = maybeWithData.data
          if (typeof data === "object" && data) {
            const maybeMsg = (data as { message?: unknown }).message
            if (typeof maybeMsg === "string") return maybeMsg
          }
        }
        return "Verification failed. Please check the reference and try again."
      }
      const msg: string = getErrorMessage(err)
      setError(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGoBack = () => {
    setStep("provider")
    setSelectedProvider(null)
    setError(null)
  }

  const formattedPrice = Number.isFinite(pkg.price)
    ? Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(pkg.price)
    : "0"
  const formattedTokens = Number.isFinite(pkg.tokens)
    ? Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(pkg.tokens)
    : "0"

  if (!isOpen) return <></>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-linear-to-r from-primary/5 to-secondary/5 p-6">
          <h2 id="payment-modal-title" className="text-xl font-bold text-foreground">Complete Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted transition-colors duration-200 cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Package Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-linear-to-br from-primary/10 to-secondary/10 border border-primary/20 p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package</p>
                <p className="font-bold text-lg text-foreground mt-1">{pkg.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Amount</p>
                <p className="text-3xl font-bold text-primary mt-1">{formattedPrice} ETB</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-primary/20">
              <p className="text-sm text-muted-foreground">
                You will receive <span className="font-bold text-primary">{formattedTokens}</span> AI Tokens
              </p>
            </div>
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
                className="mb-4 flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-3"
              >
                <Info className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === "provider" && (
              <motion.div
                key="provider"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PaymentProviderSelector
                  selectedProvider={selectedProvider}
                  onProviderSelect={handleProviderSelect}
                  amount={pkg.price}
                />
              </motion.div>
            )}

            {step === "receipt" && (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ReceiptVerificationForm
                  provider={selectedProvider}
                  amount={pkg.price}
                  onVerify={handleVerifyReceipt}
                  isVerifying={isVerifying}
                  onGoBack={handleGoBack}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex gap-3"
          >
            {step === "receipt" && (
              <Button
                type="button"
                onClick={handleGoBack}
                variant="outline"
                className="flex-1 bg-transparent cursor-pointer"
                disabled={isVerifying}
              >
                Back
              </Button>
            )}
            {step === "provider" && (
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-transparent cursor-pointer"
              >
                Cancel
              </Button>
            )}
            {step === "provider" && (
              <Button
                type="button"
                onClick={handleProceedToReceipt}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                disabled={!selectedProvider}
              >
                Continue
              </Button>
            )}
          </motion.div>

          {/* Instructions Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">
                    <Info className="h-4 w-4" />
                    How it works
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <ol className="space-y-2">
                    <li className="flex gap-2 text-xs">
                      <span className="font-bold text-secondary shrink-0">1.</span>
                      <span>Select your preferred payment provider</span>
                    </li>
                    <li className="flex gap-2 text-xs">
                      <span className="font-bold text-secondary shrink-0">2.</span>
                      <span>Open the provider app and transfer the amount shown</span>
                    </li>
                    <li className="flex gap-2 text-xs">
                      <span className="font-bold text-secondary shrink-0">3.</span>
                      <span>Enter the receipt reference number</span>
                    </li>
                    <li className="flex gap-2 text-xs">
                      <span className="font-bold text-secondary shrink-0">4.</span>
                      <span>Tokens will be added instantly upon verification</span>
                    </li>
                  </ol>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
