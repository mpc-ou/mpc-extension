// Since __MPC_KEY__ is injected by Vite, we declare it for TypeScript
declare const __MPC_KEY__: string;

const KEY_STRING = typeof __MPC_KEY__ !== "undefined" ? __MPC_KEY__ : "MPC";

/**
 * Derives a CryptoKey from the master key string using PBKDF2 and a salt.
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(KEY_STRING), { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey"
  ]);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plain text string using AES-GCM and returns a base64 string.
 * The output contains salt (16 bytes) + IV (12 bytes) + ciphertext.
 */
export async function encryptData(plainText: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const ciphertextBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText));

  // Combine salt, iv, and ciphertext into one array
  const ciphertext = new Uint8Array(ciphertextBuffer);
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);

  // Convert combined array to base64
  let binary = "";
  for (const byte of combined) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

/**
 * Decrypts a base64 string using AES-GCM and returns the plain text string.
 */
export async function decryptData(cipherBase64: string): Promise<string> {
  const binaryString = window.atob(cipherBase64);
  const combined = new Uint8Array(binaryString.length);
  let idx = 0;
  for (const char of binaryString) {
    combined[idx] = char.charCodeAt(0);
    idx++;
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(salt);
  const dec = new TextDecoder();

  const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return dec.decode(decryptedBuffer);
}
