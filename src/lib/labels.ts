import { getContext, setContext } from 'svelte';

/**
 * Every word the kit's components put on screen, so an app can show them in its own language.
 *
 * The defaults are the English the kit has always rendered, so an app that never calls
 * `setKitLabels` sees no change. An app with a second language calls it once, in its root
 * `+layout.svelte`, with whichever labels it translates — any it leaves out stay English:
 *
 *     setKitLabels(() => ({ tableColumns: m.kit_table_columns(), … }));
 *
 * **A function, read at render.** Called while a component renders, it reads the viewer's
 * language at that moment, which is what a per-request locale on the server needs. And **Svelte
 * context, not module state**, for the reason `context.ts` gives: a module is shared by every
 * request the server handles, so a label set in one would be shown to the next viewer.
 *
 * Labels that take values are functions: `tablePage(3, 10)` → "Page 3 of 10".
 */
export type KitLabels = {
	// ── Data table ────────────────────────────────────────────────────────────
	tableSearch: string;
	tableSearchServer: string;
	tableColumns: string;
	tableClear: (count: number) => string;
	tableCharts: string;
	tableResults: (count: string) => string;
	tableEmpty: string;
	tablePrint: string;
	tableExportCsv: string;
	/** The line under the title of a printed table. */
	tablePrinted: (when: string, rows: number) => string;
	pagerNoRows: string;
	pagerRange: (first: string, last: string, total: string) => string;
	pagerRowsPerPage: string;
	pagerPage: (page: string, pages: string) => string;
	pagerPrevious: string;
	pagerNext: string;
	facetFilterBy: (label: string) => string;
	facetFilterPlaceholder: (label: string) => string;
	facetNoValues: string;
	facetClear: (label: string) => string;
	facetSummary: (rows: string, values: number) => string;
	dateToday: string;
	dateLast7: string;
	dateLast30: string;
	dateLast90: string;
	dateLast12Months: string;
	dateClear: string;
	dateApply: string;
	dateClearAria: (label: string) => string;
	chartType: string;
	chartBar: string;
	chartPie: string;
	chartDoughnut: string;
	chartLine: string;
	chartPolarArea: string;
	chartRadar: string;
	chartBreakdown: (label: string) => string;
	chartFilteredBy: string;
	goTo: (name: string) => string;
	expired: (date: string) => string;
	daysLeft: (days: number, date: string) => string;
	noExpiry: string;
	// ── Address cell ──────────────────────────────────────────────────────────
	addressDetails: string;
	addressNone: string;
	addressMap: string;
	addressSubcity: string;
	addressStreet: string;
	addressKebele: string;
	addressBuilding: string;
	addressFloor: string;
	addressHouse: string;
	// ── Lookup screens and deleting ───────────────────────────────────────────
	lookupAdd: (entity: string) => string;
	lookupAddNewTitle: (entity: string) => string;
	lookupAddTitle: (entity: string) => string;
	lookupAdding: (entity: string) => string;
	lookupEdit: string;
	lookupEditTitle: (title: string) => string;
	lookupSaveChanges: string;
	lookupSavingChanges: string;
	lookupActive: string;
	lookupInactive: string;
	deleteTitle: (entity: string) => string;
	deleteAria: (entity: string, name: string) => string;
	deleteQuestion: (entity: string) => string;
	/** Follows the record's name, which is shown in bold before it. */
	deleteNamedWarning: string;
	deleteWarning: (entity: string) => string;
	deleteButton: (entity: string) => string;
	deleting: (entity: string) => string;
	cancel: string;
	keepIt: string;
	// ── Reports ───────────────────────────────────────────────────────────────
	reportShowChart: string;
	reportShowTable: string;
	reportEmpty: string;
	reportChartAria: (title: string) => string;
	statHours: (value: string) => string;
	statYears: (value: string) => string;
	statDays: (value: string) => string;
	// ── Shell ─────────────────────────────────────────────────────────────────
	searchTitle: string;
	searchButton: string;
	searchPlaceholder: string;
	searchEmpty: string;
	searchSuggestions: string;
	themeToggle: string;
	themeLight: string;
	themeDark: string;
	themeSystem: string;
	toggleSidebar: string;
	sidebar: string;
	sidebarDescription: string;
	close: string;
	// ── Pages and views ───────────────────────────────────────────────────────
	print: string;
	tel: (phone: string) => string;
	loading: string;
	loadingNamed: (name: string) => string;
	detail: string;
	value: string;
	notFound: (title: string) => string;
	copy: (text: string) => string;
	copied: string;
	copyFailed: string;
	// ── Forms ─────────────────────────────────────────────────────────────────
	fixTheFollowing: string;
	select: (what: string) => string;
	searchFor: (what: string) => string;
	noneFound: (what: string) => string;
	selectAll: string;
	ethiopianDate: string;
	/** On a shortened text: what clicking it does (for screen readers and the tooltip). */
	bigTextShowAll: string;
	// ── Calendars (date inputs) ─────────────────────────────────────────────────
	/** The interface's locale for Gregorian dates, e.g. `en-GB`, `am-ET`. */
	dateLocale: string;
	calendarEthiopian: string;
	calendarGregorian: string;
	/** On the switch: "E.C." / "G.C.". */
	calendarEthiopianShort: string;
	calendarGregorianShort: string;
	calendarSwitch: string;
	dateDay: string;
	dateMonth: string;
	dateYear: string;
	dateNoSuchDay: string;
	dateOutOfRange: string;
	/** The date on the other calendar, under the one being entered. */
	dateSameAs: (date: string, calendar: string) => string;
	dateTomorrow: string;
	dateIn3Days: string;
	dateInAWeek: string;
	dateIn2Weeks: string;
	dateStart: string;
	dateEnd: string;
	pickADate: string;
	notSet: string;
	clear: string;
	filter: string;
	to: string;
	todayOnly: string;
	clearAll: string;
	datesSelected: (count: number) => string;
	selectDates: string;
	noDatesSelected: string;
	selectMonthYear: string;
	saveChanges: string;
	showPassword: string;
	hidePassword: string;
	saving: string;
	uploadPrompt: string;
	uploadDropHere: string;
	uploadOptimizing: string;
	uploadHint: string;
	uploadOptimized: string;
	preview: string;
	riskConfirm: string;
	riskCheckFirst: string;
	leaveUnsaved: string;
	// ── Password generator ────────────────────────────────────────────────────
	pwTitle: string;
	pwHeading: string;
	pwDescription: string;
	pwGenerated: string;
	pwStrength: string;
	pwWeak: string;
	pwFair: string;
	pwGood: string;
	pwStrong: string;
	pwLength: string;
	pwCharacterTypes: string;
	pwPickOne: string;
	pwUppercase: string;
	pwLowercase: string;
	pwNumbers: string;
	pwSymbols: string;
	pwGenerateNew: string;
	pwGenerating: string;
	pwGenerateFirst: string;
	pwCopied: string;
	pwCopyFailed: string;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const englishLabels: KitLabels = {
	tableSearch: 'Search Table...',
	tableSearchServer: 'Search all rows…',
	tableColumns: 'Columns',
	tableClear: (count) => `Clear ${count}`,
	tableCharts: 'Charts',
	tableResults: (count) => `${count} Results`,
	tableEmpty: 'Nothing found here.',
	tablePrint: 'Print',
	tableExportCsv: 'Export to CSV',
	tablePrinted: (when, rows) => `Printed ${when} · ${rows} rows`,
	pagerNoRows: 'No rows',
	pagerRange: (first, last, total) => `${first}–${last} of ${total}`,
	pagerRowsPerPage: 'Rows per page',
	pagerPage: (page, pages) => `Page ${page} of ${pages}`,
	pagerPrevious: 'Previous page',
	pagerNext: 'Next page',
	facetFilterBy: (label) => `Filter by ${label}`,
	facetFilterPlaceholder: (label) => `Filter ${label.toLowerCase()}…`,
	facetNoValues: 'No values.',
	facetClear: (label) => `Clear ${label.toLowerCase()}`,
	facetSummary: (rows, values) =>
		`${rows} rows across ${values} ${plural(values, 'value', 'values')}`,
	dateToday: 'Today',
	dateLast7: 'Last 7 days',
	dateLast30: 'Last 30 days',
	dateLast90: 'Last 90 days',
	dateLast12Months: 'Last 12 months',
	dateClear: 'Clear',
	dateApply: 'Apply',
	dateClearAria: (label) => `Clear ${label} dates`,
	chartType: 'Chart type',
	chartBar: 'Bar',
	chartPie: 'Pie',
	chartDoughnut: 'Doughnut',
	chartLine: 'Line',
	chartPolarArea: 'Polar area',
	chartRadar: 'Radar',
	chartBreakdown: (label) => `${label} breakdown`,
	chartFilteredBy: 'Filtered by',
	goTo: (name) => `Goto ${name}`,
	expired: (date) => `Expired ${date}`,
	daysLeft: (days, date) => `${days} days left · ${date}`,
	noExpiry: 'No expiry recorded',

	addressDetails: 'Address Details',
	addressNone: 'No address information available',
	addressMap: 'Google Map',
	addressSubcity: 'Subcity',
	addressStreet: 'Street',
	addressKebele: 'Kebele',
	addressBuilding: 'Building Number',
	addressFloor: 'Floor',
	addressHouse: 'House Number or Office Number',

	lookupAdd: (entity) => `Add ${entity}`,
	lookupAddNewTitle: (entity) => `+ Add New ${entity}`,
	lookupAddTitle: (entity) => `+ Add ${entity}`,
	lookupAdding: (entity) => `Adding ${entity}`,
	lookupEdit: 'Edit',
	lookupEditTitle: (title) => `Edit ${title}`,
	lookupSaveChanges: 'Save Changes',
	lookupSavingChanges: 'Saving Changes',
	lookupActive: 'Active',
	lookupInactive: 'Inactive',
	deleteTitle: (entity) => `Delete ${entity}`,
	deleteAria: (entity, name) => `Delete ${entity}${name ? ` ${name}` : ''}`,
	deleteQuestion: (entity) => `Delete this ${entity.toLowerCase()}?`,
	deleteNamedWarning: 'will be removed from every page in the system.',
	deleteWarning: (entity) =>
		`This ${entity.toLowerCase()} will be removed from every page in the system.`,
	deleteButton: (entity) => `Delete ${entity}`,
	deleting: (entity) => `Deleting ${entity}`,
	cancel: 'Cancel',
	keepIt: 'Keep it',

	reportShowChart: 'Show chart',
	reportShowTable: 'Show values as a table',
	reportEmpty: 'Nothing recorded for this filter',
	reportChartAria: (title) => `${title} — chart`,
	statHours: (value) => `${value} h`,
	statYears: (value) => `${value} yr`,
	statDays: (value) => `${value} d`,

	searchTitle: 'Search the Whole Site',
	searchButton: 'Search for Pages',
	searchPlaceholder: 'Type a command or search...',
	searchEmpty: 'No results found.',
	searchSuggestions: 'Suggestions',
	themeToggle: 'Toggle theme',
	themeLight: 'Light',
	themeDark: 'Dark',
	themeSystem: 'System',
	toggleSidebar: 'Toggle Sidebar',
	sidebar: 'Sidebar',
	sidebarDescription: 'Displays the mobile sidebar.',
	close: 'Close',

	print: 'Print',
	tel: (phone) => `Tel. ${phone}`,
	loading: 'Loading',
	loadingNamed: (name) => `Loading ${name}...`,
	detail: 'Detail',
	value: 'Value',
	notFound: (title) => `No ${title} with this id, It has been deleted or it has never existed.`,
	copy: (text) => `Copy ${text}`,
	copied: 'Copied!',
	copyFailed: 'Failed to copy!',

	fixTheFollowing: 'Please fix the following',
	select: (what) => `Select ${what}`,
	searchFor: (what) => `Search ${what}...`,
	noneFound: (what) => `No ${what} found.`,
	selectAll: 'Select All',
	ethiopianDate: 'Ethiopian Date:',
	bigTextShowAll: 'Show all',
	dateLocale: 'en-GB',
	calendarEthiopian: 'Ethiopian calendar',
	calendarGregorian: 'Gregorian calendar',
	calendarEthiopianShort: 'E.C.',
	calendarGregorianShort: 'G.C.',
	calendarSwitch: 'Calendar',
	dateDay: 'Day',
	dateMonth: 'Month',
	dateYear: 'Year',
	dateNoSuchDay: 'There is no such day in that month.',
	dateOutOfRange: 'That date cannot be chosen here.',
	dateSameAs: (date, calendar) => `${date} (${calendar})`,
	dateTomorrow: 'Tomorrow',
	dateIn3Days: 'In 3 days',
	dateInAWeek: 'In a week',
	dateIn2Weeks: 'In 2 weeks',
	dateStart: 'Start date',
	dateEnd: 'End date',
	pickADate: 'Pick a date',
	notSet: 'Not set',
	clear: 'Clear',
	filter: 'Filter',
	to: 'to',
	todayOnly: 'Today Only',
	clearAll: 'Clear All',
	datesSelected: (count) => `${count} dates selected`,
	selectDates: 'Select dates',
	noDatesSelected: 'No dates selected',
	selectMonthYear: 'Select month and year',
	saveChanges: 'Save changes',
	showPassword: 'Show password',
	hidePassword: 'Hide password',
	saving: 'Saving',
	uploadPrompt: 'Click to upload or drag and drop',
	uploadDropHere: 'Drop it here!',
	uploadOptimizing: 'Optimizing file...',
	uploadHint: 'PDF or Images (Max 10MB)',
	uploadOptimized: '(Optimized)',
	preview: 'Preview',
	riskConfirm: 'I understand the risks',
	riskCheckFirst: 'Check this before you continue',
	leaveUnsaved: 'Do you want to leave?\nChanges you made may not be saved.',

	pwTitle: 'Generate Password',
	pwHeading: 'Password Generator',
	pwDescription: 'Create a secure, random password',
	pwGenerated: 'Generated Password',
	pwStrength: 'Password Strength',
	pwWeak: 'Weak',
	pwFair: 'Fair',
	pwGood: 'Good',
	pwStrong: 'Strong',
	pwLength: 'Password Length',
	pwCharacterTypes: 'Character Types',
	pwPickOne: 'You must select at least one character type',
	pwUppercase: 'Uppercase (A-Z)',
	pwLowercase: 'Lowercase (a-z)',
	pwNumbers: 'Numbers (0-9)',
	pwSymbols: 'Symbols (!@#)',
	pwGenerateNew: 'Generate New Password',
	pwGenerating: 'Generating Password',
	pwGenerateFirst: 'Generate a password first',
	pwCopied: 'Password copied to clipboard',
	pwCopyFailed: 'Failed to copy password'
};

const KEY = Symbol.for('admin-kit-labels');

type Source = Partial<KitLabels> | (() => Partial<KitLabels>);

/**
 * Sets the labels for every kit component below — call it in the app's root `+layout.svelte`
 * (during component setup), so pages outside the dashboard (sign-in, print sheets) get them too.
 * Pass a function to have them read afresh each time a component renders.
 */
export function setKitLabels(labels: Source) {
	setContext<() => Partial<KitLabels>>(KEY, typeof labels === 'function' ? labels : () => labels);
}

/**
 * The labels, for a kit component to render with. English where the app set none, or when the
 * component is outside any tree that set them.
 *
 * Must be called during component setup, like any Svelte context read. Each property is a getter
 * over the app's source, so a label is read when it is rendered rather than frozen at setup.
 */
export function useLabels(): KitLabels {
	let read: (() => Partial<KitLabels>) | undefined;
	try {
		read = getContext<(() => Partial<KitLabels>) | undefined>(KEY);
	} catch {
		// Outside component setup (a helper called from an event handler): English.
		read = undefined;
	}
	if (!read) return englishLabels;
	const source = read;
	const out = {} as KitLabels;
	for (const key of Object.keys(englishLabels) as (keyof KitLabels)[]) {
		Object.defineProperty(out, key, {
			enumerable: true,
			get: () => source()[key] ?? englishLabels[key]
		});
	}
	return out;
}
