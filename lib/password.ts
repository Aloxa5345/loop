import bcrypt from "bcrypt";

/**
 * Hash a plain-text password.
 * Cost factor 12 gives a good balance between security and login latency.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

/**
 * Compare a plain-text password against a stored hash.
 */
export async function verifyPassword(
    password: string,
    passwordHash: string
): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
}
