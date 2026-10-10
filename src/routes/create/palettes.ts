/**
 * Two real apps' palettes, copied from their `layout.css`, so /create can show that every style
 * draws with the app's colours: load one and the whole preview — every style — takes it on.
 * Dev app only; nothing here is packaged.
 */
export const APP_PALETTES = {
	amoria: {
		label: 'Amoria (green and gold)',
		css: `:root {
	--primary: oklch(0.38 0.08 160);
	--primary-foreground: oklch(0.98 0.01 90);
	--ring: oklch(0.55 0.1 160 / 0.5);
	--accent: oklch(0.94 0.04 90);
	--accent-foreground: oklch(0.28 0.05 160);
	--sidebar: oklch(0.24 0.05 160);
	--sidebar-foreground: oklch(0.93 0.02 95);
	--sidebar-primary: oklch(0.8 0.12 85);
	--sidebar-primary-foreground: oklch(0.22 0.05 160);
	--sidebar-accent: oklch(0.31 0.06 160);
	--sidebar-accent-foreground: oklch(0.9 0.1 88);
	--sidebar-border: oklch(1 0 0 / 0.1);
	--sidebar-ring: oklch(0.8 0.12 85 / 0.5);
}

.dark {
	--primary: oklch(0.72 0.11 160);
	--primary-foreground: oklch(0.15 0.03 160);
	--ring: oklch(0.72 0.11 160 / 0.5);
	--accent: oklch(0.3 0.04 160);
	--accent-foreground: oklch(0.9 0.1 88);
	--sidebar: oklch(0.2 0.04 160);
	--sidebar-primary: oklch(0.8 0.12 85);
	--sidebar-accent: oklch(0.28 0.05 160);
}`
	},
	digitalConstruct: {
		label: 'Digital Construct (navy and green)',
		css: `:root {
	--brand-navy: #071046;
	--brand-green: #73c227;
	--brand-green-ink: #3d7a0a;

	--background: #f5f6fa;
	--foreground: #071046;
	--card: #ffffff;
	--card-foreground: #071046;
	--popover: #ffffff;
	--popover-foreground: #071046;

	--primary: #071046;
	--primary-foreground: #ffffff;

	--secondary: #eceef6;
	--secondary-foreground: #071046;
	--muted: #eceef6;
	--muted-foreground: #565c80;
	--accent: #e8f4da;
	--accent-foreground: #071046;

	--border: #dadde9;
	--input: #c9cde0;
	--ring: #5fa81b;

	--chart-1: #2a38a6;
	--chart-2: #5fa81b;

	--sidebar: #ffffff;
	--sidebar-foreground: #121a52;
	--sidebar-primary: #071046;
	--sidebar-primary-foreground: #ffffff;
	--sidebar-accent: #eceef6;
	--sidebar-accent-foreground: #071046;
	--sidebar-border: #dadde9;
	--sidebar-ring: #5fa81b;
}
.dark {
	--brand-green-ink: #8fd64a;

	--background: #040824;
	--foreground: #eceef8;
	--card: #0a1140;
	--card-foreground: #eceef8;
	--popover: #0a1140;
	--popover-foreground: #eceef8;

	--primary: #73c227;
	--primary-foreground: #071046;

	--secondary: #131b57;
	--secondary-foreground: #eceef8;
	--muted: #131b57;
	--muted-foreground: #a6accf;
	--accent: #18226b;
	--accent-foreground: #eceef8;

	--border: rgb(255 255 255 / 0.11);
	--input: rgb(255 255 255 / 0.17);
	--ring: #73c227;

	--chart-1: #7f8cf0;
	--chart-2: #73c227;

	--sidebar: #070d38;
	--sidebar-foreground: #e4e7f6;
	--sidebar-primary: #73c227;
	--sidebar-primary-foreground: #071046;
	--sidebar-accent: #18226b;
	--sidebar-accent-foreground: #eceef8;
	--sidebar-border: rgb(255 255 255 / 0.11);
	--sidebar-ring: #73c227;
}`
	}
} as const;

export type AppPalette = keyof typeof APP_PALETTES;
