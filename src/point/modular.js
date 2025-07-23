// Modular arithmetic utilities
function mod(a, m) {
   //best than return ((a % m) + m) % m;
   if (a >= 0n && a < m) return a;
   const r = a % m;
   return r >= 0n ? r : m + r;
}

function modInv(a, m) {//
   if (a < 0n) a = mod(a, m);
   let r0 = a, r1 = m;
   let s0 = 1n, s1 = 0n;

   while (r1 !== 0n) {
      const q = r0 / r1;

      const rt = r0 - q * r1;
      r0 = r1;
      r1 = rt;

      const st = s0 - q * s1;
      s0 = s1;
      s1 = st;
   }

   // If GCD is not 1, inverse doesn't exist
   if (r0 !== 1n) return null;

   // Ensure positive result
   return s0 < 0n ? mod(s0, m) : s0;
}

var sqr = (v, p) => mod(v * v, p)
var mul = (a, b, p) => mod(a * b, p)
var add = (a, b, p) => mod(a + b, p)
var sub = (a, b, p) => mod(a - b, p)

/*
! using memoize is slower
   var sqr = (v, p) => {
   const key = { v, p, ops: 'sqr' }
   return memoized((key, v, p) => mod(v * v, p))(key, v, p)
}
var mul = (a, b, p) => {
   const key = { a, b, p, ops: 'mul' }
   return memoized((key, a, b, p) => mod(a * b, p))(key, a, b, p)
} */

export { mod, modInv }
export { sqr, mul, add, sub }