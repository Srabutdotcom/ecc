/**  
 * {@link https://www.rfc-editor.org/rfc/rfc8032}
Given:

A: public key (32-byte compressed Edwards point)

M: message (any length)

σ: signature (64 bytes = R (32) || S (32))

You want to verify:

Does S·B == R + k·A?

Where:

B: base point of the curve

k = SHA512(R || A || M) mod L

L: group order of Ed25519 = 2^252 + ... (a 253-bit prime)


1. Split signature σ into:
   R = σ[0..31]  // encoded point
   S = σ[32..63] // scalar mod L

2. Check that S < L
   → reject if not

3. Decode R and A into curve points
   → reject if invalid

4. Compute:
   k = SHA512(R || A || M) mod L

5. Verify:
   [S]B = R + [k]A
   If true → signature valid 
*/

import { mod } from "../mod.ts";
import { encoder, u8le_bi, unity } from "./helper.js";

async function verifyEdward(message, signature, publicKey, point) {
   //const t = performance.now()
   const L = point.CURVE.L;
   const len = publicKey.length
   const R_bytes = signature.subarray(0, len)
   //4. Compute:    k = SHA512(R || A || M) mod L
   const k = hashDomainToScalar(point, R_bytes, publicKey, message)

   //3. Decode R and A into curve points
   const A = fromHex(publicKey, point)//new Promise(r => r(fromHex(publicKey, point)))//
   const R = fromHex(R_bytes, point)//new Promise(r => r(fromHex(R_bytes, point)))//

   //5. Verify:    [S]B = R + [k]A
   
   const kA_promise = A.multiplyAsync(k);

   const SB_promise = new Promise(r => {
      //1. Split signature σ into:
      const s = u8le_bi(signature.subarray(len, len * 2));
      //2. Check that S < L
      if (s >= L) throw RangeError(`Invalid signature`)
      r(point.BASE.multiplyBase(s))//! SB
   })

   const [kA, SB] = await Promise.all([kA_promise, SB_promise])
   const O = SB.add(R.add(kA).negate())
   return O.x === 0n && O.y == O.z;
}

function hashDomainToScalar(point, ...messages) {
   // Concatenate R || A || M
   let domain = ''
   if (point.CURVE.name == 'ed448') {
      domain = unity(
         dom4(),
         ...messages
      )
   } else if (point.CURVE.name == 'ed25519') {
      // dom4 become irrelevant
      domain = unity(...messages)
   }
   // Hash using SHA-512
   const hash = point.CURVE.hash(domain)//new Uint8Array(await crypto.subtle.digest('SHA-512', input));
   // Convert to BigInt (little-endian)
   return mod(u8le_bi(hash), point.CURVE.L); // k
}

// √(-1) aka √(a) aka 2^((p-1)/4)
// Fp.sqrt(Fp.neg(1))
const ED25519_SQRT_M1 = 19681161376707505956807079304988542015446066515923890162744021073123829784752n;


// sqrt(u/v)
function uvRatio25519(u, v, P) {

   const v3 = mod(v * v * v, P); // v³
   const v7 = mod(v3 * v3 * v, P); // v⁷
   // (p+3)/8 and (p-5)/8
   const pow = ed25519_pow_2_252_3(u * v7, P).pow_p_5_8;
   let x = mod(u * v3 * pow, P); // (uv³)(uv⁷)^(p-5)/8
   const vx2 = mod(v * x * x, P); // vx²
   const root1 = x; // First root candidate
   const root2 = mod(x * ED25519_SQRT_M1, P); // Second root candidate
   const useRoot1 = vx2 === u; // If vx² = u (mod p), x is a square root
   const useRoot2 = vx2 === mod(-u, P); // If vx² = -u, set x <-- x * 2^((p-1)/4)
   const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P); // There is no valid root, vx² = -u√(-1)
   if (useRoot1) x = root1;
   if (useRoot2 || noRoot) x = root2; // We return root2 anyway, for const-time
   if (isNegativeLE(x, P)) x = mod(-x, P);
   return { isValid: useRoot1 || useRoot2, value: x };
}

