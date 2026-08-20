import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";

import { createTRPCClient, trpc } from "@/lib/trpc";

export function AtlasApiProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 20_000 } } }));
  const [trpcClient] = useState(() => createTRPCClient());
  return <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></trpc.Provider>;
}
