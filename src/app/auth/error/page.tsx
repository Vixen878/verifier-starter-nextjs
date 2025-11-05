import Link from "next/link";

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = (await searchParams) ?? {};
    const rawError = params.error;
    const error = Array.isArray(rawError) ? rawError[0] : rawError;
    const isAccountNotLinked = error === "OAuthAccountNotLinked";
    const title = isAccountNotLinked ? "Account Not Linked" : "Sign-in Error";

    return (
        <main className="container mx-auto px-4 py-12">
            <h1 className="text-xl font-semibold mb-2">{title}</h1>
            {isAccountNotLinked ? (
                <p className="text-sm text-muted-foreground">
                    This email already belongs to an existing account. First sign in to that
                    account, then link additional providers from your profile.
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Something went wrong during authentication. Try again or contact support.
                </p>
            )}
            <div className="mt-6 flex gap-4">
                <Link
                    href="/api/auth/signin"
                    className="underline decoration-primary hover:text-primary"
                >
                    Go to Sign In
                </Link>
                <Link
                    href="/"
                    className="underline decoration-muted hover:text-foreground"
                >
                    Back to Home
                </Link>
            </div>
        </main>
    );
}