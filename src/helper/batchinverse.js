import { mod, modInv } from "../point/modular.js";

function batchInverse(nums, p) {
   const inverted = [];
   // Walk from first to last, multiply them by each other MOD p
   const multipliedAcc = nums.reduce((acc, num, i) => {
      if (num == 0n) return acc;
      inverted[i] = acc;
      return mod(acc * num, p)//Fp.mul(acc, num); //!
   }, 1n);
   // Invert last element
   const invertedAcc = modInv(multipliedAcc, p)//Fp.inv(multipliedAcc); //!
   // Walk from last to first, multiply them by inverted each other MOD p
   nums.reduceRight((acc, num, i) => {
      if (num == 0n) return acc;
      inverted[i] = mod(acc * inverted[i], p) //Fp.mul(acc, inverted[i]); //!
      return mod(acc * num, p)//Fp.mul(acc, num); //!
   }, invertedAcc);
   return inverted;
}

export { batchInverse }