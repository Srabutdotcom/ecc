// --- Constants ---
const SHA3_ROTL = [
   1, 3, 6, 10, 15, 21, 28, 36, 45, 55,
   2, 14, 27, 41, 56, 8, 25, 43, 62, 18,
   39, 61, 20, 44
];
const SHA3_PI = [
   20, 14, 22, 34, 36, 6, 10, 32, 16, 42,
   48, 8, 30, 46, 38, 26, 24, 4, 40, 28,
   44, 18, 12, 2
];
const SHA3_IOTA_H = [
   1, 32898, 32906, 2147516416, 32907, 2147483649, 2147516545, 32777, 138, 136, 2147516425, 2147483658, 2147516555, 139, 32905, 32771, 32770, 128, 32778, 2147483658, 2147516545, 32896, 2147483649, 2147516424
];
const SHA3_IOTA_L = [
   0, 0, 2147483648, 2147483648, 0, 0, 2147483648, 2147483648, 0, 0, 0, 0, 0, 2147483648, 2147483648, 2147483648, 2147483648, 2147483648, 0, 2147483648, 2147483648, 2147483648, 0, 2147483648
]; // low word always 0

// Left rotate for Shift in [1, 32)
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));

// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));

// Left rotation (without 0, 32, 64)
const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));

function keccakP(s, rounds = 24) {
   const B = new Uint32Array(10);
   // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
   for (let round = 24 - rounds; round < 24; round++) {
      // Theta θ
      for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
         const idx1 = (x + 8) % 10;
         const idx0 = (x + 2) % 10;
         const B0 = B[idx0];
         const B1 = B[idx0 + 1];
         const Th = rotlH(B0, B1, 1) ^ B[idx1];
         const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
         for (let y = 0; y < 50; y += 10) {
            s[x + y] ^= Th;
            s[x + y + 1] ^= Tl;
         }
      }
      // Rho (ρ) and Pi (π)
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
         const shift = SHA3_ROTL[t];
         const Th = rotlH(curH, curL, shift);
         const Tl = rotlL(curH, curL, shift);
         const PI = SHA3_PI[t];
         curH = s[PI];
         curL = s[PI + 1];
         s[PI] = Th;
         s[PI + 1] = Tl;
      }
      // Chi (χ)
      for (let y = 0; y < 50; y += 10) {
         for (let x = 0; x < 10; x++) B[x] = s[y + x];
         for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
      }
      // Iota (ι)
      s[0] ^= SHA3_IOTA_H[round];
      s[1] ^= SHA3_IOTA_L[round];
   }
   clean(B);
}

/** Zeroize a byte array. Warning: JS provides no guarantees. */
export function clean(...arrays) {
   for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
   }
}


class SHA3 {
   constructor(rateBytes = 136, suffix = 0x06, outputLen, enableXOF = false, rounds = 24) {
      this.rateBytes = rateBytes;
      this.blockLen = rateBytes;
      this.state = new Uint8Array(200); // 1600-bit state
      this.state32 = new Uint32Array(this.state.buffer); // for keccakP
      this.pos = 0;
      this.posOut = 0;
      this.rounds = rounds;
      this.finished = false;
      this.suffix = suffix;
      this.outputLen = outputLen;
      this.enableXOF = enableXOF;
   }

   keccak() {
      keccakP(this.state32, this.rounds);
      this.pos = 0;
      this.posOut = 0;
   }

   update(data) {
      for (let pos = 0; pos < data.length;) {
         const take = Math.min(this.blockLen - this.pos, data.length - pos);
         for (let i = 0; i < take; i++) {
            this.state[this.pos++] ^= data[pos++];
         }
         if (this.pos === this.blockLen) this.keccak();
      }
      return this;
   }

   finish() {
      if (this.finished) return;
      this.finished = true;
      this.state[this.pos] ^= this.suffix;
      if ((this.suffix & 0x80) && this.pos === this.blockLen - 1) this.keccak();
      this.state[this.blockLen - 1] ^= 0x80;
      this.keccak();
   }

   writeInto(out) {
      this.finish();
      const { state, blockLen } = this;
      let pos = 0;
      while (pos < out.length) {
         if (this.posOut === blockLen) this.keccak();
         const take = Math.min(blockLen - this.posOut, out.length - pos);
         out.set(state.subarray(this.posOut, this.posOut + take), pos);
         this.posOut += take;
         pos += take;
      }
      return out;
   }

   xofInto(out) {
      if (!this.enableXOF) throw new Error('XOF not supported for this hash');
      return this.writeInto(out);
   }

   xof(bytes) {
      return this.xofInto(new Uint8Array(bytes));
   }

   digestInto(out) {
      if (this.finished) throw new Error('digest() already called');
      this.writeInto(out);
      this.destroy?.();
      return out;
   }

   digest() {
      return this.digestInto(new Uint8Array(this.outputLen));
   }

   destroy() {
      this.state.fill(0);
      this.state32.fill(0);
      this.pos = this.posOut = 0;
      this.finished = true;
   }
}


function shake256(msg) {
   const hash = new SHA3(136, 31, 114);
   hash.update(msg)
   return hash.digest()
}


function shake128(msg) {
   const hash = new SHA3(168, 31, 64);
   hash.update(msg)
   return hash.digest()
}

function sha3_256(msg) {
   const hash = new SHA3(136, 0x06, 32);
   hash.update(msg)
   return hash.digest()
}

function sha3_384(msg) {
   const hash = new SHA3(104, 0x06, 48);
   hash.update(msg)
   return hash.digest()
}

function sha3_512(msg) {
   const hash = new SHA3(72, 0x06, 64);
   hash.update(msg)
   return hash.digest()
}

export { shake256, shake128, sha3_256, sha3_384, sha3_512 }

