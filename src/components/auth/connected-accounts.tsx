"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ConnectedAccounts() {
    const { status } = useSession();
    const isAuthed = status === "authenticated";

    return (
        <div className="flex flex-col gap-3">
            {!isAuthed ? (
                <p className="text-sm text-muted-foreground">
                    Sign in first, then connect your providers.
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Connect additional sign-in providers to your account.
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    disabled={!isAuthed}
                >
                    Connect Google
                </Button>
                <Button
                    onClick={() => signIn("discord", { callbackUrl: "/" })}
                    disabled={!isAuthed}
                >
                    Connect Discord
                </Button>
            </div>
        </div>
    );
}