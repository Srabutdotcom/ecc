class Point3D {
   constructor(x, y, z = 1n) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.infinity = (z === 0n);
   }
   toString() {
      if (this.infinity) return `${this.constructor.name}(∞)`;
      return `${this.constructor.name} (${toStr(this.x)}..., ${toStr(this.y)}..., ${toStr(this.z)}...)`;
   }
   equals(other) {
      if (this.infinity && other.infinity) return true;
      if (this.infinity || other.infinity) return false;
      return this.x == other.x && this.y == other.y && this.z == other.z
   }
   negate() {
      if (this.infinity) return this;
      return new this.constructor(this.x, -this.y, this.z);
   }
}

function toStr(n, radix = 10, w = 12) {
   return n.toString(radix).slice(0, w)
}

export { Point3D }