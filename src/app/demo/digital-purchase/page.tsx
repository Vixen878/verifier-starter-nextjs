"use client"

import { useState, type JSX, useEffect } from "react"
import { api } from "@/trpc/react"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import AccountDashboard from "@/components/pricingPage/account-dashboard"
import PackageGrid from "@/components/pricingPage/package-grid"
import PaymentModal from "@/components/pricingPage/payment-modal"

type Package = Readonly<{
    id: number
    name: string
    tokens: number
    price: number
    description: string
    features: readonly string[]
    popular?: boolean
}>

// Define typed, readonly packages list used by PackageGrid
const packages: ReadonlyArray<Package> = [
    {
        id: 1,
        name: "Starter",
        tokens: 50,
        price: 50,
        description: "Perfect for getting started and small tests.",
        features: ["Instant activation", "Basic support", "All providers"],
        popular: false,
    },
    {
        id: 2,
        name: "Pro",
        tokens: 200,
        price: 200,
        description: "For regular use and deeper integration testing.",
        features: ["Priority support", "Usage insights", "All providers"],
        popular: true,
    },
    {
        id: 3,
        name: "Scale",
        tokens: 500,
        price: 500,
        description: "Best for heavy testing and staging environments.",
        features: ["Premium support", "Advanced analytics", "All providers"],
        popular: false,
    },
] as const

