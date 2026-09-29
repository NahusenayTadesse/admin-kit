import { describe, expect, it } from 'vitest';
import { isEthiopianPhone, localPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
	it.each([
		['0911234567', '+251911234567'],
		['911234567', '+251911234567'],
		['251911234567', '+251911234567'],
		['+251911234567', '+251911234567'],
		['0911 23 45 67', '+251911234567'],
		['+251-91-123-4567', '+251911234567'],
		['(091) 123.4567', '+251911234567'],
		['0711234567', '+251711234567'],
		['+251 71 123 4567', '+251711234567']
	])('reads %s as %s', (input, expected) => {
		expect(normalizePhone(input)).toBe(expected);
	});

	it.each([
		['landline', '0115512345'],
		['too short', '091123456'],
		['too long', '09112345678'],
		['wrong prefix', '0811234567'],
		['foreign', '+14155551234'],
		['letters', '09112345ab'],
		['empty', ''],
		['null', null],
		['undefined', undefined]
	])('rejects %s', (_label, input) => {
		expect(normalizePhone(input)).toBeNull();
		expect(isEthiopianPhone(input)).toBe(false);
	});
});

describe('localPhone', () => {
	it('gives the ten-digit local form', () => {
		expect(localPhone('+251911234567')).toBe('0911234567');
		expect(localPhone('7 1123 4567')).toBe('0711234567');
	});

	it('is null for anything normalizePhone rejects', () => {
		expect(localPhone('0115512345')).toBeNull();
	});
});
