import { mod, modInv } from "../mod.ts";

function pow(base, exp, p) {
   let result = 1n;
   base = base % p;
   while (exp > 0n) {
      if (exp % 2n === 1n) result = (result * base) % p;
      base = (base * base) % p;
      exp >>= 1n;
   }
   return result;
}

function inv(a, p) {
   return pow(a, p - 2n, p);
}

function GF(p) {
   return {
      mod(v) { return mod(v, p) },
      inv(v) { return modInv(v, p) },
      sqr(v) { return mod(v * v, p) },
      mul(a, b) { return mod(a * b, p) },
      add(a, b) { return mod(a + b, p) },
      sub(a, b) { return mod(a - b, p) },
   }
}

export { pow, inv, GF }

