import crypto from "crypto";

const algorithm = "aes-256-cbc";

const getKey = () => {
  let secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.error("SECRET_KEY environment variable is required");
    secretKey = "SycfsQo3tIplz68PaeSHEyQDvKZ0ofWA";
  }

  return crypto
    .createHash("sha512")
    .update(secretKey)
    .digest("hex")
    .substring(0, 32);
};

export const encrypt = <T extends string | null | undefined>(data: T): T => {
  if (!data) {
    return data;
  }

  const key = getKey();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return (iv.toString("hex") + encrypted) as T;
};

export const decrypt = <T extends string | null | undefined>(data: T): T => {
  if (!data) {
    return data;
  }

  const key = getKey();

  const inputIV = data.slice(0, 32);
  const encrypted = data.slice(32);
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key),
    Buffer.from(inputIV, "hex"),
  );

  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted as T;
};
