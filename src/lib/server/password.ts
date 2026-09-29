import crypto from 'node:crypto';

/** A random password from the chosen character sets, drawn with a CSPRNG. */
export function generatePassword(
	length: number = 8,
	options = {
		lowercase: true,
		uppercase: true,
		numbers: true,
		symbols: true
	}
): string {
	const lowers = 'abcdefghijklmnopqrstuvwxyz';
	const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const nums = '0123456789';
	const syms = '!@#$%^&*()-_=+[]{};:,.<>/?';

	let chars = '';
	if (options.lowercase) chars += lowers;
	if (options.uppercase) chars += uppers;
	if (options.numbers) chars += nums;
	if (options.symbols) chars += syms;

	if (!chars) throw new Error('No character sets selected!');

	let password = '';
	for (let i = 0; i < length; i++) {
		password += chars[crypto.randomInt(0, chars.length)];
	}

	return password;
}
