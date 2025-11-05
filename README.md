# Verifier Starter Demo Project (Next.js + T3)

Demo starter for the NPM package `@creofam/verifier`, a TypeScript SDK for payment receipt verification, built on top of the open-source Verifier API: https://github.com/Vixen878/verifier-api

NPM: https://www.npmjs.com/package/@creofam/verifier

## Overview

This starter shows how to integrate provider-side receipt verification in a modern Next.js app with strict type safety. Users select a package, enter a provider reference number, and the server verifies it against the Verifier API SDK, then credits tokens atomically on success.

Supported providers:
- Telebirr
- Commercial Bank of Ethiopia (CBE)
- Bank of Abyssinia

## What’s Included

- Next.js 15 (App Router) + Tailwind CSS v4
- tRPC v11 with end-to-end types 
- Prisma ORM (MySQL) with `User`, `Receipt`, and `UserConfig` models
- NextAuth with a Prisma adapter
- `@creofam/verifier` SDK integration
- Developer-friendly logs in `purchase.verifyAndCredit` for tracing verification flows
- Safe verification rules:
  - Duplicate receipt guard
  - Package price amount check
  - Telebirr masked account matching (prefix/suffix)
  - CBE & Abyssinia suffix-based verification with amount match (name mismatches tolerated)
  - Atomic crediting of tokens with receipt persistence

## What You Can Expect

- A working reference implementation that verifies receipts and credits tokens.
- Strong TypeScript typing and zod validation at the API boundary.
- Realistic provider handling: masking, suffix lookups, and operational logs.
- A clean foundation to build your own product around payment verification.

This is a demo; it’s not a complete product. You should harden error handling, and observability.

## Requirements

- Node.js 18+
- PNPM
- MySQL database (set via `DATABASE_URL`)
- OAuth app credentials for NextAuth

## Setup

1) Clone this repository
```bash
git clone https://github.com/Vixen878/verifier-starter-nextjs.git
```

2) Install dependencies
```bash
pnpm install
```

3) Configure environment variables (see “Environment” below) and create the schema
```bash
pnpm db:push
```

4) Start the dev server
```bash
pnpm dev
```

Optional: open Prisma Studio to inspect data
```bash
pnpm db:studio
```

## Environment

Server-side (required unless noted):
- `AUTH_SECRET` — required in production, optional in development
- `AUTH_DISCORD_ID` — Discord OAuth client ID
- `AUTH_DISCORD_SECRET` — Discord OAuth client secret
- `DATABASE_URL` — MySQL connection string
- `VERIFIER_API_KEY` — API key for `@creofam/verifier` SDK
- `PLATFORM_OWNER_FULLNAME` — fallback name for Telebirr receiver validation
- `CBE_ACCOUNT_SUFFIX` — 8-digit suffix used by CBE verification
- `ABYSSINIA_ACCOUNT_SUFFIX` — 5-digit suffix used by Abyssinia verification

Client-side (validated at build; used as UI fallbacks):
- `NEXT_PUBLIC_TELEBIRR_NUMBER` — Telebirr number (digits, e.g., `2519xxxxxxxx`)
- `NEXT_PUBLIC_CBE_ACCOUNT_NUMBER` — CBE account number (e.g., 13 digits)
- `NEXT_PUBLIC_ABYSSINIA_ACCOUNT_NUMBER` — Abyssinia account number

Notes:
- Environment values act as fallbacks. When present, database `UserConfig` overrides them.
- To bypass build-time env validation temporarily, set `SKIP_ENV_VALIDATION=1` (not recommended long-term).

## Where Things Live

- Verification mutation: `src/server/api/routers/purchase.ts` (`verifyAndCredit`)
- Public verification router (raw lookups): `src/server/api/routers/verify.ts`

## How Verification Works

High-level flow in `purchase.verifyAndCredit`:
- Prevent duplicates: refuse previously used `(provider, reference)` pairs.
- Resolve configuration in order: `input.config → user’s DB config → environment`.
- Verify via SDK:
  - Telebirr: `verifyTelebirr({ reference })`
  - CBE: `verifyCBE({ reference, accountSuffix })`
  - Abyssinia: `verifyAbyssinia({ reference, suffix })`
- Validate amount equals the selected package price.
- Destination validation:
  - Telebirr: enforce normalized receiver name equals expected owner; masked receiver account must match user’s configured number (prefix/suffix).
  - CBE & Abyssinia: rely on suffix + amount.
- On success: atomically write `Receipt` and increment user `tokens`.

## Pricing and Tokens

The demo uses three packages (as of now):
- 50 ETB → 50 tokens
- 200 ETB → 200 tokens
- 500 ETB → 500 tokens

These are configured in the server (`PACKAGES`) and used to validate receipts and grant tokens.

## Configuring Payment Accounts

The demo persists per-user payment configuration in the `UserConfig` table:
- `platformOwnerFullName`
- `telebirrNumber`
- `cbeAccountNumber`, `cbeAccountSuffix`
- `abyssiniaAccountNumber`, `abyssiniaAccountSuffix`

## Logging & Debugging

Verification emits structured console logs for tracing:
- Start, amount checks, name checks
- Provider requests and parsed responses
- Masked account matching (with a `matches` flag)
- Transaction commit and success
- Duplicate/race conditions (`P2002`) and reasoned failures

Run the app and inspect the terminal output during purchases to understand where a verification fails.

## Extending

- Add new providers in `@creofam/verifier` and implement a branch in `purchase.ts`.
- Replace Discord auth or add more NextAuth providers.
- Add rate limits and audit trails if you expect high volume.

## Acknowledgements

- Verifier API (server): https://github.com/Vixen878/verifier-api
- SDK (client): https://www.npmjs.com/package/@creofam/verifier
- T3 Stack: Next.js, tRPC, Prisma, NextAuth

## License

This starter is provided as a demo reference. Review and adapt the verification policy, authentication, and data model for your own production needs.
