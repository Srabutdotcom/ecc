import { memoized } from "../helper/memoize.js";
import { Jacobi } from "./jacobi.js";
import { add, modInv, mul, sqr, sub } from "./modular.js";

//{@link https://eprint.iacr.org/2014/1014.pdf}
class JRelative extends Jacobi {
   constructor(x, y, z = 1n, s, t, u) {
      super(x, y, z, s)
   }
   doubleAdd(P0) {
      return doubleAddRelative(P0, this)
   }
   double(isLastDouble = false) {
      return doubleRelative(this, isLastDouble)
   }
   doubleGeneral(Z0sqr = 1n) {
      return doubleRelativeGeneral(this, Z0sqr)
   }
   normalize(iz) {
      return alignMemo(this, iz)
   }
}

//P3 = P0 + 2P1; P0 with z=1n
//P0 in Jacobian coordinates
function doubleAddRelative(P0, P1) {
   const { p } = P0.constructor.CURVE
   let X0 = P0.x, Y0 = P0.y, Z0 = P0.z;
   let X1 = P1.x, Y1 = P1.y, Z01 = P1.z;//Z`1

   // Step 1–4: shared Z computations
   let S = sqr(Z01, p);         // S = Z01^2
   let T = mul(Z01, S, p);      // T = Z01^3
   let U = mul(X0, S, p);       // U = X2
   let V = mul(Y0, T, p);       // V = Y2

   for (let i = 0; i < 2; i++) {
      // Step 5–18: core addition
      T = sub(Y1 , V, p);           // T = L = Y1 − V
      V = sub(X1 , U, p);           // V = X1 − U
      Z01 = mul(V, Z01, p);        // Z01 = (X1 - X2)Z01 = Z03 (can use S as temp) 

      S = mul(V, V, p);               // S = V^2 = (X1 - X2)^2
      V = mul(U, S, p);            // V = U * S = X2(X1 - X2)^2
      U = mul(X1, S, p);           // U = X1 * S = X1(X1 - X2)^2

      X1 = mul(T, T, p);              // X1 = T^2 = L^2
      S = sub(X1 , V, p);           // S = X1 − V
      X1 = sub(S , U, p);           // X3 = S − U

      S = sub(U , V, p);            // S = U − V
      V = mul(Y1, S, p);           // V = Y1 * S

      Y1 = sub(U , X1, p);          // Y3 = U − X3
      S = mul(T, Y1, p);           // S = T * Y3
      Y1 = sub(S , V, p);           // Y3 = S − V
   }

   return new P0.constructor(X1, Y1, Z01)//{ X: X3, Y: Y3, Z: Z01 };
}

//P1 in relative Jacobian coordinates
//Output: 2P1;
function doubleRelative(P1, isLastDouble) {
   const { p, a } = P1.constructor.CURVE
   const { x, y, z, s } = P1//{ X: X1, Y: Y1, Z: Z01 } = P1;
   let X1 = x, Y1 = y, Z01 = z
   let S = s, T, U, V;

   if (!S) {
      S = sqr(Z01, p);          // S = Z01^2
      T = mul(S, S, p);            // T = S^2 = Z01^4
      S = mul(T, a, p);       //! S = aZ4_0 = a * Z01^4
   }

   U = mul(X1, X1, p);             // U = X1^2
   T = add(U , U, p);           // T = 2 * X1^2
   V = add(T , U, p);           // V = 3 * X1^2

   T = add(V , S, p);           //! T = L = 3X1^2 + aZ4

   V = mul(Y1, Z01, p);        // V = Y1 * Z01
   Z01 = add(V , V, p);         //! Z01 = 2 * Y1 * Z01 = Z03

   V = mul(Y1, Y1, p);             // V = Y1^2
   Y1 = add(V , V, p);          // Y1 = 2Y1^2
   U = mul(X1, Y1, p);         // U = 2X1 * Y1^2
   V = add(U , U, p);           // V = 4X1 * Y1^2

   X1 = mul(T, T, p);             // X1 = L^2
   U = sub(X1 , V, p);          // U = L^2 − 4X1Y1^2
   X1 = sub(U , V, p);          //! X3 = X1 = L^2 − 8X1Y1^2

   U = sub(V , X1, p);          // U = 4X1Y1^2 − X3
   V = mul(T, U, p);           // V = L * (4X1Y1^2 − X3)

   U = mul(Y1, Y1, p);             // U = 4Y1^4
   T = add(U , U, p);           // T = 8Y1^4

   Y1 = sub(V , T, p);          //! Y3 = V − 8Y1^4

   if (!isLastDouble) {
      U = mul(T, S, p);         // U = 8Y1^4 * aZ4
      S = add(U , U, p);         //! S = 16Y1^4 * aZ4 = aZ4_3
   }

   return new P1.constructor(X1, Y1, Z01, S)//{ X: X1, Y: Y1, Z: Z01, aZ4: S };
}

