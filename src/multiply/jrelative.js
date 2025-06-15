//@ts-self-types="../../type/multiply/jrelative.d.ts"
import { batchInverse } from "../helper/batchinverse.js";
import { alignMemo, doubleAddRelative, doubleRelative } from "../point/jacobirelative.js";
import { computeWNAF } from "../scalar/decompose.js";
import { oddTable } from "../table/table.js";

function multiplyJRelative(P, scalar, { w = 4, normalize = false } = {}) {
   // Step 1: Precompute odd multiples of P (R[1], R[3], ..., R[2^(w-1)-1])
   const R = oddTable(P, w, normalize)//.map(p => alignMemo(p))
   // Step 2: Decompose scalar using wNAF
   const k = computeWNAF(scalar, w);

   const zs_i = batchInverse(R.map(e=>e.z), P.constructor.CURVE.p);

   return multiplyCore(k, R.map((p,i)=>alignMemo(p,zs_i[i])))
}

async function multiplyJRelativeAsync(P, scalar, { w = 4, normalize = false } = {}) {
   // Step 1: Precompute odd multiples of P (R[1], R[3], ..., R[2^(w-1)-1])
   const p2 = new Promise(r => {
      const R = oddTable(P, w, normalize)//.map(p => alignMemo(p))
      const zs_i = batchInverse(R.map(e=>e.z), P.constructor.CURVE.p);
      r(R.map((p,i)=>alignMemo(p,zs_i[i])))
   })
   // Step 2: Decompose scalar using wNAF
   const p1 = new Promise(r => r(computeWNAF(scalar, w)));

   const [k, R] = await Promise.all([p1, p2])

   return multiplyCore(k, R)
}

function multiplyCore(k, R) {
   // Step 4: Initialize P1 = R[k[n]] with Z = 1 (relative coordinate)
   let ki = k[k.length - 1];
   if (ki === 0) throw new Error("MSB of wNAF must not be zero");

   let P1 = ki > 0 ? R[ki] : R[-ki].negate()

   // Step 5–11: Loop through remaining bits
   for (let i = k.length - 2; i >= 0; i--) {
      const ki = k[i];

      const isLastDouble = (i === k.length - 1);

      if (ki !== 0) {
         // Algorithm 2: P1 = 2P1 + R[ki]
         P1 = doubleAddRelative(ki > 0 ? R[ki] : R[-ki].negate(), P1);
      } else {
         // Algorithm 3: P1 = 2P1
         P1 = doubleRelative(P1, isLastDouble);
      }
   }
   return P1;
}

export { multiplyJRelative, multiplyJRelativeAsync }