<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarIcon } from '@lucide/svelte';
	import {
		getLocalTimeZone,
		toCalendarDate,
		type CalendarDate,
		type DateValue
	} from '@internationalized/date';
	import { formatDateIn } from './calendars';
	import { useCalendar } from './calendarPreference.svelte';
	import CalendarSwitch from './formComponents/CalendarSwitch.svelte';

	interface Props {
		start?: CalendarDate | null;
		end?: CalendarDate | null;
		link?: string;
		onDateChange?: (dates: { start: CalendarDate; end: CalendarDate }) => void;
	}

	let { start = null, end = null, link = '', onDateChange }: Props = $props();

	let startDate: CalendarDate | undefined = $derived(start ?? undefined);
	let endDate: CalendarDate | undefined = $derived(end ?? undefined);

	const handleStartChange = (value: DateValue | undefined) => {
		if (!value) return;
		startDate = toCalendarDate(value);
		if (endDate) onDateChange?.({ start: startDate, end: endDate });
	};

	const handleEndChange = (value: DateValue | undefined) => {
		if (!value) return;
		endDate = toCalendarDate(value);
		if (startDate) onDateChange?.({ start: startDate, end: endDate });
	};

	const L = useLabels();
	const preference = useCalendar();
	$effect(() => preference.restore());
	const kind = $derived(preference.kind);
	const show = (d: CalendarDate) => formatDateIn(d, kind, L.dateLocale, 'short');
</script>

<div class="flex items-center gap-2">
	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<Button variant="outline" class="min-w-35 justify-start text-left font-normal" {...props}>
					<CalendarIcon class="mr-2 size-4 text-muted-foreground" />
					{startDate ? show(startDate) : L.dateStart}
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="flex w-auto flex-col gap-2 p-2" align="start">
			<CalendarSwitch value={kind} onchange={(k) => preference.set(k)} class="self-start" />
			<Calendar
				calendar={kind}
				locale={L.dateLocale}
				type="single"
				value={startDate}
				onValueChange={handleStartChange}
			/>
		</PopoverContent>
	</Popover>

	<span class="text-sm text-muted-foreground">{L.to}</span>

	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<Button variant="outline" class="min-w-35 justify-start text-left font-normal" {...props}>
					<CalendarIcon class="mr-2 size-4 text-muted-foreground" />
					{endDate ? show(endDate) : L.dateEnd}
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="flex w-auto flex-col gap-2 p-2" align="start">
			<CalendarSwitch value={kind} onchange={(k) => preference.set(k)} class="self-start" />
			<Calendar
				calendar={kind}
				locale={L.dateLocale}
				type="single"
				value={endDate}
				onValueChange={handleEndChange}
			/>
		</PopoverContent>
	</Popover>
</div>
