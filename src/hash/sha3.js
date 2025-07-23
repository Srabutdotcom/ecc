

function sha3Transform(s) {
   function rol(x, n) {
      return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & 0xFFFFFFFFFFFFFFFFn;
   }
   const ROT = [ // ROTATION
      0, 1, 62, 28, 27, 36, 44, 6, 55, 20,
      3, 10, 43, 25, 39, 41, 45, 15, 21, 8,
      18, 2, 61, 56, 14
   ];
   const PER = [ // PERMUTATION
      1, 6, 9, 22, 14, 20, 2, 12, 13, 19,
      23, 15, 4, 24, 21, 8, 16, 5, 3, 18,
      17, 11, 7, 10
   ];
   const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
      0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
      0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
      0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
      0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
      0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
      0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
      0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
   ];

   for (let rnd = 0; rnd < 24; rnd++) {
      // Theta
      const c = new Array(5).fill(0n);
      const d = new Array(5).fill(0n);
      for (let i = 0; i < 25; i++) c[i % 5] ^= s[i];
      for (let i = 0; i < 5; i++) {
         d[i] = c[(i + 4) % 5] ^ rol(c[(i + 1) % 5], 1);
      }
      for (let i = 0; i < 25; i++) s[i] ^= d[i % 5];

      // Rho
      for (let i = 0; i < 25; i++) s[i] = rol(s[i], ROT[i]);

      // Pi
      const t = s[PER[0]];
      for (let i = 0; i < PER.length - 1; i++) {
         s[PER[i]] = s[PER[i + 1]];
      }
      s[PER[PER.length - 1]] = t;

      // Chi
      for (let i = 0; i < 25; i += 5) {
         const a = s[i], b = s[i+1], c = s[i+2], d = s[i+3], e = s[i+4];
         s[i] = a ^ ((~b) & c);
         s[i + 1] = b ^ ((~c) & d);
         s[i + 2] = c ^ ((~d) & e);
         s[i + 3] = d ^ ((~e) & a);
         s[i + 4] = e ^ ((~a) & b);
      }

      // Iota
      s[0] ^= RC[rnd];
   }
}


function sha3Raw(msg, rateWords, domainPadding, outputBytes) {
   const rateBytes = rateWords * 8;
   const state = new Array(25).fill(0n);

   // --- Absorb helpers ---
   function to64(msg, offset) {
      let x = 0n;
      for (let i = 0; i < 8; i++) {
         x |= BigInt(msg[offset + i]) << BigInt(8 * i);
      }
      return x;
   }

   function xorBlockIntoState(state, block, words) {
      for (let i = 0; i < words; i++) {
         state[i] ^= to64(block, i * 8);
      }
   }

   // --- Reinterpret state to bytes ---
   function reinterpretToOctets(words, count) {
      const out = new Uint8Array(count * 8);
      for (let i = 0; i < count; i++) {
         let w = words[i];
         const base = i * 8;
         for (let j = 0; j < 8; j++) {
            out[base + j] = Number(w & 0xFFn);
            w >>= 8n;
         }
      }
      return out;
   }

   // --- Squeeze ---
   function squeeze(state, rateWords, outputBytes) {
      const rateBytes = rateWords * 8;
      const output = new Uint8Array(outputBytes);
      let offset = 0;

      while (offset < outputBytes) {
         const block = reinterpretToOctets(state, rateWords);
         const len = Math.min(rateBytes, outputBytes - offset);
         output.set(block.subarray(0, len), offset);
         offset += len;
         sha3Transform(state);
      }

      return output;
   }

   // --- Absorb phase ---
   let i = 0;
   const fullBlocks = Math.floor(msg.length / rateBytes);
   for (let b = 0; b < fullBlocks; b++) {
      xorBlockIntoState(state, msg.subarray(i, i + rateBytes), rateWords);
      sha3Transform(state);
      i += rateBytes;
   }

   // --- Padding (optimized) ---
   const m = new Uint8Array(rateBytes);
   const remain = msg.length - i;
   m.set(msg.subarray(i));                    // Copy remaining
   m[remain] = domainPadding;                // Domain separator
   m[rateBytes - 1] |= 0x80;                 // Final bit

   xorBlockIntoState(state, m, rateWords);
   sha3Transform(state);

   // --- Squeeze ---
   return squeeze(state, rateWords, outputBytes);
}

function shake256(msg) {
   return sha3Raw(msg, 17, 31, 114)
}

export { shake256 }
