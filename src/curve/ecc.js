import { jacobiPointOperations } from "../point/jacobi.js";
import { batchInverse, memoized } from "../helper/mod.ts";
import { precomputeWindow, wNAFUnsafe } from "../multiply/wnafunsafe.js";
import { u8_bi } from "../verify/helper.js";
import { verify, verifyAsync } from "../verify/verify.js";
import { signwnaf, signwnafAsync } from "../multiply/wnaf.js";

function ecc(pointOpsFunction, curve) {

   const wBase = 10;

   const percomputeW = memoized((P, w = wBase) => {
      const table = precomputeWindow(P, w);
      const zs_i = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
      return table.map((p, i) => p.normalize(zs_i[i]))
   })

   const {
      addJ,
      doubleJ,
      triplingJ,
      doubleNJ,
      alignMemoJ
   } = pointOpsFunction(curve)

   class ECC {
      static CURVE = curve;
      static BASE = new ECC(curve.g.x, curve.g.y, 1n, { precompute: true });
      static ZERO = new ECC(0n, 1n, 0n);
      static from(p) {
         const { x, y } = p;
         return new ECC(x, y)
      }

      static sha = async (message) => u8_bi(new Uint8Array(await crypto.subtle.digest(curve.sha, message)))
      static async verifyAsync(message, signature, publicKey) {
         return await verifyAsync(message, signature, publicKey, ECC)
      }

      static verify(message, signature, publicKey) {
         return verify(message, signature, publicKey, ECC)
      }

      constructor(x, y, z = 1n, { precompute = false, w = wBase } = {}) {
         this.x = x;
         this.y = y;
         this.z = z;
         this.infinity = (z === 0n);
         if (precompute) {
            if (x == curve.g.x && y == curve.g.y) {
               percomputeW(this, w)
            } 
            this.w = w
         }
      }

      multiply(scalar) {
         return signwnaf(this, scalar); // `split` should be async
      }

      multiplyAsync(scalar) {
         return signwnafAsync(this, scalar)
      }

      multiplyBase(scalar) {
         return wNAFUnsafe(this.w, percomputeW(this), scalar, ECC.ZERO)
      }
      add(P) { return addJ(this, P) }
      double() { return doubleJ(this) }
      tripling() { return triplingJ(this) }
      doubleN(n) { return doubleNJ(this, n) }
      normalize(iz) { return alignMemoJ(this, iz) }
      toString() {
         if (this.infinity) return `${this.constructor.name}(∞)`;
         return `${this.constructor.name} (${toStr(this.x)}..., ${toStr(this.y)}..., ${toStr(this.z)}...)`;
      }
      equals(other) {
         if (this.infinity && other.infinity) return true;
         if (this.infinity || other.infinity) return false;
         return this.x == other.x && this.y == other.y && this.z == other.z
      }
      negate() {
         if (this.infinity) return this;
         if (this.neg) return this.neg
         this.neg = new this.constructor(this.x, -this.y, this.z);
         return this.neg
      }
   }

   return ECC;
}

let ECC256, ECC384, ECC521;

export async function initECC(pointOpsFunction = jacobiPointOperations) {
   if (!ECC256) {
      const { Secp256r1, Secp384r1, Secp521r1 } = await import("./mod.ts");
      ECC256 = ecc(pointOpsFunction, Secp256r1);
      ECC384 = ecc(pointOpsFunction, Secp384r1);
      ECC521 = ecc(pointOpsFunction, Secp521r1);
   }
   return { ECC256, ECC384, ECC521 };
}

function toStr(n, radix = 10, w = 12) {
   return n.toString(radix).slice(0, w)
}


