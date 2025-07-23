//@ts-self-types="../../type/multiply/multibase.d.ts"
import { chunkScalar } from "../scalar/decompose.js";
import { baseTable } from "../table/table.js";

/**
 * {@link https://www.mdpi.com/2227-7390/13/6/924}
 * @param {BigInt} k 
 * @param {number} w 
 * @returns 
 */
function multibase(P, k, { w = 4, normalize = false } = {}) { // ! w = 4 is optimum for speed
   const table = baseTable(P, { w, normalize })//baseMemo(P, w, normalize)//
   const chunks = chunkScalar(k, w);//chunkMemo({k}, w)//

   return multibaseCore(P, w, chunks, table)
}

async function multibaseAsync(P, k, { w = 4, normalize = false } = {}) { // ! w = 4 is optimum for speed
   const P2 = new Promise(r => {
      const table = baseTable(P, { w, normalize })//baseMemo(P, w, normalize)//
      r(table)
   })
   const chunks = chunkScalar(k, w);//chunkMemo({k}, w)

   const table = await Promise.resolve(P2)
   return multibaseCore(P, w, chunks, table)
}

function multibaseCore(P, w, chunks, table) {
   let Q = P.constructor.ZERO;
   // const base = 1n << BigInt(w) //equivalent to 2n ** BigInt(w)
   for (let i = chunks.length - 1; i > 0; i--) {// let i = 0 be the reminder
      Q = Q.add(table.at(chunks[i]));
      Q = Q.doubleN(w)
   }
   Q = Q.add(table.at(chunks[0]));
   return Q
}

export { multibase, multibaseAsync }