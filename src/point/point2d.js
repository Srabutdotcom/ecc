class Point2D {
   constructor(x = 0, y = 0) {
      this.x = BigInt(x);
      this.y = BigInt(y);
   }

   // Add another point
   add(other) {
      return new Point2D(this.x + other.x, this.y + other.y);
   }

   // Subtract another point
   subtract(other) {
      return new Point2D(this.x - other.x, this.y - other.y);
   }

   // Scale the point by a scalar
   scale(factor) {
      const f = BigInt(factor);
      return new Point2D(this.x * f, this.y * f);
   }

   // Check equality with another point
   equals(other) {
      return this.x === other.x && this.y === other.y;
   }

   // Calculate Manhattan distance (you can change this to Euclidean if needed)
   distanceTo(other) {
      return {
         dx: this.x - other.x,
         dy: this.y - other.y
      };
   }

   // String representation
   toString() {
      return `(${this.x}, ${this.y})`;
   }

   // Static zero point
   static get ZERO() {
      return new Point2D(0n, 0n);
   }

   // Check if the point is zero
   get isZero() {
      return this.x === 0n && this.y === 0n;
   }
}

export { Point2D }
