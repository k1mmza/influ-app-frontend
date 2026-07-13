"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReadableModeProvider } from "@/components/readable-mode";
import { useUserStore } from "@/store/useUserStore";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReadableModeProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ReadableModeProvider>
    </ThemeProvider>
  );
}
