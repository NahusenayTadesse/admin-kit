import { getContext, setContext } from 'svelte';
import type { CalendarKind } from './calendars';

/**
 * Which calendar the date inputs show: the app's default (`setKitCalendar` in the root layout,
 * Ethiopian when it sets none), until a person switches one of them — then every date input on
 * the page follows, and the browser remembers the choice.
 *
 * The one piece of module state in the kit, and deliberately so: it is written only in the
 * browser (a click, or `restore()` from an effect), so on the server it stays empty and every
 * request renders the app's default. It holds a display preference, never data.
 */
const STORAGE_KEY = 'admin-kit.calendar';
const KEY = Symbol.for('admin-kit-calendar');

const shared = $state<{ chosen: CalendarKind | null; restored: boolean }>({
	chosen: null,
	restored: false
});

/** The calendar date inputs start on, for every kit component below. Call in the root layout. */
export function setKitCalendar(kind: CalendarKind) {
	setContext<CalendarKind>(KEY, kind);
}

/** The calendar to show, and a way to switch it. Call during component setup. */
export function useCalendar() {
	let fallback: CalendarKind = 'ethiopian';
	try {
		fallback = getContext<CalendarKind | undefined>(KEY) ?? 'ethiopian';
	} catch {
		// Outside component setup: the default.
	}
	return {
		get kind(): CalendarKind {
			return shared.chosen ?? fallback;
		},
		set(kind: CalendarKind) {
			shared.chosen = kind;
			try {
				localStorage.setItem(STORAGE_KEY, kind);
			} catch {
				// Private browsing or storage off: it still switches, for this page.
			}
		},
		/** The choice this browser remembered. From an `$effect`, so the server render is untouched. */
		restore() {
			if (shared.restored || typeof window === 'undefined') return;
			shared.restored = true;
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored === 'ethiopian' || stored === 'gregorian') shared.chosen = stored;
			} catch {
				// Nothing remembered.
			}
		}
	};
}
