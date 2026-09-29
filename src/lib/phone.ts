/**
 * Ethiopian mobile numbers, in the one shape every app stores them: `+2519XXXXXXXX` (Ethio
 * telecom) or `+2517XXXXXXXX` (Safaricom).
 *
 * People type them every way there is — `0911 23 45 67`, `911234567`, `251911234567`,
 * `+251-91-123-4567` — and a row keyed by phone (a guest customer, say) must not split into four
 * because of that. So the number is normalised once, on the server, before it is compared or
 * stored; the browser-side check is a courtesy.
 *
 * Landlines (`011…`) are rejected on purpose: these numbers receive SMS.
 *
 * No server imports, so a zod schema shared with the browser can use it too.
 */

/** What to show under a phone field that failed. */
export const INVALID_PHONE_MESSAGE = 'Enter a mobile number like 0911 234 567';

/**
 * The number as `+251[79]XXXXXXXX`, or `null` if it is not an Ethiopian mobile number.
 *
 *     normalizePhone('0911 23 45 67')   // '+251911234567'
 *     normalizePhone('+251-71-123-4567') // '+251711234567'
 *     normalizePhone('011 551 2345')    // null — a landline
 */
export function normalizePhone(input: string | null | undefined): string | null {
	if (!input) return null;

	// Separators people type: spaces, dashes, dots, brackets.
	const digits = input.trim().replace(/[\s\-.()]/g, '');
	const match = digits.match(/^(?:\+?251|0)?([79]\d{8})$/);

	return match ? `+251${match[1]}` : null;
}

/** Whether `normalizePhone` would accept it. */
export function isEthiopianPhone(input: string | null | undefined): boolean {
	return normalizePhone(input) !== null;
}

/**
 * The local form, `09XXXXXXXX`, for providers that want ten digits (Chapa's `phone_number`).
 * `null` for anything `normalizePhone` rejects.
 */
export function localPhone(input: string | null | undefined): string | null {
	const phone = normalizePhone(input);
	return phone ? `0${phone.slice(4)}` : null;
}
