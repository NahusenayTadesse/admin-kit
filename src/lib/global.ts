/**
 * Browser-safe helpers every app reached for: picker option type, a few shared class strings,
 * Ethiopian calendar and birr formatting. Server-only helpers live under `server/` — the date
 * window filter in `server/dates.ts`, the password generator in `server/password.ts` — and file
 * URLs in `$lib/files`.
 */
import { toGregorian } from 'ethiopian-calendar-new';

/** The sidebar's surface. A flat colour: the blue-to-white gradient went with the rebrand. */
export const appSurface = `bg-sidebar text-sidebar-foreground`;
export const selectItem = `hover:bg-gray-100 hover:shadow-md hover:scale-101 duration-300 transition-all ease-in-out dark:hover:bg-gray-900`;

/**
 * One option in a picker — a select, a combobox, a checkbox group.
 *
 * `value` admits `boolean` because thirty call sites pass `{ value: true, name: 'Active' }` for
 * an is-active field. That was always what the app did; the type simply did not say so, and
 * nothing noticed while `InputComp` passed its `items` through untyped.
 */
export type Item = {
	value: string | number | boolean;
	name: string;
};

export function isMobile() {
	if (typeof window === 'undefined') return false; // SSR guard
	return window.innerWidth <= 768;
}

export const formatEthiopianDate = (date: Date | null | undefined): string => {
	// 1. Handle null, undefined, or empty values immediately
	if (!date) return '';

	try {
		// 2. Check if the date is actually valid (prevents "Invalid Date" errors)
		if (isNaN(date.getTime())) {
			return 'No Date Provided';
		}

		const formatter = new Intl.DateTimeFormat('am-ET', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			calendar: 'ethiopic'
		});

		return formatter.format(date);
	} catch {
		// 3. Catch-all for browser compatibility issues or unexpected inputs
		return 'Error Formatting Date';
	}
};
export const formatEthiopianYearMonth = (
	year: number | null | undefined,
	month: number | null | undefined // Strictly 1–12 now
): string => {
	// 1. Basic validation: Ensure we have numbers
	if (year === null || year === undefined || month === null || month === undefined) {
		return '';
	}

	// 2. ERP Rule: Strictly months 1-12 (Skip Pagumē)
	if (month < 1 || month > 12) {
		return 'Invalid Month';
	}

	try {
		// `months` (below) is the one list, and it is the one the schema's `month` enums
		// agree with. This used to keep a second copy here, which drifted: it spelled
		// months 3 and 4 ኅዳር and ታኅሣሥ, so a route built from it matched no stored row.
		const monthName = months[month - 1];

		// Constructs exactly "ግንቦት_2018" with the underscore your routes expect
		const formattedString = `${monthName}_${year}`;

		// Encodes it safely for HTTP Redirect Headers (e.g., %E1%8A%A2...)
		return encodeURIComponent(formattedString);
	} catch {
		return 'Formatting Error';
	}
};

/**
 * A Gregorian `Date` as an Ethiopian year and month.
 *
 * `Intl` with the `ethiopic` calendar does the conversion. The arithmetic is not
 * worth hand-rolling: the Ethiopian new year falls on 11 September, or 12
 * September in the year before a Gregorian leap year, so the offset from the
 * Gregorian year is either 7 or 8 depending on where in the year you are.
 *
 * Callers used to pass `new Date().getFullYear()` and `new Date().getMonth() + 1`
 * straight into `formatEthiopianYearMonth`, which reads its arguments as an
 * Ethiopian year and an Ethiopian month index. Both were wrong: in September 2026
 * that produced `ሰኔ_2026` where the answer is `ነሐሴ_2018`.
 *
 * Pagumē — the five or six day thirteenth month — comes back from `Intl` as month
 * 13, but it is not a period anything here bills or pays against; every `month`
 * enum in the schema stops at ነሐሴ. Those days clamp to month 12 so a page opened
 * during Pagumē lands on the last real month instead of on nothing.
 */
