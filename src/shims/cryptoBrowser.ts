import SHA256 from 'crypto-js/sha256';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

function hashChain(run: (value: string) => { toString: (enc: typeof Hex) => string }) {
  let data = '';
  return {
    update(chunk: string) {
      data += String(chunk);
      return this;
    },
    digest() {
      return run(data).toString(Hex);
    },
  };
}

export function createHash() {
  return hashChain((value) => SHA256(value));
}

export function createHmac(_algorithm: string, secret: string) {
  return hashChain((value) => HmacSHA256(value, secret));
}

const nodeCrypto = { createHash, createHmac };
export default nodeCrypto;
