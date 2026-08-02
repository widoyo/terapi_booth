// place files you want to import through the `$lib` alias in this folder.


async function generateDeviceHash(deviceId: string): Promise<string> {
  const secretSalt = "Pr1nusS3cr3t"; // Salt rahasia untuk meningkatkan keamanan hash
  const msgUint8 = new TextEncoder().encode(`${deviceId}-${secretSalt}`);
  
  const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Potong dan ambil 16 karakter pertama saja
  return hashHex.substring(0, 16);
}