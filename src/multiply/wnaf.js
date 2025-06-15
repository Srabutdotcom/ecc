//@ts-self-types="../../type/multiply/wnaf.d.ts"
import { batchInverse } from "../helper/batchinverse.js";
import { computeWNAF } from "../scalar/decompose.js";
import { oddTable } from "../table/table.js";

function signwnaf(P, k, { w = 4, normalize = false } = {}) {// ! w = 4 is optimum for speed
   const wnaf = computeWNAF(k, w);
   const table = oddTable(P, w, normalize); // only odd multiples
   const zs_i = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
   return wnafCore(P, table.map((p, i) => p.normalize(zs_i[i])), wnaf)
}

async function signwnafAsync(P, k, { w = 4, normalize = false } = {}) {// ! w = 4 is optimum for speed
   const P2 = new Promise(r => {
      const table = oddTable(P, w, normalize); // only odd multiples
      const zs_i = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
      r(
         table.map((p, i) => p.normalize(zs_i[i]))
      )
   })
   const P1 = new Promise(r => r(computeWNAF(k, w)));
   const [table, wnaf] = await Promise.all([P2, P1]);
   return wnafCore(P, table, wnaf)
}

function wnafCore(P, table, wnaf) {
   let Q = P.constructor.ZERO;

   for (let i = wnaf.length - 1; i >= 0; i--) {
      Q = Q.double();
      const digit = wnaf[i];
      if (digit !== 0) {
         const T = table.at(Math.abs(digit));
         Q = digit > 0 ? Q.add(T) : Q.add(T.negate());
      }
   }
   return Q;
}

export { signwnaf, signwnafAsync }