import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function passwordPolicyError(plain: string): string | null {
  if (plain.length < 10) return "Şifre en az 10 karakter olmalı.";
  if (!/[A-Za-z]/.test(plain) || !/[0-9]/.test(plain)) {
    return "Şifre en az bir harf ve bir rakam içermeli.";
  }
  return null;
}
