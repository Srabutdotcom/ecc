import { batchInverse } from "../helper/batchinverse.js";
import { chunkScalar } from "../scalar/decompose.js";
import { baseTable } from "../table/table.js";

/**
 * {@link https://www.mdpi.com/2227-7390/13/6/924}
 * @param {BigInt} k 
 * @param {number} w 
 * @returns 
 */
function multibase(P, k, { w = 4, normalize = false } = {}) { // ! w = 4 is optimum for speed
   const table = baseTable(P, w, normalize)
   const chunks = chunkScalar(k, w);
   
   // const base = 1n << BigInt(w) //equivalent to 2n ** BigInt(w)
   const zs_i = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
   return multibaseCore(P, w, chunks, table.map((p, i) => p.normalize(zs_i[i])))
}

async function multibaseAsync(P, k, { w = 4, normalize = false } = {}) { // ! w = 4 is optimum for speed
   const P2 = new Promise(r => {
      const table = baseTable(P, w, normalize)
      const zs_i = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
      r(
         table.map((p, i) => p.normalize(zs_i[i]))
      )
   })
   const P1 = new Promise(r => r(chunkScalar(k, w)));
   
   // const base = 1n << BigInt(w) //equivalent to 2n ** BigInt(w)
   const [chunks, table] = await Promise.all([P1, P2])
   return multibaseCore(P, w, chunks, table)
}

function multibaseCore(P, w, chunks, table) {
   let Q = P.constructor.ZERO;
   // const base = 1n << BigInt(w) //equivalent to 2n ** BigInt(w)
   for (let i = chunks.length - 1; i > 0; i--) {// let i = 0 be the reminder
      Q = Q.add(table.at(chunks[i]));
      Q = Q.doubleN(w)
      /* for (let j = 0; j < w; j++) {
         Q = Q.double();
      } */
   }
   Q = Q.add(table.at(chunks[0]));
   return Q
}

export { multibase, multibaseAsync }