export const getEthiopianYearMonth = (
	date: Date | null | undefined
): { year: number; month: number } | null => {
	if (!date || isNaN(date.getTime())) return null;

	try {
		const parts = new Intl.DateTimeFormat('en-u-ca-ethiopic', {
			year: 'numeric',
			month: 'numeric'
		}).formatToParts(date);

		// The era part ("AM") rides along in the year value in some runtimes, so keep
		// only the digits rather than trusting the whole string to parse.
		const year = Number(parts.find((p) => p.type === 'year')?.value.replace(/\D/g, ''));
		const month = Number(parts.find((p) => p.type === 'month')?.value.replace(/\D/g, ''));

		if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1) return null;

		return { year, month: Math.min(month, 12) };
	} catch {
		return null;
	}
};

/**
 * The `<month>_<year>` segment for the month `date` falls in, ready to drop into a
 * route. This is what the "no range given" redirects want — they land the user on
 * the current period instead of on a month derived from Gregorian numbers.
 *
 * Returns '' if the date cannot be converted, which callers should treat as "do
 * not redirect" rather than pasting an empty segment into a URL.
 */
export const currentEthiopianMonthParam = (date: Date = new Date()): string => {
	const ethiopian = getEthiopianYearMonth(date);
	if (!ethiopian) return '';
	return formatEthiopianYearMonth(ethiopian.year, ethiopian.month);
};

export const formatEthiopianYear = (date: Date | null | undefined): string => {
	if (!date || isNaN(date.getTime())) return '';

	try {
		const formatter = new Intl.DateTimeFormat('am-ET', {
			year: 'numeric',
			calendar: 'ethiopic'
		});

		return formatter.format(date);
	} catch {
		return '';
	}
};

export const getEthiopianYearInt = (date: Date | null | undefined): number | null => {
	if (!date || isNaN(date.getTime())) return null;

	try {
		const formatter = new Intl.DateTimeFormat('en-u-ca-ethiopic', {
			year: 'numeric'
		});

		// Formats to something like "2018 ERA1" or "2018"
		const formatted = formatter.format(date);

		// Extract only the digits
		const yearMatch = formatted.match(/\d+/);
		return yearMatch ? parseInt(yearMatch[0], 10) : null;
	} catch {
		return null;
	}
};
export function formatETB(amount: number | null | undefined, useAmharic: boolean = false): string {
	// Handle null/undefined/NaN amount
	if (amount === null || amount === undefined || isNaN(amount)) {
		return useAmharic ? 'ብር 0.00' : 'ETB 0.00';
	}

	try {
		const locale = useAmharic ? 'am-ET' : 'en-ET';

		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: 'ETB',
			currencyDisplay: 'symbol',
			minimumFractionDigits: 2
		}).format(amount);
	} catch {
		// Fallback if Intl fails
		return `${amount.toFixed(2)} ETB`;
	}
}

export function ethiopianRange(month: number, year: number) {
	if (month === 13) {
		return {
			startDate: toGregorian(year, month, 1),
			endDate: toGregorian(year, month, 5)
		};
	}

	return {
		startDate: toGregorian(year, month, 1),
		endDate: toGregorian(year, month, 30)
	};
}

const months = [
	'መስከረም',
	'ጥቅምት',
	'ህዳር',
	'ታህሳስ',
	'ጥር',
	'የካቲት',
	'መጋቢት',
	'ሚያዝያ',
	'ግንቦት',
	'ሰኔ',
	'ሐምሌ',
	'ነሐሴ'
];

/**
 * Returns the 1-based index of the Ethiopian month.
 * @param {string} monthName - The name of the month in Ethiopic script.
 * @returns {number|string} - The month number or an error message.
 */
export function getMonthNumber(monthName: string): number {
	// .indexOf finds the position (0-11)
	const index = months.indexOf(monthName.trim());

	// If index is -1, the month wasn't found
	if (index === -1) {
		return 0;
	}

	return index + 1;
}
