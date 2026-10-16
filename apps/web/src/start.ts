import { createStart } from '@tanstack/react-start'
import { siteMiddleware } from '#/lib/tenancy/middleware'

export const startInstance = createStart(() => ({
  requestMiddleware: [siteMiddleware],
}))
