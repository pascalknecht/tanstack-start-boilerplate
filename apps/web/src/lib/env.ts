export function getAppRootDomain() {
  return process.env.APP_ROOT_DOMAIN || 'localhost'
}

export function getAppUrl() {
  return new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000')
}
