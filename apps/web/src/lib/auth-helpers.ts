import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'
import { getCurrentTenant } from './tenancy/context'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  if (!getCurrentTenant()) return null
  const headers = getRequestHeaders()
  return auth.api.getSession({ headers })
})
