import { oddMemo } from "../mod.ts";
import { signwnaf, signwnafAsync } from "./wnaf.js";

const cache = new Map;

function pointKey(P, s) {
   return `${P.x}-${P.y}-${P.z || 1n}-${s}`;
}

function cachedMultiply(P, s) {
   const key = pointKey(P, s)//s.toString();
   let result = cache.get(key);
   if (!result) {
      result = signwnaf(P, s);
      cache.set(key, result);
   }
   return result;
}

async function cachedMultiplyAsync(P, s) {
   const key = pointKey(P, s)//s.toString();
   let result = cache.get(key);
   if (!result) {
      result = await signwnafAsync(P, s);
      cache.set(key, result);
   }
   return result;
}

function split(P, sc, { normalize = false } = {}) {
   //const scalars = splitScalarEqual(sc);
   const base = sc >> 1n;
   const isEven = (sc & 1n) == 0n;
   const T = cachedMultiply(P, base)
   // Use loop instead of `.reduce()` to avoid function overhead and intermediate closures
   if (isEven) return normalize ? T.double().normalize() : T.double();
   return normalize ? T.double().add(P).normalize() : T.double().add(P);
}

function tripling(P, sc, { normalize = false } = {}) {
   const base = sc / 3n;
   const rem = Number(sc % 3n); // safe because remainder < n
   const T = cachedMultiply(P, base)//Promise.all([cachedMultiply(P, base)]);
   switch (rem) {
      case 0: return normalize ? T.tripling().normalize() : T.tripling();
      case 1: return normalize ? T.tripling().add(P).normalize() : T.tripling().add(P);
      case 2: return normalize ? T.tripling().add(P.double()).normalize() : T.tripling().add(P.double());
   }
}

function splitN(P, sc, { normalize = false, w = 4 } = {}) {
   const n = BigInt(w);    // represents 2^n
   const base = sc >> n;   // divided by 2^n
   const remainder = sc & ((1n << n) - 1n)   // reminder
   const T = cachedMultiply(P, base)
   if (!remainder) return T;
   const isRemEven = (remainder & 1n) == 0n;
   const table = oddMemo(P);
   if (isRemEven) {
      const rem = table[Number(remainder) + 1];
      const rem_mP = rem.add(P.negate());
      const r = T.doubleN(w).add(rem_mP);
      return r
   } else {
      const rem = table[Number(remainder)];
      const r = T.doubleN(w).add(rem);
      return r;
   }
}

async function splitF(P, sc, { normalize = false, factor = 2n } = {}) {
   //const scalars = splitScalarEqual(sc);
   const base = sc >> 1n;
   const isEven = (sc & 1n) == 0n;
   const T = await cachedMultiplyAsync(P, base /* + (isEven ? factor : factor + 1n) */)
   
   if(isEven) return normalize ? T.double().normalize() : T.double();
   return normalize ? T.double().add(P).normalize() : T.double().add(P);
}

export { split, tripling, splitN, splitF }