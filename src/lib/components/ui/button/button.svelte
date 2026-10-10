<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		/*
		 * Sizes, shape, type and the hover/press motion come from the style's tokens
		 * (`styles/kit-styles.css`), each read here with the class it replaced as its fallback
		 * (`h-9 px-4 rounded-md text-sm font-medium hover:scale-105 shadow-xs`): with no style, or in
		 * a subtree the app restyles, it is that class.
		 */
		base: "hover:scale-(--kit-button-hover-scale,1.05) active:translate-x-(--kit-press,0px) active:translate-y-(--kit-press,0px) duration-300 ease-in-out transition-transform focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-(--kit-button-radius,var(--kit-control-radius,calc(var(--radius)-2px))) border-(length:--kit-button-border,0px) border-(color:--kit-frame,var(--border)) font-(family-name:--kit-button-font) text-(length:--kit-button-text,0.875rem) leading-[calc(1.25/0.875)] font-(--kit-button-weight,500) tracking-(--kit-button-tracking) [text-transform:var(--kit-button-transform)] outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05)) active:shadow-(--kit-control-shadow-active,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) hover:bg-primary/90',
				destructive:
					'bg-destructive shadow-(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05)) active:shadow-(--kit-control-shadow-active,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white',
				outline:
					'bg-background shadow-(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05)) active:shadow-(--kit-control-shadow-active,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border-(length:--kit-control-border,1px)',
				secondary:
					'bg-secondary text-secondary-foreground shadow-(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05)) active:shadow-(--kit-control-shadow-active,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) hover:bg-secondary/80',
				ghost:
					'border-0 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:translate-0',
				link: 'border-0 text-primary underline-offset-4 hover:underline active:translate-0'
			},
			size: {
				default:
					'h-(--kit-control-h,2.25rem) px-(--kit-control-px,1rem) py-2 has-[>svg]:px-[calc(var(--kit-control-px,1rem)*0.75)]',
				sm: 'h-(--kit-control-h-sm,2rem) gap-1.5 px-[calc(var(--kit-control-px,1rem)*0.75)] has-[>svg]:px-[calc(var(--kit-control-px,1rem)*0.625)]',
				lg: 'h-(--kit-control-h-lg,2.5rem) px-[calc(var(--kit-control-px,1rem)*1.5)] has-[>svg]:px-(--kit-control-px,1rem)',
				icon: 'size-(--kit-control-h,2.25rem)'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
