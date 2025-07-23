//@ts-self-types="../../type/multiply/wnaf.d.ts"

import { computeWNAF } from "../scalar/decompose.js";
import { oddMemo } from "../table/table.js";

function signwnaf(P, k, { w = 4, normalize = false } = {}) {// ! w = 4 is optimum for speed
   const wnaf = computeWNAF(k, w);//wnafMemo({k},w)//
   const table = oddMemo(P, { w, normalize }) // only odd multiples
   return wnafCore(P, table, wnaf)
}

async function signwnafAsync(P, k, { w = 4, normalize = false } = {}) {// ! w = 4 is optimum for speed
   const P2 = new Promise(r => {
      const table = oddMemo(P, { w, normalize })  // only odd multiples
      r(table)
   })
   const wnaf = computeWNAF(k, w);//wnafMemo({k},w)
   const table = await Promise.resolve(P2);
   return wnafCore(P, table, wnaf)
}

function wnafCore(P, table, wnaf) {
   let Q = P.constructor.ZERO;

   const len = wnaf.length - 1
   for (let i = len; i >= 0; i--) {
      //! trick to avoid calculate extended if current digit 0 and not the last indez or i == 0
      if (i < len) Q = Q.double(wnaf[i] == 0 && i !== 0);
      const digit = wnaf[i];
      if (digit !== 0) {
         const T = table.at(Math.abs(digit));
         const isNext0 = wnaf[i-1]==0 && i == 1;
         Q = digit > 0 ? Q.add(T, isNext0) : Q.add(T.negate(), isNext0);
      }
   }
   return Q;
}

export { signwnaf, signwnafAsync, wnafCore }