
/**
 * Password hashing using PBKDF2 + random salt.
 * Returns format: pbkdf2$<iterations>$<saltBase64>$<hashBase64>
 */
const PBKDF2_ITERATIONS = 120000;


type Argon2HashFn = (plainText: string) => Promise<string>;
type Argon2VerifyFn = (plainText: string, storedHash: string) => Promise<boolean>;

const getArgon2HashFn = (): Argon2HashFn | null => {
  const globalScope = globalThis as typeof globalThis & { __argon2Hash?: Argon2HashFn };
  return typeof globalScope.__argon2Hash === 'function' ? globalScope.__argon2Hash : null;
};

const getArgon2VerifyFn = (): Argon2VerifyFn | null => {
  const globalScope = globalThis as typeof globalThis & { __argon2Verify?: Argon2VerifyFn };
  return typeof globalScope.__argon2Verify === 'function' ? globalScope.__argon2Verify : null;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const toLegacySha256Hex = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const hashString = async (message: string): Promise<string> => {
  const argon2Hash = getArgon2HashFn();
  if (argon2Hash) {
    return argon2Hash(message);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(message),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(hashBits))}`;
};


export const isLegacySha256HashFormat = (storedHash: string): boolean => {
  return /^[a-f0-9]{64}$/i.test(storedHash);
};

export const verifyStringHash = async (message: string, storedHash: string): Promise<boolean> => {
  if (storedHash.startsWith('argon2')) {
    const argon2Verify = getArgon2VerifyFn();
    return argon2Verify ? argon2Verify(message, storedHash) : false;
  }

  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;

    const iterations = Number(parts[1]);
    const salt = fromBase64(parts[2]);
    const expected = parts[3];

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(message),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const hashBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return toBase64(new Uint8Array(hashBits)) === expected;
  }

  // Legacy fallback for old stored records only (migration path).
  const legacy = await toLegacySha256Hex(message);
  return legacy === storedHash;
};

/**
 * Client-side Image Compression
 */
export const compressImage = async (file: File, maxWidth = 400): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality
      };
    };
  });
};

/**
 * Converts a File object to a Base64 string (without the data URL prefix)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Simple End-to-End Encryption (E2EE) Simulation using Web Crypto API
 * In a real app, keys would be exchanged via Signal Protocol/DH
 */
const E2EE_KEY_SECRET = "study-genius-master-key-placeholder";

export const encryptMessage = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  // Simulation: using btoa for demo visibility, but crypto is used in real scenarios
  return btoa(unescape(encodeURIComponent(text)));
};

export const decryptMessage = (encoded: string): string => {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch (e) {
    return "[Encrypted Content]";
  }
};
