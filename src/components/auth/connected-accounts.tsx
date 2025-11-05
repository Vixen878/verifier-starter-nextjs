"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

export default function ConnectedAccounts() {
    const { status } = useSession();
    const isAuthed = status === "authenticated";

    const utils = api.useUtils();
    const unlink = api.user.unlinkProvider.useMutation({
        onSuccess: () => utils.user.getLinkedAccounts.invalidate(),
    });

    const { data: linkedProvidersRaw } = api.user.getLinkedAccounts.useQuery(undefined, {
        enabled: isAuthed,
    });
    const providers: readonly string[] = Array.isArray(linkedProvidersRaw)
        ? linkedProvidersRaw.filter((p): p is string => typeof p === "string")
        : [];
    const isGoogleLinked = providers.includes("google");
    const isDiscordLinked = providers.includes("discord");

    return (
        <section className="rounded-lg border p-4">
            <h2 className="text-sm font-medium">Linked Accounts</h2>
            <p className="mt-1 text-xs text-muted-foreground">
                {isAuthed
                    ? "Connect additional sign-in providers to your account."
                    : "Sign in first, then connect providers to link to your account."}
            </p>
            <div className="mt-3 flex flex-col gap-2">
                <div className="space-x-2">
                    <Button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        disabled={!isAuthed || isGoogleLinked}
                        variant={isGoogleLinked ? "outline" : "default"}
                    >
                        {isGoogleLinked ? "Google Connected" : "Connect Google"}
                    </Button>
                    {isGoogleLinked && (
                        <Button
                            onClick={() => unlink.mutate("google")}
                            disabled={!isAuthed || unlink.isPending}
                            variant="ghost"
                        >
                            Disconnect Google
                        </Button>
                    )}
                </div>
                <div className="space-x-2">
                    <Button
                        onClick={() => signIn("discord", { callbackUrl: "/" })}
                        disabled={!isAuthed || isDiscordLinked}
                        variant={isDiscordLinked ? "outline" : "default"}
                    >
                        {isDiscordLinked ? "Discord Connected" : "Connect Discord"}
                    </Button>
                    {isDiscordLinked && (
                        <Button
                            onClick={() => unlink.mutate("discord")}
                            disabled={!isAuthed || unlink.isPending}
                            variant="ghost"
                        >
                            Disconnect Discord
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}