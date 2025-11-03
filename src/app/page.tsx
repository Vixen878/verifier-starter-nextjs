import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

import { VerifierClient } from "@creofam/verifier";
import PricingPage from "@/components/pricingPage/pricing-main";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  const client = new VerifierClient({
    apiKey: process.env.VERIFIER_API_KEY,
    timeoutMs: 15000
  });

  const telebirrTx = await client.verifyTelebirr({ reference: "CJU5RZ5NM3" });
  if (telebirrTx.ok) {
    console.log(telebirrTx.data.status, telebirrTx.data.amount);
  } else {
    console.log(telebirrTx.error);
  }

  return (
    <HydrateClient>
      <PricingPage />
    </HydrateClient>
  );
}
