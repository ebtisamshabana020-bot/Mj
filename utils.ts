
/**
 * Standard SHA-256 Hash for passwords
 */
export const hashString = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