function ed25519_pow_2_252_3(x, P) {
   // prettier-ignore
   //const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
   const x2 = (x * x) % P;
   const b2 = (x2 * x) % P; // x^3, 11
   const b4 = (pow2(b2, 2n, P) * b2) % P; // x^15, 1111
   const b5 = (pow2(b4, 1n, P) * x) % P; // x^31
   const b10 = (pow2(b5, 5n, P) * b5) % P;
   const b20 = (pow2(b10, 10n, P) * b10) % P;
   const b40 = (pow2(b20, 20n, P) * b20) % P;
   const b80 = (pow2(b40, 40n, P) * b40) % P;
   const b160 = (pow2(b80, 80n, P) * b80) % P;
   const b240 = (pow2(b160, 80n, P) * b80) % P;
   const b250 = (pow2(b240, 10n, P) * b10) % P;
   const pow_p_5_8 = (pow2(b250, 2n, P) * x) % P;
   // ^ To pow to (p+3)/8, multiply it by x.
   return { pow_p_5_8, b2 };
}

/** Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)` */
export function pow2(x, power, modulo) {
   let res = x;
   for (let i = 0n; i < power; i++) {
      res = (res * res) % modulo;
   }
   /* while (power-- > 0n) {
      res *= res;
      res %= modulo;
   } */
   return res;
}

var isNegativeLE = (num, modulo) =>
   (mod(num, modulo) & 1n) === 1n;


// Converts hash string or Uint8Array to Point.
// Uses algo from RFC8032 5.1.3.
function fromHex(hex, point, { zip215 = false, precompute = false, w = 8 } = {}) {
   const p = point.CURVE.p;
   const len = hex.length;
   const uvRatio = len == 32 ? uvRatio25519 : uvRatio448
   /*    
   const len = Fp.BYTES;
   hex = ensureBytes('pointHex', hex, len); // copy hex to a new array
   abool('zip215', zip215);
    */
   const normed = hex.slice(); // copy again, we'll manipulate it
   const lastByte = hex[len - 1]; // select last byte
   normed[len - 1] = lastByte & ~0x80; // clear last bit
   const y = u8le_bi(normed); // convert to BigInt

   // zip215=true is good for consensus-critical apps. =false follows RFC8032 / NIST186-5.
   // RFC8032 prohibits >= p, but ZIP215 doesn't
   // zip215=true:  0 <= y < MASK (2^256 for ed25519)
   // zip215=false: 0 <= y < P (2^255-19 for ed25519)
   //const max = zip215 ? MASK : p;
   //aInRange('pointHex.y', y, 0n, max);

   // Ed25519: x² = (y²-1)/(dy²+1) mod p. Ed448: x² = (y²-1)/(dy²-1) mod p. Generic case:
   // ax²+y²=1+dx²y² => y²-1=dx²y²-ax² => y²-1=x²(dy²-a) => x²=(y²-1)/(dy²-a)
   const y2 = mod(y * y, p); // denominator is always non-0 mod p.
   const u = mod(y2 - 1n, p); // u = y² - 1
   const v = mod(point.CURVE.d * y2 - point.CURVE.a, p); // v = d y² + 1.
   let { isValid, value: x } = uvRatio(u, v, p); // √(u/v)
   if (!isValid) throw new Error('Point.fromHex: invalid y coordinate');
   const isXOdd = (x & 1n) === 1n; // There are 2 square roots. Use x_0 bit to select proper
   const isLastByteOdd = (lastByte & 0x80) !== 0; // x_0, last bit
   if (!zip215 && x === 0n && isLastByteOdd)
      // if x=0 and x_0 = 1, fail
      throw new Error('Point.fromHex: x=0 and x_0=1');
   if (isLastByteOdd !== isXOdd) x = mod(-x, p); // if x_0 != x mod 2, set x = p-x
   return point.from({ x, y, precompute, w });
}

