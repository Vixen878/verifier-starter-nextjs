"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { VerifyResult } from "@/server/api/routers/verify";

type ProviderId = "telebirr" | "cbe" | "abyssinia";

export default function VerifyPage() {
    const [provider, setProvider] = useState<ProviderId>("telebirr");
    const [reference, setReference] = useState("");
    const [suffix, setSuffix] = useState("");
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const verifyMutation = api.verify.check.useMutation({
        onSuccess: (data) => {
            setResult(data);
            setError(null);
        },
        onError: (e) => {
            const msg = e?.message ?? "Verification failed. Please try again.";
            setError(msg);
            setResult(null);
        },
    });

    const requiresSuffix = provider === "cbe" || provider === "abyssinia";

    const handleVerify = () => {
        setError(null);
        setResult(null);

        if (!reference.trim() || reference.trim().length < 5) {
            setError("Reference must be at least 5 characters.");
            return;
        }
        if (requiresSuffix && !suffix.trim()) {
            setError("Suffix is required for the selected provider.");
            return;
        }

        if (provider === "telebirr") {
            verifyMutation.mutate({ provider: "telebirr", reference: reference.trim() });
        } else {
            verifyMutation.mutate({
                provider,
                reference: reference.trim(),
                suffix: suffix.trim(),
            } as { provider: "cbe" | "abyssinia"; reference: string; suffix: string });
        }
    };

    return (
        <main className="min-h-screen bg-linear-to-b from-background to-muted/30">
            <div className="container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="mx-auto max-w-2xl">
                        <CardHeader>
                            <CardTitle>Instant Payment Verification</CardTitle>
                            <CardDescription>
                                Select a provider, enter reference and optional suffix, then verify without storing any data.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {/* Provider selector */}
                            <div className="mb-6">
                                <p className="text-sm text-muted-foreground mb-2">Provider</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["telebirr", "cbe", "abyssinia"] as ProviderId[]).map((p) => (
                                        <Button
                                            key={p}
                                            type="button"
                                            variant={provider === p ? "default" : "outline"}
                                            className={`w-full ${provider === p ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                                            onClick={() => setProvider(p)}
                                        >
                                            {p === "telebirr" && "Telebirr"}
                                            {p === "cbe" && "CBE"}
                                            {p === "abyssinia" && "Abyssinia"}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference input */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-foreground mb-2 block">Reference</label>
                                <Input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                                    placeholder="e.g., CJU5RZ5NM3"
                                    className="font-mono text-sm"
                                />
                            </div>

                            {/* Suffix input (conditional) */}
                            <AnimatePresence initial={false}>
                                {requiresSuffix && (
                                    <motion.div
                                        key="suffix"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4"
                                    >
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            {provider === "cbe" ? "Account Suffix" : "Suffix"}
                                        </label>
                                        <Input
                                            value={suffix}
                                            onChange={(e) => setSuffix(e.target.value)}
                                            placeholder={provider === "cbe" ? "e.g., 12345678" : "e.g., 12345"}
                                            className="font-mono text-sm"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action */}
                            <div className="mt-6 flex gap-3">
                                <Button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={verifyMutation.isPending}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                >
                                    {verifyMutation.isPending ? (
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                            className="inline-block"
                                        >
                                            ⟳
                                        </motion.span>
                                    ) : (
                                        "Verify"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setReference("");
                                        setSuffix("");
                                        setResult(null);
                                        setError(null);
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3"
                                        role="alert"
                                        aria-live="polite"
                                    >
                                        <p className="text-sm text-destructive font-medium">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Result */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-6 space-y-4"
                                    >
                                        <div className="rounded-xl bg-linear-to-br from-primary/10 to-secondary/10 border border-primary/20 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Provider</p>
                                                    <p className="font-bold text-lg text-foreground mt-1">
                                                        {result.provider === "telebirr" ? "Telebirr" : result.provider.toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</p>
                                                    <p className="text-3xl font-bold text-primary mt-1">
                                                        {Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(result.amount)}{" "}
                                                        {result.currency}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-primary/20 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <InfoRow label="Reference" value={result.reference} />
                                                {result.status && <InfoRow label="Status" value={result.status} />}
                                                {result.statusText && <InfoRow label="Status Text" value={result.statusText} />}
                                                <InfoRow label="Transaction Date" value={result.txnDate} />
                                                {result.payerName && <InfoRow label="Payer" value={result.payerName} />}
                                                {result.payerPhone && <InfoRow label="Payer Phone" value={result.payerPhone} />}
                                                {result.payerAccount && <InfoRow label="Payer Account" value={result.payerAccount} />}
                                                {result.receiverName && <InfoRow label="Receiver" value={result.receiverName} />}
                                                {result.receiverAccount && <InfoRow label="Receiver Account" value={result.receiverAccount} />}
                                                {typeof result.totalAmount === "number" && (
                                                    <InfoRow label="Total Amount" value={String(result.totalAmount)} />
                                                )}
                                                {typeof result.serviceFee === "number" && (
                                                    <InfoRow label="Service Fee" value={String(result.serviceFee)} />
                                                )}
                                                {typeof result.serviceFeeVAT === "number" && (
                                                    <InfoRow label="Service Fee VAT" value={String(result.serviceFeeVAT)} />
                                                )}
                                                {result.reason && <InfoRow label="Reason" value={result.reason} />}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between rounded-lg bg-muted/40 border border-border/50 p-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            <span className="text-sm text-foreground font-mono">{value}</span>
        </div>
    );
}