function doubleRelativeGeneral(P, Z0sqr = 1n) {
   const { p } = P.constructor.CURVE
   let { x: X1, y: Y1, z: Z0p } = P;

   // Step 1: S = Z0p^2
   let S = mul(Z0p, Z0p, p); // Z0'^2

   // Step 2: T = S * Z0²
   let T = mul(S, Z0sqr, p); // Z0'^2 * Z0² = Z0^2 Z0'^2 = Z1^2

   // Step 3: U = X1 + T
   let U = add(X1 , T, p);

   // Step 4: V = X1 - T
   let V = sub(X1 , T, p);

   // Step 5: S = U * V
   S = mul(U, V, p); // S2 = X1^2 - Z1^4

   // Step 6: U = S + S
   U = add(S , S, p);

   // Step 7: T = U + S
   T = add(U , S, p);

   // Step 8: V = Y1 * Z0p
   V = mul(Y1, Z0p, p);

   // Step 9: Z0p = V + V
   Z0p = add(V , V, p); //! new Z0p = Z0'^3

   // Step 10: V = Y1^2
   V = mul(Y1, Y1, p);

   // Step 11: Y1 = V + V
   Y1 = add(V , V, p); // 2 * Y1^2

   // Step 12: U = X1 * Y1
   U = mul(X1, Y1, p);

   // Step 13: V = U + U
   V = add(U , U, p); // 4 * X1 * Y1^2

   // Step 14: X1 = T^2
   X1 = mul(T, T, p);

   // Step 15: U = X1 - V
   U = sub(X1 , V, p);

   // Step 16: X1 = U - V
   X1 = sub(U , V, p); //! Final X3

   // Step 17: U = V - X1
   U = sub(V , X1, p);

   // Step 18: V = T * U
   V = mul(T, U, p);

   // Step 19: U = Y1^2 (again)
   U = mul(Y1, Y1, p);

   // Step 20: T = U + U
   T = add(U , U, p); // 8 * Y1^4

   // Step 21: Y1 = V - T
   Y1 = sub(V , T, p); //! Final Y3

   return new P.constructor(X1, Y1, Z0p);
}

var alignMemo = memoized((P, Zi) => {
   const { p, a } = P.constructor.CURVE
   if (Zi == 1n) return new P.constructor(P.x, P.y, 1n, a)
   const scale = Zi ? Zi : modInv(P.z, p);
   const scale2 = sqr(scale, p);         // scale^2
   const scale3 = mul(scale2, scale, p); // scale^3
   const aZ0_4 = a//Zi == 1n ? a : mul(a , Zi ** 4n, p)

   return new P.constructor(
      mul(P.x, scale2, p),
      mul(P.y, scale3, p),
      1n, // now shared
      aZ0_4 // aZ0^4
   )
})

export { JRelative, doubleAddRelative, doubleRelative, alignMemo }