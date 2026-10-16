import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '#/lib/auth-helpers'
import { assertTenantSite } from '#/lib/tenancy/guards'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    assertTenantSite(context.site)
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    return { user: session.user }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return <Outlet />
}
