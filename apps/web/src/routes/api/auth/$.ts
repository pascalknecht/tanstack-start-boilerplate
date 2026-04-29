import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { authDbReady } from "@/lib/auth-db";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        await authDbReady;
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        await authDbReady;
        return auth.handler(request);
      },
    },
  },
});
