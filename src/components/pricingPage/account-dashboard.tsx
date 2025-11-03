import { CheckCircle } from "lucide-react"
import type { JSX } from "react"

type AccountDashboardProps = Readonly<{
  userTokens: number
  verificationSuccess?: boolean
}>

export default function AccountDashboard({
  userTokens,
  verificationSuccess = false,
}: AccountDashboardProps): JSX.Element {
  const formattedTokens = Number.isFinite(userTokens)
    ? userTokens.toLocaleString()
    : "0"

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Token Account</h2>
          <p className="mt-2 text-muted-foreground">
            Manage your AI tokens and purchase packages to power your applications
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-primary">{formattedTokens}</div>
          <p className="mt-1 text-muted-foreground">Total Tokens</p>
        </div>
      </div>

      {verificationSuccess && (
        <div
          className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-900 dark:text-green-200">
            Payment verified successfully! Your tokens have been added to your account.
          </p>
        </div>
      )}
    </div>
  )
}
