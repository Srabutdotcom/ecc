import { memoized } from "../mod.ts";

function computeWNAF(k, w = 4) {
   const wnaf = [];
   const wSize = 1n << BigInt(w);
   const halfW = wSize >> 1n;

   while (k > 0n) {
      let z = 0n;
      if (k & 1n) {
         z = k % wSize;
         if (z > halfW) z -= wSize;
         k -= z;
      } else {
         z = 0n;
      }
      wnaf.push(Number(z));
      k >>= 1n;
   }
   return wnaf;
}

function chunkScalar(k, w = 4) {
   w = BigInt(w)
   const chunks = [];
   const mask = (1n << w) - 1n;
   while (k > 0n) {
      const chunk = k & mask;
      chunks.push(Number(chunk));
      k >>= w;
   }
   return chunks
}

var chunkMemo = memoized((ko, w)=>{
   const { k } = ko;
   return chunkScalar(k, w)
});
var wnafMemo = memoized((ko, w)=>{
   const { k } = ko;
   return computeWNAF(k, w)
})

export { computeWNAF, wnafMemo, chunkScalar, chunkMemo }