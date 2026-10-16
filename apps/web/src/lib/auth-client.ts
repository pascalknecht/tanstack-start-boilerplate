import { createAuthClient } from 'better-auth/react'

// No baseURL: requests go to the current origin, so every tenant host talks to
// its own auth endpoints and gets its own host-only cookies.
export const authClient = createAuthClient()
