import * as jose from 'jsr:@panva/jose@6'

console.log('main function started')

const JWT_SECRET = Deno.env.get('JWT_SECRET')
const VERIFY_JWT = Deno.env.get('VERIFY_JWT') === 'true'

function getAuthToken(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) throw new Error('Missing authorization header')
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer') throw new Error(`Auth header is not 'Bearer {token}'`)
  return token
}

async function isValidLegacyJWT(jwt: string): Promise<boolean> {
  if (!JWT_SECRET) return false
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);
  try { await jose.jwtVerify(jwt, secretKey); } catch { return false; }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'OPTIONS' && VERIFY_JWT) {
    try {
      const token = getAuthToken(req)
      if (!await isValidLegacyJWT(token)) {
        return new Response(JSON.stringify({ msg: 'Invalid JWT' }), {
          status: 401, headers: { 'Content-Type': 'application/json' } })
      }
    } catch (e) {
      return new Response(JSON.stringify({ msg: e.toString() }), {
        status: 401, headers: { 'Content-Type': 'application/json' } })
    }
  }
  const url = new URL(req.url)
  const service_name = url.pathname.split('/')[1]
  if (!service_name) {
    return new Response(JSON.stringify({ msg: 'missing function name' }), {
      status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const servicePath = `/home/deno/functions/${service_name}`
  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath, memoryLimitMb: 150, workerTimeoutMs: 60000,
      noModuleCache: false, importMapPath: null,
      envVars: Object.entries(Deno.env.toObject()),
    })
    return await worker.fetch(req)
  } catch (e) {
    return new Response(JSON.stringify({ msg: e.toString() }), {
      status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
