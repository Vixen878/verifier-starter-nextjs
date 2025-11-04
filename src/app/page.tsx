"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import type { JSX } from "react"

export default function Home(): JSX.Element {
  return (
    <main className="min-h-screen bg-linear-to-b from-background to-muted/30">
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            Starter Demo - <Link
              href="https://www.npmjs.com/package/@creofam/verifier"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              @creofam/verifier
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Verify Payments and Credit Tokens Instantly
          </h1>
          <p className="mt-4 text-muted-foreground">
            This starter showcases how to build your apps around verification receipts with
            <Link
              href="https://www.npmjs.com/package/@creofam/verifier"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline decoration-primary hover:text-primary"
            >
              @creofam/verifier
            </Link>
            . Includes verifying receipts instantly, and a token system.
          </p>
        </motion.div>

        {/* Stack summary with lables and details about the stack */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-3"
        >
          {[
            { label: "Framework", value: "Next.js 15 (App Router)" },
            { label: "Auth", value: "NextAuth.js 5" },
            { label: "API", value: "tRPC v11 (Typed)" },
            { label: "Database", value: "Prisma (MySQL)" },
            { label: "Styling", value: "Tailwind CSS v4" },
            { label: "UI Kit", value: "shadcn/ui" },
            { label: "Animation", value: "motion.dev" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="font-semibold text-foreground">{label}:</span>
              <span className="ml-1 text-muted-foreground">{value}</span>
            </div>
          ))}
        </motion.div>

        {/* Add demos header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Demo Applications
          </h2>
        </motion.div>

        {/* Demo cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2"
        >
          <Card className="transition-all hover:border-primary/40">
            <CardHeader>
              <CardTitle>Demo 1: Instant Verification</CardTitle>
              <CardDescription>
                Verify Telebirr, CBE, and Abyssinia references without persisting data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type the reference (and suffix where needed), then view the result.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                <Link href="/demo/demo1-verifier">Open Verification Demo</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="transition-all hover:border-primary/40">
            <CardHeader>
              <CardTitle>Demo 2: Digital Purchase</CardTitle>
              <CardDescription>
                Purchase token packages and credit your account after verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Includes auth, a token system, and receipt validation powered by @creofam/verifier.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/demo/digital-purchase">Open Pricing Demo</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* What is @creofam/verifier? */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>What is @creofam/verifier?</CardTitle>
              <CardDescription>TypeScript SDK for Payment Verification API</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                It normalizes receipt verification across Ethiopian providers into one predictable shape for app developers.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  Built on top of the open-source Verifier API (
                  <Link
                    href="https://github.com/Vixen878/verifier-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary hover:text-primary"
                  >
                    GitHub
                  </Link>
                  ).
                </p>
                <p>
                  NPM package:
                  <Link
                    href="https://www.npmjs.com/package/@creofam/verifier"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline decoration-primary hover:text-primary"
                  >
                    @creofam/verifier
                  </Link>
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md bg-muted/40 border border-border/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Working Providers</p>
                    <p className="text-sm text-foreground mt-1">Telebirr, Commercial Bank of Ethiopia (CBE), Bank of Abyssinia</p>
                  </div>
                  <div className="rounded-md bg-muted/40 border border-border/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Known Issues</p>
                    <p className="text-sm text-foreground mt-1">Dashen Bank and CBE Birr (wallet) are currently experiencing issues</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Disclaimer: This project is not affiliated with the official providers and is a project made by Leul for developers who want to verify receipts from Ethiopian providers.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </main>
  )
}
