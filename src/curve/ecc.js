import { Jacobi } from "../point/jacobi.js";
import { split } from "../multiply/split.js";
import { secp256r1, secp384r1, secp521r1 } from "./curve.js";
import { batchInverse, memoized } from "../helper/mod.ts";
import { precomputeWindow, wNAFUnsafe } from "../multiply/wnafunsafe.js";
import { u8_bi } from "../verify/helper.js";
import { verify, verifyAsync } from "../verify/verify.js";

function ecc(Pclass, curve) {
   class ECC extends Pclass {
      static CURVE = curve;
      static BASE = new ECC(curve.g.x, curve.g.y);
      static ZERO = new ECC(0n, 1n, 0n);
      static from(p) {
         const { x, y } = p;
         return new ECC(x, y)
      }

      static sha = async(message)=> u8_bi(new Uint8Array(await crypto.subtle.digest(curve.sha, message)))
   
      constructor(x, y, z) {
         super(x, y, z)
         //this.oddTableIso()
      }

      async multiply(scalar) {
         return await split(this, scalar); // `split` should be async
      }

      async verifyAsync(message, signature, publicKey){
         return await verifyAsync(message, signature, publicKey, ECC)
      }

      verify(message, signature, publicKey){
         return verify(message, signature, publicKey, ECC)
      }
   }

   percomputeW(ECC.BASE)
   ECC.BASE.multiply = function (k) {
      return wNAFUnsafe(12, percomputeW(ECC.BASE), k, ECC.ZERO)
   }

   return ECC;
}

var percomputeW = memoized((P, w = 12) => {
   const table = precomputeWindow(P, w);
   const zs_i = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
   return table.map((p, i) => p.normalize(zs_i[i]))
})

const ECC256 = ecc(Jacobi, secp256r1);
const ECC384 = ecc(Jacobi, secp384r1);
const ECC521 = ecc(Jacobi, secp521r1);

export { ECC256, ECC384, ECC521, ecc }

