# @aicone/ecc

# ECC
Elliptic Curve Cryptography
@version 0.0.7


## Features
- ✅ ECDSA verification: sync and async versions

## Usage
```js
import { ECC256, ECC384, ECC521, ecc } from "jsr:@aicone/ecc";

ECC384.verify(message, signature, publicKey)
//Synchronous ECDSA signature verification.

ECC384.verifyAsync(message, signature, publicKey)
//Asynchronous ECDSA signature verification.
```

### Contributing

Contributions to improve the library are welcome. Please open an issue or pull request on the GitHub repository.

### Donation
- https://paypal.me/aiconeid 

### License

This project is licensed under the MIT License.