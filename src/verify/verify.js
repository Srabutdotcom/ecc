import { mod } from "../point/modular.js";
import { splitPublicKey, splitSignature, u8_bi } from "./helper.js";

// 1. Check r and s between 0 to n;
// 2. Hash message to integer e
// 3. w = s⁻¹ mod n
// 4. u1 = z * w mod n, u2 = r * w mod n
// 5. Compute point P = u1 * G + u2 * Q
function verify(message, signature, publicKey, point) {

   const { n, hash } = point.CURVE;

   const { r, w, u2 } = splitSignature(signature, n);
   const e = u8_bi(hash(message));
   const u1 = mod(e * w, n)

   const pk = splitPublicKey(publicKey, point);
   const u2_Q = pk.multiply(u2);//signwnaf(pk, u2);
   const u1_G = point.BASE.multiplyBase(u1)//signwnaf(point.BASE, u1);
   const P = u1_G.add(u2_Q).normalize();

   // 6. If point at infinity, return false
   if (!P) throw new Error(`point at infinity`);

   // 7. Compare x mod n with r
   return mod(P.x, n) == r
}


async function verifyAsync(message, signature, publicKey, point) {

   const { n, hash } = point.CURVE;

   const P1 /* pk */ = new Promise(r => r(splitPublicKey(publicKey, point)));
   const P2 /* { r, s, w, u2 } */ = new Promise(r => r(splitSignature(signature, n)));
   //const P3 = point.sha(message);

   const [pk, { r, w, u2 }/* , e */] = await Promise.all([P1, P2/* , P3 */])

   const Prom2 = pk.multiplyAsync(u2)//promising(pk.multiply(u2))//signwnafAsync(pk, u2)//split(pk, u2);//promising(pk, u2)//

   /* const u1 = mod(e * w, n)
   const Prom1 = point.BASE.multiply(u1) */
   const Prom1 = new Promise(r => {
      const e = u8_bi(hash(message));
      const u1 = mod(e * w, n)
      r(point.BASE.multiplyBase(u1))
   })

   const [Q2, Q1] = await Promise.all([Prom2, Prom1])
   const P = Q2.add(Q1).normalize();

   // 6. If point at infinity, return false
   if (!P) throw new Error(`point at infinity`);

   // 7. Compare x mod n with r
   return mod(P.x, n) == r

}

function promising(prom){
   return new Promise(r=>r(prom))
}

export { verify, verifyAsync }