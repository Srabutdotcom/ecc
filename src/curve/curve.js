import { sha256, sha384, sha512 } from "jsr:@noble/hashes/sha2@1.8.0"

const secp521r1 = { // {@link https://neuromancer.sk/std/secg/secp521r1#}
  name: 'secp521r1',
  p: 0x01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
  n: 0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409n,
  a: 0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcn, 
  b: 0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00n,
  g: {
    x: 0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66n,
    y: 0x011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650n
  },
  h: 0x1n,
  bit: 521,
  sha: "SHA-512",
  OID: '1.3.132.0.35',
  hash: (msg)=>sha512.create().update(msg).digest()
}

const secp384r1 = { // {@link https://neuromancer.sk/std/secg/secp384r1#}
  name: 'secp384r1',
  p: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFFn,
  n: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973n,
  a: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFCn, // -3 mod p
  b: 0xB3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEFn,
  g: {
    x: 0xAA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7n,
    y: 0x3617DE4A96262C6F5D9E98BF9292DC29F8F41DBD289A147CE9DA3113B5F0B8C00A60B1CE1D7E819D7A431D7C90EA0E5Fn
  },
  h: 0x1n,
  bit: 384,
  sha: "SHA-384",
  OID: '1.3.132.0.34',
  hash: (msg)=>sha384.create().update(msg).digest()
}

const secp256r1 = { // {@link https://neuromancer.sk/std/secg/secp256r1#}
  name: 'secp256r1',
  p: 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn,
  n: 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n,
  a: 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffcn, 
  b: 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn,
  g: {
    x: 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n,
    y: 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n
  },
  h: 0x1n,
  bit: 256,
  sha: "SHA-256",
  OID: '1.2.840.10045.3.1.7',
  hash: (msg)=>sha256.create().update(msg).digest()
}

export { secp384r1, secp256r1, secp521r1 }