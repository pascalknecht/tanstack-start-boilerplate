import { describe, expect, it } from 'vitest'
import {
  isReservedSlug,
  isValidSlug,
  normalizeHostname,
  resolveHost,
} from './resolve-host'

describe('resolveHost', () => {
  describe('with a production root domain', () => {
    const root = 'notilearn.com'

    it('resolves the apex and www to the root site', () => {
      expect(resolveHost('notilearn.com', root)).toEqual({ kind: 'root' })
      expect(resolveHost('www.notilearn.com', root)).toEqual({ kind: 'root' })
    })

    it('resolves a single-level subdomain to a tenant slug', () => {
      expect(resolveHost('acme.notilearn.com', root)).toEqual({
        kind: 'tenant',
        slug: 'acme',
      })
      expect(resolveHost('acme-academy-2.notilearn.com', root)).toEqual({
        kind: 'tenant',
        slug: 'acme-academy-2',
      })
    })

    it('ignores ports, case, surrounding whitespace and a trailing dot', () => {
      expect(resolveHost('ACME.Notilearn.com:443', root)).toEqual({
        kind: 'tenant',
        slug: 'acme',
      })
      expect(resolveHost(' notilearn.com. ', root)).toEqual({ kind: 'root' })
      expect(resolveHost('acme.notilearn.com.:8443', root)).toEqual({
        kind: 'tenant',
        slug: 'acme',
      })
      expect(resolveHost('acme.notilearn.com.', root)).toEqual({
        kind: 'tenant',
        slug: 'acme',
      })
    })

    it('normalizes the configured root domain too', () => {
      expect(resolveHost('acme.notilearn.com', 'Notilearn.com:3000')).toEqual({
        kind: 'tenant',
        slug: 'acme',
      })
    })

    it('rejects reserved slugs', () => {
      for (const slug of ['api', 'app', 'admin', 'auth', 'static', 'notion']) {
        expect(resolveHost(`${slug}.notilearn.com`, root)).toEqual({
          kind: 'invalid',
        })
      }
    })

    it('rejects nested subdomains, including www on a tenant', () => {
      expect(resolveHost('a.b.notilearn.com', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('www.acme.notilearn.com', root)).toEqual({
        kind: 'invalid',
      })
    })

    it('rejects malformed slugs', () => {
      expect(resolveHost('-acme.notilearn.com', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('acme-.notilearn.com', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('ac_me.notilearn.com', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('xn--80ak6aa92e.notilearn.com', root)).toEqual({
        kind: 'invalid',
      })
      expect(resolveHost(`${'a'.repeat(64)}.notilearn.com`, root)).toEqual({
        kind: 'invalid',
      })
    })

    it('does not treat look-alike domains as subdomains', () => {
      expect(resolveHost('evilnotilearn.com', root)).toEqual({
        kind: 'custom',
        hostname: 'evilnotilearn.com',
      })
      expect(resolveHost('notilearn.com.evil.io', root)).toEqual({
        kind: 'custom',
        hostname: 'notilearn.com.evil.io',
      })
    })

    it('resolves any other domain to a custom domain', () => {
      expect(resolveHost('learn.acme.io', root)).toEqual({
        kind: 'custom',
        hostname: 'learn.acme.io',
      })
      expect(resolveHost('Academy.Example.co.uk:443', root)).toEqual({
        kind: 'custom',
        hostname: 'academy.example.co.uk',
      })
    })

    it('rejects IP addresses, bare labels and localhost hosts', () => {
      expect(resolveHost('127.0.0.1', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('10.0.0.12:3000', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('[::1]:3000', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('intranet', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('localhost', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('acme.localhost', root)).toEqual({ kind: 'invalid' })
    })

    it('rejects empty and malformed host headers', () => {
      expect(resolveHost(undefined, root)).toEqual({ kind: 'invalid' })
      expect(resolveHost(null, root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('   ', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('acme.notilearn.com:abc', root)).toEqual({
        kind: 'invalid',
      })
      expect(resolveHost('acme.notilearn.com:3000:1', root)).toEqual({
        kind: 'invalid',
      })
      expect(resolveHost('acme..notilearn.com', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('acme.notilearn.com/path', root)).toEqual({
        kind: 'invalid',
      })
      expect(resolveHost('user@acme.notilearn.com', root)).toEqual({
        kind: 'invalid',
      })
    })

    it('rejects an invalid root domain configuration', () => {
      expect(resolveHost('acme.notilearn.com', '')).toEqual({ kind: 'invalid' })
    })
  })

  describe('with localhost as root domain (development)', () => {
    const root = 'localhost'

    it('resolves localhost with any port to the root site', () => {
      expect(resolveHost('localhost', root)).toEqual({ kind: 'root' })
      expect(resolveHost('localhost:3000', root)).toEqual({ kind: 'root' })
      expect(resolveHost('www.localhost:3000', root)).toEqual({ kind: 'root' })
    })

    it('resolves *.localhost to tenants', () => {
      expect(resolveHost('acme.localhost:3000', root)).toEqual({
        kind: 'tenant',
        slug: 'acme',
      })
      expect(resolveHost('beta.localhost', root)).toEqual({
        kind: 'tenant',
        slug: 'beta',
      })
    })

    it('still rejects reserved and nested *.localhost hosts', () => {
      expect(resolveHost('api.localhost:3000', root)).toEqual({ kind: 'invalid' })
      expect(resolveHost('a.b.localhost:3000', root)).toEqual({ kind: 'invalid' })
    })

    it('rejects loopback IPs so they cannot bypass host resolution', () => {
      expect(resolveHost('127.0.0.1:3000', root)).toEqual({ kind: 'invalid' })
    })

    it('treats real domains as custom domains', () => {
      expect(resolveHost('learn.acme.test:3000', root)).toEqual({
        kind: 'custom',
        hostname: 'learn.acme.test',
      })
    })
  })
})

describe('slug helpers', () => {
  it('validates slugs', () => {
    expect(isValidSlug('acme')).toBe(true)
    expect(isValidSlug('a')).toBe(true)
    expect(isValidSlug('acme-2')).toBe(true)
    expect(isValidSlug('Acme')).toBe(false)
    expect(isValidSlug('acme.io')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })

  it('knows reserved slugs', () => {
    expect(isReservedSlug('www')).toBe(true)
    expect(isReservedSlug('acme')).toBe(false)
  })
})

describe('normalizeHostname', () => {
  it('strips the port and lowercases', () => {
    expect(normalizeHostname('Acme.Localhost:3000')).toBe('acme.localhost')
  })

  it('returns null for IPv6 literals', () => {
    expect(normalizeHostname('[::1]')).toBeNull()
  })
})
