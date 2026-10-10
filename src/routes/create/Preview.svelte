<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { toast } from 'svelte-sonner';
	import Printer from '@lucide/svelte/icons/printer';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Phone from '@lucide/svelte/icons/phone';
	import HeartPulse from '@lucide/svelte/icons/heart-pulse';
	import Trash from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';

	import { KIT_STYLES, useKitLook } from '$lib/kitStyle';
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageSection from '$lib/components/PageSection.svelte';
	import Notice from '$lib/components/Notice.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import SingleTable from '$lib/components/SingleTable.svelte';
	import Section from '$lib/components/Section.svelte';
	import Empty from '$lib/components/Empty.svelte';
	import StatCard from '$lib/components/reports/StatCard.svelte';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import Statuses from '$lib/components/Table/statuses.svelte';
	import type { Stat } from '$lib/components/reports/types';

	const look = useKitLook();
	const info = $derived(KIT_STYLES[look.style]);

	const stats: Stat[] = [
		{
			key: 'revenue',
			label: 'Paid this month',
			value: 184250,
			format: 'money',
			group: 'money',
			tone: 'positive',
			hint: '212 invoices'
		},
		{
			key: 'visits',
			label: 'Visits today',
			value: 37,
			format: 'count',
			group: 'visits',
			tone: 'neutral',
			hint: '9 still waiting'
		},
		{
			key: 'overdue',
			label: 'Overdue',
			value: 23600,
			format: 'money',
			group: 'money',
			tone: 'warning',
			hint: '14 invoices past 30 days'
		},
		{
			key: 'noshow',
			label: 'No-shows',
			value: 6.4,
			format: 'percent',
			group: 'visits',
			tone: 'negative',
			hint: 'Up from 4.1% last month'
		}
	];

	const patient = [
		{ name: 'Full name', value: 'Hanna Tesfaye Bekele' },
		{ name: 'Phone', value: '0911 234 567', kind: 'phone' as const },
		{ name: 'Email', value: 'hanna.tesfaye@example.com', href: 'mailto:hanna.tesfaye@example.com' },
		{ name: 'Status', value: 'active', kind: 'status' as const, label: 'Active' },
		{ name: 'Date of birth', value: '12 Meskerem 1985' },
		{ name: 'Address', value: 'Bole Sub-city, Woreda 03, House 1124, near Edna Mall', long: 24 },
		{ name: 'Insurance', value: 'Nyala Insurance — 80% cover' },
		{ name: 'Referred by', value: 'Dr. Dawit Alemu' }
	];

	type Invoice = { number: string; patient: string; amount: number; status: string; date: string };
	const names = [
		'Abebe Kebede',
		'Kidist Haile',
		'Marta Girma',
		'Samuel Tadesse',
		'Selam Worku',
		'Yonas Desta',
		'Liya Mekonnen',
		'Biruk Assefa',
		'Meron Fikru',
		'Henok Taye',
		'Ruth Lemma',
		'Dawit Alemu'
	];
	const statuses = [
		'paid',
		'pending',
		'overdue',
		'paid',
		'draft',
		'paid',
		'cancelled',
		'sent',
		'paid',
		'pending',
		'paid',
		'overdue'
	];
	const invoices: Invoice[] = names.map((patient, i) => ({
		number: `INV-${String(2041 + i).padStart(5, '0')}`,
		patient,
		amount: 850 + ((i * 1371) % 9400),
		status: statuses[i],
		date: `2026-10-${String(10 - (i % 9)).padStart(2, '0')}`
	}));
	const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 });
	const columns: ColumnDef<Invoice, unknown>[] = [
		{ accessorKey: 'number', header: 'Invoice' },
		{ accessorKey: 'patient', header: 'Patient' },
		{ accessorKey: 'date', header: 'Date' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => renderComponent(Statuses, { status: row.original.status })
		},
		{
			accessorKey: 'amount',
			header: 'Amount',
			meta: { align: 'right' },
			cell: ({ row }) => `ETB ${money.format(row.original.amount)}`
		}
	];

	const ALL_STATUSES = [
		'paid',
		'pending',
		'preparing',
		'overdue',
		'draft',
		'quoted',
		'paid_unfulfillable'
	];

	let department = $state('clinical');
	const departments = [
		{ value: 'reception', label: 'Reception' },
		{ value: 'clinical', label: 'Clinical' },
		{ value: 'laboratory', label: 'Laboratory' },
		{ value: 'pharmacy', label: 'Pharmacy' }
	];
