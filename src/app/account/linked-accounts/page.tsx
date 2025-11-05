import { auth } from "@/server/auth"
import { redirect } from "next/navigation"
import ConnectedAccounts from "@/components/auth/connected-accounts"

export default async function LinkedAccountsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/api/auth/signin?callbackUrl=/account/linked-accounts")
    }

    return (
        <main className="container mx-auto px-4 py-10">
            <h1 className="text-xl font-semibold">Linked Accounts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Connect additional sign-in providers to your account.
            </p>
            <div className="mt-6">
                <ConnectedAccounts />
            </div>
        </main>
    )
}