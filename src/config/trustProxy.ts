/**
 * Express `trust proxy` setting from the TRUST_PROXY env var.
 *
 * - unset / empty / "false": false. X-Forwarded-For is ignored and req.ip is the socket address,
 *   so a client cannot pick its own rate-limit key by sending a fake header.
 * - a whole number (e.g. "1"): trust that many reverse-proxy hops in front of the API.
 * - a comma-separated list of IPs / CIDRs (or Express names such as "loopback"):
 *   trust X-Forwarded-For only when the request comes from one of them.
 *
 * "true" (trust every hop) is refused: it lets any client spoof its IP.
 */
export type TrustProxySetting = false | number | string[];

export const parseTrustProxy = (raw: string | undefined): TrustProxySetting => {
  const value = (raw ?? '').trim();
  if (value === '' || value.toLowerCase() === 'false') return false;

  if (/^\d+$/.test(value)) {
    const hops = Number(value);
    return hops === 0 ? false : hops;
  }

  if (value.toLowerCase() === 'true') {
    throw new Error('TRUST_PROXY=true trusts any client-supplied X-Forwarded-For. Use a hop count or a proxy IP/CIDR list.');
  }

  const entries = value.split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (entries.length === 0) return false;
  return entries;
};