</script>

<div class="flex flex-col gap-10">
	<!-- Where this style fits -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg">{info.label} — where it fits</Card.Title>
			<Card.Description>{info.tagline}</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-6 md:grid-cols-[1fr_1fr_14rem]">
			<div>
				<div class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Use it for
				</div>
				<ul class="flex flex-col gap-1.5 text-sm">
					{#each info.bestFor as line (line)}
						<li class="flex gap-2">
							<Check class="mt-0.5 size-4 shrink-0 text-emerald-600" />{line}
						</li>
					{/each}
				</ul>
			</div>
			<div>
				<div class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Not for
				</div>
				<ul class="flex flex-col gap-1.5 text-sm">
					{#each info.avoidFor as line (line)}
						<li class="flex gap-2"><X class="mt-0.5 size-4 shrink-0 text-rose-600" />{line}</li>
					{/each}
				</ul>
			</div>
			<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
				<dt class="text-muted-foreground">Fonts</dt>
				<dd>{info.fonts}</dd>
				<dt class="text-muted-foreground">Radius</dt>
				<dd>{info.radius}</dd>
				<dt class="text-muted-foreground">Buttons</dt>
				<dd>{info.buttons}</dd>
				<dt class="text-muted-foreground">Density</dt>
				<dd class="capitalize">{info.density}</dd>
			</dl>
		</Card.Content>
	</Card.Root>

	<PageHeader
		tabTitle="Create · admin-kit"
		eyebrow="Patient"
		title="Hanna Tesfaye"
		description="Registered 3 years ago at the Bole branch. Next appointment: Thursday, 10:30."
	>
		{#snippet badges()}<Statuses status="active" label="Active" />{/snippet}
		{#snippet actions()}
			<Button variant="outline"><Printer />Print</Button>
			<Button onclick={() => toast.success('Saved', { description: 'The patient was updated.' })}>
				<Pencil />Edit patient
			</Button>
		{/snippet}
	</PageHeader>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each stats as stat (stat.key)}
			<StatCard {stat} amharicMoney={false} />
		{/each}
	</div>

	<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
		<SingleView title="Hanna Tesfaye Bekele" class="lg:w-full! lg:min-w-0!">
			<SingleTable singleTable={patient} />
		</SingleView>

		<div class="flex flex-col gap-4">
			<Section title="Emergency contact" IconComp={Phone} style="identityIcon">
				<div class="flex flex-col gap-1 text-sm">
					<span class="font-medium">Tesfaye Bekele (father)</span>
					<span class="text-muted-foreground">0922 456 789</span>
				</div>
			</Section>
			<Section title="Allergies" IconComp={HeartPulse} style="personalIcon">
				<div class="flex flex-wrap gap-2">
					<Badge variant="outline">Penicillin</Badge>
					<Badge variant="outline">Latex</Badge>
					<Badge variant="secondary">Peanuts</Badge>
				</div>
			</Section>
			<Notice tone="warning" title="Balance due.">
				ETB 2,400.00 from the visit on 28 Meskerem is unpaid.
			</Notice>
		</div>
	</div>

	<PageSection title="Invoices" hint="Every invoice issued to patients this month.">
		{#snippet actions()}
			<Button size="sm" variant="outline">Export</Button>
			<Button size="sm"><Plus />New invoice</Button>
		{/snippet}
		<DataTable data={invoices} {columns} defaultPageSize={8} fileName="invoices" />
	</PageSection>

	<div class="grid items-start gap-6 lg:grid-cols-2">
		<PageSection title="Form controls" hint="Inputs, selects and buttons at every size.">
			<Card.Root>
				<Card.Content class="flex flex-col gap-5">
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-2">
							<Label for="first">First name</Label>
							<Input id="first" value="Hanna" />
						</div>
						<div class="flex flex-col gap-2">
							<Label for="phone">Phone</Label>
							<Input id="phone" placeholder="09…" />
						</div>
						<div class="flex flex-col gap-2">
							<Label>Department</Label>
							<Select.Root type="single" bind:value={department}>
								<Select.Trigger class="w-full">
									{departments.find((d) => d.value === department)?.label}
								</Select.Trigger>
								<Select.Content>
									{#each departments as d (d.value)}
										<Select.Item value={d.value} label={d.label}>{d.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div class="flex flex-col gap-2">
							<Label for="invalid">Card number</Label>
							<Input id="invalid" value="1234" aria-invalid="true" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="notes">Notes</Label>
						<Textarea id="notes" placeholder="Anything the next nurse should know" />
					</div>
					<div class="flex flex-wrap items-center gap-6">
						<div class="flex items-center gap-2">
							<Switch id="sms" checked />
							<Label for="sms">SMS reminders</Label>
						</div>
						<div class="flex items-center gap-2">
							<Checkbox id="consent" checked />
							<Label for="consent">Consent on file</Label>
						</div>
					</div>
				</Card.Content>
				<Card.Footer class="flex flex-wrap gap-2 border-t">
					<Button>Save</Button>
					<Button variant="secondary">Save draft</Button>
					<Button variant="outline">Cancel</Button>
					<Button variant="ghost">Reset</Button>
					<Button variant="link">Help</Button>
				</Card.Footer>
			</Card.Root>
		</PageSection>

		<PageSection title="Buttons, badges and messages">
			<Card.Root>
				<Card.Content class="flex flex-col gap-5">
					<div class="flex flex-wrap items-center gap-2">
						<Button size="sm">Small</Button>
						<Button>Default</Button>
						<Button size="lg">Large</Button>
						<Button size="icon" variant="outline" aria-label="Add"><Plus /></Button>
						<Button variant="destructive"><Trash />Delete</Button>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<Badge>Default</Badge>
						<Badge variant="secondary">Secondary</Badge>
						<Badge variant="outline">Outline</Badge>
						<Badge variant="destructive">Destructive</Badge>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						{#each ALL_STATUSES as status (status)}
							<Statuses {status} label={status.replaceAll('_', ' ')} />
						{/each}
					</div>
					<Tabs.Root value="week">
						<Tabs.List>
							<Tabs.Trigger value="day">Day</Tabs.Trigger>
							<Tabs.Trigger value="week">Week</Tabs.Trigger>
							<Tabs.Trigger value="month">Month</Tabs.Trigger>
						</Tabs.List>
					</Tabs.Root>
					<Notice tone="info">Lab results arrive by SMS within two working days.</Notice>
					<Notice tone="success" title="Synced.">All 37 visits are in the ledger.</Notice>
					<Notice tone="danger" title="Refused."
						>You do not have permission to void invoices.</Notice
					>
					<Dialog.Root>
						<Dialog.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>Open a dialog</Button>
							{/snippet}
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Void invoice INV-02044?</Dialog.Title>
								<Dialog.Description>
									The invoice stays in the ledger, marked void. This cannot be undone.
								</Dialog.Description>
							</Dialog.Header>
							<Dialog.Footer>
								<Dialog.Close>
									{#snippet child({ props })}
										<Button variant="outline" {...props}>Keep it</Button>
									{/snippet}
								</Dialog.Close>
								<Button variant="destructive">Void invoice</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</Card.Content>
			</Card.Root>
		</PageSection>
	</div>

	<PageSection title="Empty state">
		<Empty title="patient" />
	</PageSection>
</div>
