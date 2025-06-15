function doubleadd(P, k) {
   if (k === 0n) return P.constructor.ZERO; //! Infinity
   if (k === 1n) return P;
   if (k < 0n) return doubleadd(P.negate(),-k);

   let result = P.constructor.ZERO; //! Infinity
   let addend = P;

   while (k > 0n) {
      if (k & 1n) {
         result = result.add(addend);
      }
      addend = addend.double();
      k >>= 1n;
   }

   return result;
}

export { doubleadd }