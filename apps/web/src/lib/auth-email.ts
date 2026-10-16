export type AuthEmail = {
  kind: 'reset-password'
  to: string
  url: string
  token: string
  tenantId: string
}

type AuthEmailHandler = (email: AuthEmail) => Promise<void> | void

const logToConsole: AuthEmailHandler = (email) => {
  console.info(`[auth-email] ${email.kind} for ${email.to}: ${email.url}`)
}

let handler: AuthEmailHandler = logToConsole

// No email provider yet: emails are logged. Tests swap in a capturing handler.
export function setAuthEmailHandler(next: AuthEmailHandler | null) {
  handler = next ?? logToConsole
}

export async function sendAuthEmail(email: AuthEmail) {
  await handler(email)
}
