import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	KIT_ACCENT_NAMES,
	KIT_FONT_NAMES,
	KIT_RADIUS_NAMES,
	KIT_STYLES,
	KIT_STYLE_NAMES,
	isKitStyle,
	kitLookAttributes,
	kitLookHtml
} from './kitStyle';

const css = readFileSync(new URL('./styles/kit-styles.css', import.meta.url), 'utf8');

describe('kitLookAttributes', () => {
	it('always names a style, default when none is given', () => {
		expect(kitLookAttributes()).toEqual({ 'data-kit-style': 'default' });
	});

	it('adds only the axes that are set', () => {
		expect(kitLookAttributes({ style: 'soft', accent: 'green', font: undefined })).toEqual({
			'data-kit-style': 'soft',
			'data-kit-accent': 'green'
		});
	});

	it('drops a value outside its list, so only names the CSS knows reach the page', () => {
		expect(
			kitLookAttributes({ style: 'x" onload="' as never, accent: '<script>' as never })
		).toEqual({ 'data-kit-style': 'default' });
	});

	it('writes them for an <html> tag', () => {
		expect(kitLookHtml({ style: 'formal', radius: 'sm', heading: 'serif' })).toBe(
			'data-kit-style="formal" data-kit-radius="sm" data-kit-heading="serif"'
		);
	});
});

describe('isKitStyle', () => {
	it('knows the six styles and nothing else', () => {
		for (const name of KIT_STYLE_NAMES) expect(isKitStyle(name)).toBe(true);
		expect(isKitStyle('vega')).toBe(false);
		expect(isKitStyle(undefined)).toBe(false);
	});
});

describe('kit-styles.css', () => {
	it('has a weightless block on <html> for every style but the default', () => {
		for (const name of KIT_STYLE_NAMES.filter((n) => n !== 'default')) {
			expect(css).toContain(`:where(:root[data-kit-style='${name}']) {`);
		}
	});

	it('never lets a style set a colour', () => {
		const colour =
			/--(background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring|chart-\d|sidebar[a-z-]*|success|warning|info)(-foreground)?:/;
		const styles = css.slice(0, css.indexOf('--- Accents ---'));
		expect(styles).not.toMatch(colour);
	});

	it('gives every rule no weight, so the app’s own CSS always wins', () => {
		const selectors = css
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.split('}')
			.map((block) => block.split('{')[0].trim())
			.filter(Boolean);
		for (const selector of selectors) expect(selector).toMatch(/^:where\(/);
	});

	it('has every accent in light and dark, every radius and every face', () => {
		for (const name of KIT_ACCENT_NAMES) {
			expect(css).toContain(`:where(:root[data-kit-accent='${name}']) {`);
			expect(css).toContain(`:where(:root.dark[data-kit-accent='${name}']) {`);
		}
		for (const name of KIT_RADIUS_NAMES)
			expect(css).toContain(`:where(:root[data-kit-radius='${name}']) {`);
		for (const name of KIT_FONT_NAMES) {
			expect(css).toContain(`:where(:root[data-kit-font='${name}']) {`);
			expect(css).toContain(`:where(:root[data-kit-heading='${name}']) {`);
		}
	});

	it('documents where every style fits', () => {
		for (const name of KIT_STYLE_NAMES) {
			expect(KIT_STYLES[name].bestFor.length).toBeGreaterThan(0);
			expect(KIT_STYLES[name].avoidFor.length).toBeGreaterThan(0);
		}
	});
});
