"use client"

import { useState, type JSX, useEffect } from "react"
import PaymentModal from "./payment-modal"
import PackageGrid from "./package-grid"
import AccountDashboard from "./account-dashboard"
import Header from "../header"
import { api } from "@/trpc/react"
import { useSession, signIn } from "next-auth/react"

type Package = Readonly<{
    id: number
    name: string
    tokens: number
    price: number
    description: string
    features: readonly string[]
    popular?: boolean
}>

export default function PricingPage(): JSX.Element {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
    const [userTokens, setUserTokens] = useState<number>(0)
    const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false)
    const { status } = useSession()
    const isLoggedIn: boolean = status === "authenticated"

    const { data: fetchedTokens } = api.user.getTokens.useQuery(undefined, {
        retry: 1,
        select: (d) => d.tokens,
        enabled: isLoggedIn,
    })
    useEffect(() => {
        if (typeof fetchedTokens === "number") {
            setUserTokens(fetchedTokens)
        }
    }, [fetchedTokens])
    const packages: ReadonlyArray<Package> = [
        {
            id: 1,
            name: "Starter",
            tokens: 50,
            price: 50,
            description: "Perfect for getting started",
            features: ["50 AI Tokens", "Basic support", "30-day validity"],
            popular: false,
        },
        {
            id: 2,
            name: "Professional",
            tokens: 200,
            price: 200,
            description: "Most popular choice",
            features: ["200 AI Tokens", "Priority support", "90-day validity", "Monthly bonus tokens"],
            popular: true,
        },
        {
            id: 3,
            name: "Enterprise",
            tokens: 500,
            price: 500,
            description: "For power users",
            features: ["500 AI Tokens", "24/7 support", "Lifetime validity", "Weekly bonus tokens"],
            popular: false,
        },
    ]

    const handleBuyClick = (pkg: Package) => {
        if (!isLoggedIn) {
            void signIn(undefined, { callbackUrl: window.location.href })
            return
        }
        setSelectedPackage(pkg)
        setIsModalOpen(true)
    }

    const handlePaymentSuccess = (newTokens: number) => {
        setUserTokens((prev) => prev + newTokens)
        setIsModalOpen(false)
        setSelectedPackage(null)
        setVerificationSuccess(true)
        setTimeout(() => setVerificationSuccess(false), 3000)
    }

    return (
        <main className="min-h-screen bg-linear-to-b from-background to-muted/30">
            <Header userTokens={userTokens} />
            <div className="container mx-auto px-4 py-12">
                {isLoggedIn && (
                    <AccountDashboard userTokens={userTokens} verificationSuccess={verificationSuccess} />
                )}
                <div className="mt-16">
                    <PackageGrid packages={packages} onBuyClick={handleBuyClick} />
                </div>
            </div>
            {selectedPackage && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    package={selectedPackage}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </main>
    )
}
