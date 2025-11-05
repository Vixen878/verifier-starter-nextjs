import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function AccountLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin?callbackUrl=/account/linked-accounts");
    }

    return <>{children}</>;
}