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
	it('has a block for every style but the default, in light and dark when it recolours', () => {
		for (const name of KIT_STYLE_NAMES.filter((n) => n !== 'default')) {
			expect(css).toContain(`[data-kit-style='${name}'] {`);
		}
		for (const name of ['soft', 'sharp', 'formal', 'bold']) {
			expect(css).toContain(`.dark[data-kit-style='${name}'],`);
		}
	});

	it('has every accent in light and dark, every radius and every face', () => {
		for (const name of KIT_ACCENT_NAMES) {
			expect(css).toContain(`[data-kit-accent='${name}'] {`);
			expect(css).toContain(`.dark [data-kit-accent='${name}'] {`);
		}
		for (const name of KIT_RADIUS_NAMES) expect(css).toContain(`[data-kit-radius='${name}'] {`);
		for (const name of KIT_FONT_NAMES) {
			expect(css).toContain(`[data-kit-font='${name}'] {`);
			expect(css).toContain(`[data-kit-heading='${name}'] {`);
		}
	});

	it('documents where every style fits', () => {
		for (const name of KIT_STYLE_NAMES) {
			expect(KIT_STYLES[name].bestFor.length).toBeGreaterThan(0);
			expect(KIT_STYLES[name].avoidFor.length).toBeGreaterThan(0);
		}
	});
});
