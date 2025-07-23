import { mod, modInv } from "../mod.ts";

function u8_bi(b) {
   let result = 0n;
   for (const byte of b) {
      result = (result << 8n) | BigInt(byte);
   }
   return result;
}

function u8le_bi(bytes) {
   let result = 0n;
   for (let i = bytes.length - 1; i >= 0; i--) {
      result = (result << 8n) | BigInt(bytes[i]);
   }
   return result;
}

function bi_u8(b) {
   if (b === 0n) return new Uint8Array([0]);
   const bytes = [];
   let n = b;
   while (n > 0n) {
      bytes.push(Number(n & 0xffn));
      n >>= 8n;
   }
   return Uint8Array.from(bytes);
}

function bi_u8le(b, byteLength) {
   if (b < 0n) throw new RangeError('Cannot convert negative BigInt to Uint8Array');
   const bytes = [];
   let n = b;
   while (n > 0n) {
     bytes.push(Number(n & 0xffn));
     n >>= 8n;
   }
   // Pad with zeros if byteLength is specified
   while (byteLength && bytes.length < byteLength) {
     bytes.push(0);
   }
   return Uint8Array.from(bytes);
 }

function splitSignature(sign, n) {
   const { r, s } = splitSig(sign)
   //const isR_S_ok = in0toP(r, n) && in0toP(s, n);
   //if (isR_S_ok == false) throw new RangeError(`expected r and s in between 0n to prime`)
   const w = modInv(s, n)
   const u2 = mod(r * w, n)
   return { r, s, w, u2 };
}

function splitSig(sig) {
   const len = sig.length >>> 1; // Faster division by 2
   const r = u8_bi(sig.subarray(0, len));
   const s = u8_bi(sig.subarray(len));
   return { r, s }
}

function splitPublicKey(publicKey, point) {
   let pk = publicKey.slice()
   if ((publicKey.length & 1) !== 0) {
      const prefix = publicKey[0]
      if (prefix !== 0x04) throw new TypeError(`Expected uncompressed public key (0x04 prefix)`);
      //there are compressed version 0x02 & 0x03 but neglected for now
      pk = pk.slice(1)
   }

   const div = pk.length >>> 1; // Faster division by 2
   const Q = new point(
      u8_bi(pk.subarray(0, div)),
      u8_bi(pk.subarray(div)),
      1n,
      { precompute: false }
   );

   return Q
}

function in0toP(v, p) {
   return v > 0 && v < p
}

function unity(...arrays) {
   const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
   const result = new Uint8Array(totalLength);
   let offset = 0;
   for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
   }
   return result;
}

const encoder = new TextEncoder

export { splitSignature, splitSig, splitPublicKey, in0toP, u8_bi, bi_u8, u8le_bi, bi_u8le, unity }
export { encoder }