export default function PricingPage(): JSX.Element {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
    const [userTokens, setUserTokens] = useState<number>(0)
    const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false)
    const { status } = useSession()
    const isLoggedIn: boolean = status === "authenticated"
    // Load per-user config
    const { data: userCfg } = api.userConfig.get.useQuery(undefined, { enabled: isLoggedIn })
    const upsertConfig = api.userConfig.upsert.useMutation()
    // NEW: fetch current token balance and keep it in sync
    const utils = api.useUtils()
    const { data: tokensData } = api.user.getTokens.useQuery(undefined, { enabled: isLoggedIn })
    useEffect(() => {
        if (tokensData?.tokens !== undefined) {
            setUserTokens(tokensData.tokens)
        }
    }, [tokensData])
    // UI config state (DB-backed when logged in)
    type PricingConfig = Readonly<{
        platformOwnerFullName?: string
        cbeAccountSuffix?: string
        abyssiniaAccountSuffix?: string
        telebirrNumber?: string
        cbeAccountNumber?: string
        abyssiniaAccountNumber?: string
    }>
    const [configOpen, setConfigOpen] = useState<boolean>(false)
    const [config, setConfig] = useState<PricingConfig>({})
    useEffect(() => {
        if (userCfg && isLoggedIn) {
            setConfig({
                platformOwnerFullName: userCfg.platformOwnerFullName ?? "",
                cbeAccountSuffix: userCfg.cbeAccountSuffix ?? "",
                abyssiniaAccountSuffix: userCfg.abyssiniaAccountSuffix ?? "",
                telebirrNumber: userCfg.telebirrNumber ?? "",
                cbeAccountNumber: userCfg.cbeAccountNumber ?? "",
                abyssiniaAccountNumber: userCfg.abyssiniaAccountNumber ?? "",
            })
        }
    }, [userCfg, isLoggedIn])

    const handleSaveConfig = async (): Promise<void> => {
        await upsertConfig.mutateAsync({
            platformOwnerFullName: config.platformOwnerFullName ?? undefined,
            cbeAccountSuffix: config.cbeAccountSuffix ?? undefined,
            abyssiniaAccountSuffix: config.abyssiniaAccountSuffix ?? undefined,
            telebirrNumber: config.telebirrNumber ?? undefined,
            cbeAccountNumber: config.cbeAccountNumber ?? undefined,
            abyssiniaAccountNumber: config.abyssiniaAccountNumber ?? undefined,
        })
        setConfigOpen(false)
    }

    const handleBuyClick = (pkg: Package) => {
        if (!isLoggedIn) {
            void signIn(undefined, { callbackUrl: window.location.href })
            return
        }
        // Gate purchase on having basic config
        const needsConfig = !config.platformOwnerFullName || (!config.cbeAccountSuffix && !config.abyssiniaAccountSuffix)
        if (needsConfig) {
            setConfigOpen(true)
            return
        }
        setSelectedPackage(pkg)
        setIsModalOpen(true)
    }

    const handlePaymentSuccess = (newTokens: number) => {
        // Optimistic UI update
        setUserTokens((prev) => prev + newTokens)
        // Refresh with authoritative server value
        void utils.user.getTokens.invalidate()

        setIsModalOpen(false)
        setSelectedPackage(null)
        setVerificationSuccess(true)
        setTimeout(() => setVerificationSuccess(false), 3000)
    }

    return (
        <main className="min-h-screen bg-linear-to-b from-background to-muted/30">
            {/* header is now global via layout */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Choose Your Package</h2>
                        <p className="mt-2 text-muted-foreground">
                            Select the perfect plan for your needs. All packages include instant activation.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfigOpen((v) => !v)}
                        className="cursor-pointer"
                    >
                        {configOpen ? "Close Configuration" : "Configure Test Details"}
                    </Button>
                </div>
                {configOpen && (
                    <div className="my-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="owner">Platform Owner Full Name</Label>
                                <Input
                                    id="owner"
                                    placeholder="e.g., LEUL ZENEBE ADMASSU"
                                    value={config.platformOwnerFullName ?? ""}
                                    onChange={(e) => setConfig((c) => ({ ...c, platformOwnerFullName: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cbeSuffix">CBE Account Suffix (8 digits)</Label>
                                <Input
                                    id="cbeSuffix"
                                    placeholder="e.g., 16825193"
                                    value={config.cbeAccountSuffix ?? ""}
                                    onChange={(e) => setConfig((c) => ({ ...c, cbeAccountSuffix: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="abySuffix">Abyssinia Account Suffix (5 digits)</Label>
                                <Input
                                    id="abySuffix"
                                    placeholder="e.g., 75434"
                                    value={config.abyssiniaAccountSuffix ?? ""}
                                    onChange={(e) => setConfig((c) => ({ ...c, abyssiniaAccountSuffix: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="telebirr">Telebirr Number (251...)</Label>
                                <Input
                                    id="telebirr"
                                    placeholder="e.g., 251902523658"
                                    value={config.telebirrNumber ?? ""}
                                    onChange={(e) => setConfig((c) => ({ ...c, telebirrNumber: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cbeAcc">CBE Account Number</Label>
                                <Input
                                    id="cbeAcc"
                                    placeholder="e.g., 1000416825193"
                                    value={config.cbeAccountNumber ?? ""}
                                    onChange={(e) => setConfig((c) => ({ ...c, cbeAccountNumber: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="abyAcc">Abyssinia Account Number</Label>
                                <Input
                                    id="abyAcc"
                                    placeholder="Your Abyssinia account number"
                                    value={config.abyssiniaAccountNumber ?? ""}
                                    onChange={(e) => setConfig((c) => ({ ...c, abyssiniaAccountNumber: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button type="button" onClick={handleSaveConfig} className="cursor-pointer">
                                Save Configuration
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setConfigOpen(false)} className="cursor-pointer">
                                Close
                            </Button>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Saved to your account. Verification uses these values.
                        </p>
                    </div>
                )}
                {isLoggedIn && (
                    <AccountDashboard userTokens={userTokens} verificationSuccess={verificationSuccess} />
                )}
                <div className="mt-10">
                    <PackageGrid packages={packages} onBuyClick={handleBuyClick} />
                </div>
            </div>
            {selectedPackage && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    package={selectedPackage}
                    onPaymentSuccess={handlePaymentSuccess}
                    config={config}
                />
            )}
        </main>
    )
}
