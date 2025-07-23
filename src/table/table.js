import { batchInverse, memoized } from "../mod.ts";

function baseTable(P, { w = 4, normalize = false } = {}) {
   const L = [];
   L[0] = P.constructor.ZERO
   L[1] = P
   //loop over 3 w
   //[0,1,2,3] for w = 4 - bit representation
   for (let i = 1; i < w; i++) {
      // get current bit
      const bit = 1 << i;
      const Qbit = L.at(bit >> 1).double();
      L[bit] = Qbit
      // loop within bit combination
      for (let j = 1; j < bit; j++) {
         const idx = bit + j;
         if ((idx & 1) == 0) {
            L[idx] = L.at(idx >> 1).double()
         } else {
            L[idx] = Qbit.add(L.at(j))
         }
      }
   }
   if (!normalize) return L;
   const inv = batchInverse(L.map(e => e.z), P.constructor.CURVE.p);
   return L.map((p, i) => p.normalize(inv[i]))
}

function oddTable(P, { w = 4, normalize = false } = {}) {
   const table = []
   const max = 1 << (w - 1); // e.g. 16 for w = 5 → covers up to 31P

   table[1] = P
   const curr = P.double(); // 2P
   for (let i = 3; i < 2 * max; i += 2) {
      const prev = table.at(i - 2);
      table[i] = curr.add(prev)
   }
   if (!normalize) return table;
   const inv = batchInverse(table.map(e => e.z), P.constructor.CURVE.p);
   return table.map((p, i) => p.normalize(inv[i]))
}

var oddMemo = memoized(oddTable)
var baseMemo = memoized(baseTable)

export { baseTable, baseMemo, oddTable, oddMemo }