import { memoized, signwnaf, signwnafAsync } from "../mod.ts";
import { precomputeWindow, wNAFUnsafe } from "../multiply/wnafunsafe.js";
import { edwardPointOperation } from "../point/edward.js";
import { verifyEdward } from "../verify/edward.js";

function ed(pointOps = edwardPointOperation, curve) {
   const { mod } = curve;
   const Wbase = 8;

   const {
      pointAdd,
      pointDouble,
      doubleN,
      alignMemo
   } = pointOps(curve)

   class ED {
      static CURVE = curve;
      static BASE = new ED(curve.g.x, curve.g.y, 1n, mod(curve.g.x * curve.g.y), { precompute: true, w: Wbase });
      static ZERO = new ED(0n, 1n, 1n, 0n);
      static from(p) {
         const { x, y, precompute, w } = p;
         return new ED(x, y, 1n, mod(x * y), { precompute, w })
      }
      static sha = async (message) => new Uint8Array(await crypto.subtle.digest(curve.sha, message))

      static async verifyAsync(message, signature, publicKey) {
         return await verifyEdward(message, signature, publicKey, ED)
      }

      constructor(x, y, z = 1n, t = 1n, { precompute = false, w } = {}) {
         this.x = x;
         this.y = y;
         this.z = z;
         this.t = t
         if (precompute) {
            if (x == curve.g.x && y == curve.g.y && z == 1n) {
               this.w = w ?? Wbase
               percomputeW(this, this.w);
            }
         }
         this.identity = this.x == 0n && this.t == 0n;
      }

      multiply(scalar) {
         return signwnaf(this, scalar);
      }

      multiplyAsync(scalar) {
         return signwnafAsync(this, scalar)
      }

      multiplyBase(scalar) {
         return wNAFUnsafe(this.w, percomputeW(this, this.w), scalar, this.constructor.ZERO)
      }

      add(P, isNext0 = false) { return pointAdd(this, P, isNext0) /* return addTwistedEdwards(this, P) */ }//
      double(isNext0 = false) { return pointDouble(this, isNext0) /* return doubleTwistedEdwards(this, isNext0) */ }
      doubleN(n) { return doubleN(this, n) }
      normalize(iz) { return alignMemo(this, iz) }
      negate() {
         if (this.identity) return this
         if (this.neg) return this.neg;
         this.neg = new ED(-this.x, this.y, this.z, -this.t)
         return this.neg;
      }
      toString() {
         if (this.identity) return `${this.constructor.name}(∞)`;
         return `${this.constructor.name} (${toStr(this.x)}..., ${toStr(this.y)}..., ${toStr(this.z)}... , ${toStr(this.t)}...)`;
      }
      equals(other) {
         if (this.identity && other.identity) return true;
         if (this.identity || other.identity) return false;
         return this.x == other.x && this.y == other.y && this.z == other.z && this.t == other.t
      }

   }

   return ED;
}

var percomputeW = memoized((P, w = 8) => {
   return precomputeWindow(P, w);
})

let ED25519, ED448;

export async function initED(pointOps = edwardPointOperation) {
   if (!ED25519) {
      const { Ed25519, Ed448 } = await import("./mod.ts");
      ED25519 = ed(pointOps, Ed25519);
      ED448 = ed(pointOps, Ed448);
      ED448.sha = ED448.CURVE.hash
   }
   return { ED25519, ED448 };
}
