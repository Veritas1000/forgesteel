import { CardLayoutStrategyFactory, ClassicLayoutStrategy, DenseLayoutStrategy } from './layout-strategy';
import { CardPageLayout, ExtraCards, FillerCard } from '../sheet-layout';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { JSX } from 'react/jsx-runtime';
import { Options } from '@/models/options';
import { SheetFormatter } from '../sheet-formatter';

// #region helper methods
const makeFillerCard = (element: unknown, height: number, width: number = 1, shown: boolean = false) => {
	return {
		element: element as JSX.Element,
		height: height,
		width: width,
		shown: shown
	} as FillerCard;
};

const emptyCards = {
	required: [],
	optional: []
} as ExtraCards;
const blankFillStyle = 'blank';

// #endregion

// #region CardLayoutStrategyFactory

describe('CardLayoutStrategyFactory', () => {
	const layout = {
		orientation: 'portrait',
		perRow: 3,
		linesY: 100,
		cardLineLen: 50,
		cardGap: 0
	} as CardPageLayout;

	describe('from', () => {
		test.each([
			[ 'original', ClassicLayoutStrategy ]
		])('returns the correct Strategy for a given packingStrategy', (packingStrategy, expectedClass) => {
			const options = {
				packingStrategy: packingStrategy
			} as Options;

			const result = CardLayoutStrategyFactory.from(options, layout);
			expect(result).toBeInstanceOf(expectedClass);
		});
	});
});

// #endregion

// #region ClassicLayoutStrategy

describe('ClassicLayoutStrategy', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('packAbilities', () => {
		test('returns nothing when no abilities are passed in', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 3,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 10
			} as CardPageLayout;

			const packer = new ClassicLayoutStrategy(layout, blankFillStyle);
			const pages = packer.packAbilities([], emptyCards);
			expect(pages.length).toBe(0);
		});

		test('adds required cards to unfilled pages even in "blank" fill style', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 3,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 0
			} as CardPageLayout;
			const req1 = makeFillerCard('r1', 10);
			const extraCards = {
				required: [ req1 ],
				optional: []
			} as ExtraCards;

			SheetFormatter.calculateAbilitySize = vi.fn()
				.mockReturnValue(10);

			const sheet = {} as AbilitySheet;
			const abilities = [ sheet, sheet, sheet, sheet ];

			const packer = new ClassicLayoutStrategy(layout, blankFillStyle);
			const pages = packer.packAbilities(abilities, extraCards);
			expect(pages.length).toBe(1);
			expect(pages[0].getCells().length).toBe(5);
		});
	});
});

// #endregion

// #region DenseLayoutStrategy

describe('DenseLayoutStrategy', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('packAbilities', () => {
		test('returns nothing when no abilities are passed in', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 3,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 10
			} as CardPageLayout;

			const packer = new ClassicLayoutStrategy(layout, blankFillStyle);
			const pages = packer.packAbilities([], emptyCards);
			expect(pages.length).toBe(0);
		});

		test('places groups on the page in order', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 2,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 10
			} as CardPageLayout;

			const sheet = {} as AbilitySheet;
			const abilities = [ sheet, sheet, sheet, sheet ];

			const groups = [
				[ sheet ],
				[ sheet ],
				[ sheet ],
				[ sheet ]
			];

			SheetFormatter.sortAndGroupAbilities = vi.fn()
				.mockReturnValue(groups);

			SheetFormatter.calculateAbilitySize = vi.fn()
				.mockReturnValueOnce(10)
				.mockReturnValueOnce(15)
				.mockReturnValueOnce(20)
				.mockReturnValueOnce(10);

			const packer = new DenseLayoutStrategy(layout, blankFillStyle);
			const pages = packer.packAbilities(abilities, emptyCards);

			expect(pages.length).toBe(1);
		});

		test('does not duplicate cells across pages when a group is split across pages', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 3,
				linesY: 20,
				cardLineLen: 50,
				cardGap: 0
			} as CardPageLayout;

			const sheet = {} as AbilitySheet;
			const abilities = [
				sheet,
				sheet,
				sheet,
				sheet,
				sheet,
				sheet
			];

			const groups = [
				[ sheet, sheet, sheet ], // 10, 15, 20
				[ sheet, sheet, sheet ] // 10, 10, 10
			];

			SheetFormatter.sortAndGroupAbilities = vi.fn()
				.mockReturnValue(groups);

			SheetFormatter.calculateAbilitySize = vi.fn()
				.mockReturnValueOnce(10)
				.mockReturnValueOnce(15)
				.mockReturnValueOnce(20)
				.mockReturnValue(10);

			const packer = new DenseLayoutStrategy(layout, blankFillStyle);
			const pages = packer.packAbilities(abilities, emptyCards);

			expect(pages.length).toBe(2);
			// Should be:
			// | 20 15 10 |
			// |       10 |
			//   --------
			// | 10 10    |
			expect(pages[0].getCells().length).toBe(4);
			expect(pages[1].getCells().length).toBe(2);
		});
	});
});

// #endregion
