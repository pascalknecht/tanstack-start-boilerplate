import {
  HeadContent,
  Scripts,
  createRootRoute,
  notFound,
  useRouteContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '#/components/Footer'
import Header from '#/components/Header'
import { NotFound } from '#/components/NotFound'
import { TenantShell } from '#/components/tenant/TenantShell'
import { loadSite, rememberSite } from '#/lib/tenancy/site-fns'
import type { Site } from '#/lib/tenancy/site'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => {
    const site = await loadSite()
    if (site.kind === 'not-found') throw notFound()
    return { site }
  },
  head: ({ match }) => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title:
          match.context.site?.kind === 'tenant'
            ? match.context.site.tenant.name
            : 'Notilearn',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // Undefined when the root beforeLoad threw (unknown host).
  const site: Site | undefined = useRouteContext({
    from: '__root__',
    select: (context) => context.site,
  })
  if (site) rememberSite(site)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-slate-200">
        {site?.kind === 'root' ? (
          <>
            <Header />
            {children}
            <Footer />
          </>
        ) : site?.kind === 'tenant' ? (
          <TenantShell tenant={site.tenant}>{children}</TenantShell>
        ) : (
          children
        )}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
