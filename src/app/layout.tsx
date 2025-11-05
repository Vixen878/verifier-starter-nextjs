import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Verifier SDK Starter",
  description: "A starter project for the Verifier SDK",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="pb-16">
        <SessionProvider>
          <TRPCReactProvider>
            <Header />
            {children}
            <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-muted/85">
              <div className="container mx-auto px-4 py-6">
                <p className="text-center text-xs text-muted-foreground">
                  Made with ❤️ by{" "}
                  <a
                    href="https://leulzenebe.pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary hover:text-primary"
                  >
                    Leul Zenebe
                  </a>{" "}
                  •{" "}
                  <a
                    href="https://github.com/Vixen878/verifier-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary hover:text-primary"
                  >
                    GitHub
                  </a>{" "}
                  •{" "}
                  <a
                    href="https://www.npmjs.com/package/@creofam/verifier"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary hover:text-primary"
                  >
                    NPM
                  </a>
                </p>
              </div>
            </footer>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