// Constant-time ratio of u to v. Allows to combine inversion and square root u/√v.
// Uses algo from RFC8032 5.1.3.
function uvRatio448(u, v, P) {
   // https://www.rfc-editor.org/rfc/rfc8032#section-5.2.3
   // To compute the square root of (u/v), the first step is to compute the
   //   candidate root x = (u/v)^((p+1)/4).  This can be done using the
   // following trick, to use a single modular powering for both the
   // inversion of v and the square root:
   // x = (u/v)^((p+1)/4)   = u³v(u⁵v³)^((p-3)/4)   (mod p)
   const u2v = mod(u * u * v, P); // u²v
   const u3v = mod(u2v * u, P); // u³v
   const u5v3 = mod(u3v * u2v * v, P); // u⁵v³
   const root = ed448_pow_Pminus3div4(u5v3, P);
   const x = mod(u3v * root, P);
   // Verify that root is exists
   const x2 = mod(x * x, P); // x²
   // If vx² = u, the recovered x-coordinate is x.  Otherwise, no
   // square root exists, and the decoding fails.
   return { isValid: mod(x2 * v, P) === u, value: x };
}

// powPminus3div4 calculates z = x^k mod p, where k = (p-3)/4.
// Used for efficient square root calculation.
// ((P-3)/4).toString(2) would produce bits [223x 1, 0, 222x 1]
function ed448_pow_Pminus3div4(x, P) {
   const b2 = (x * x * x) % P;
   const b3 = (b2 * b2 * x) % P;
   const b6 = (pow2(b3, 3n, P) * b3) % P;
   const b9 = (pow2(b6, 3n, P) * b3) % P;
   const b11 = (pow2(b9, 2n, P) * b2) % P;
   const b22 = (pow2(b11, 11n, P) * b11) % P;
   const b44 = (pow2(b22, 22n, P) * b22) % P;
   const b88 = (pow2(b44, 44n, P) * b44) % P;
   const b176 = (pow2(b88, 88n, P) * b88) % P;
   const b220 = (pow2(b176, 44n, P) * b44) % P;
   const b222 = (pow2(b220, 2n, P) * b2) % P;
   const b223 = (pow2(b222, 1n, P) * x) % P;
   return (pow2(b223, 223n, P) * b222) % P;
}

/**
 * 
 * @param {(0|1)} phflag - phflag = 0 for Ed448ctx, 1 for Ed448ph
 * @param {string} context - context SHOULD NOT be empty for Ed448ctx 
 * @returns 
 */
function dom4(phflag = 0, context = '') {
   const ctx = context ? encoder.encode(context) : new Uint8Array;
   const siged448 = Uint8Array.of(
      83, 105, 103, 69, 100, 52, 52, 56, //'SigEd448'
      phflag, ctx.length);
   if (!ctx.length) return siged448
   return unity(siged448, ctx)
}
/**
 * dom2 is irrelevant for Ed25519
 * @param {(0|1)} phflag - phflag = 0 for Ed25519ctx, 1 for Ed25519ph
 * @param {string} context - context SHOULD NOT be empty for Ed25519ctx 
 * @returns 
 */
function dom2(phflag = 0, context = '') {
   const ctx = context ? encoder.encode(context) : new Uint8Array;
   const siged25519 = Uint8Array.of(
      //'SigEd25519 no Ed25519 collisions'
      83, 105, 103, 69, 100, 50, 53, 53, 49, 57, 32, 110, 111, 32, 69, 100, 50, 53, 53, 49, 57, 32, 99, 111, 108, 108, 105, 115, 105, 111, 110, 115,
      phflag, ctx.length);
   if (!ctx.length) return siged25519
   return unity(siged25519, ctx)
}

export { verifyEdward }