import { signwnaf } from "./wnaf.js";

const cache = new Map;

function pointKey(P, s) {
   return `${P.x}-${P.y}-${P.z || 1n}-${s}`;
}

async function cachedMultiply(P, s) {
   const key = pointKey(P, s)//s.toString();
   let result = cache.get(key);
   if (!result) {
      result = signwnaf(P, s);
      cache.set(key, result);
   }
   return result;
}

async function split(P, sc) {
   //const scalars = splitScalarEqual(sc);
   const base = sc >> 1n;
   const isEven = (sc & 1n) == 0n;
   const T = await cachedMultiply(P, base)
   // Use loop instead of `.reduce()` to avoid function overhead and intermediate closures
   if (isEven) return T.double().normalize();
   return T.double().add(P).normalize();
}

async function tripling(P, sc) {
   const base = sc / 3n;
   const rem = Number(sc % 3n); // safe because remainder < n
   const T = await cachedMultiply(P, base)//Promise.all([cachedMultiply(P, base)]);
   switch (rem) {
      case 0: return T.tripling().normalize();
      case 1: return T.tripling().add(P).normalize();
      case 2: return T.tripling().add(P.double()).normalize();
   }
}

export { split, tripling }