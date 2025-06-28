import { mod, modInv } from "../mod.ts";

function u8_bi(b) {
   let result = 0n;
   for (const byte of b) {
      result = (result << 8n) | BigInt(byte);
   }
   return result;
}

function splitSignature(sign, n) {
   const len = sign.length >>> 1; // Faster division by 2
   const r = u8_bi(sign.subarray(0, len));
   const s = u8_bi(sign.subarray(len));
   const isR_S_ok = in0toP(r, n) && in0toP(s, n);
   if (isR_S_ok == false) throw new RangeError(`expected r and s in between 0n to prime`)
   const w = modInv(s, n)
   const u2 = mod(r * w, n)
   return { r, s, w, u2 };
}

function splitPublicKey(publicKey, point) {
   const prefix = publicKey[0]
   if (prefix !== 0x04) throw new TypeError(`Expected uncompressed public key (0x04 prefix)`);
   //there are compressed version 0x02 & 0x03 but neglected for now
   const len = (publicKey.length - 1) >>> 1; // Faster division by 2
   const st = len + 1;
   const Q = new point(
      u8_bi(publicKey.subarray(1, st)),
      u8_bi(publicKey.subarray(st)),
      1n
   );
   
   return Q
}

function in0toP(v, p) {
   return v > 0 && v < p
}

export { splitSignature, splitPublicKey, in0toP, u8_bi }