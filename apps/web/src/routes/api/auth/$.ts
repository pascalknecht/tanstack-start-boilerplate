import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { getCurrentTenant } from '#/lib/tenancy/context'

function handle({ request }: { request: Request }) {
  if (!getCurrentTenant()) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
})
