import { describe, expect, test, vi } from 'vitest';
import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { CardPacker } from './card-packer';
import { CardPageLayout } from '../sheet-layout';
import { SheetFormatter } from '../sheet-formatter';

describe.concurrent('CardPacker', () => {
	describe.concurrent('packAbilities', () => {
		test('returns nothing when no abilities are passed in', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 3,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 10
			} as CardPageLayout;

			const packer = new CardPacker(layout);
			const pages = packer.packAbilities([]);
			expect(pages.length).toBe(0);
		});
	});

	describe.concurrent('packAbilityGroups', () => {
		test('places groups on the page in order', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 2,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 10
			} as CardPageLayout;
			const sheet = {} as AbilitySheet;

			const packer = new CardPacker(layout);
			const groups = [
				[ sheet ],
				[ sheet ],
				[ sheet ],
				[ sheet ]
			];

			SheetFormatter.calculateAbilitySize = vi.fn()
				.mockReturnValueOnce(10)
				.mockReturnValueOnce(15)
				.mockReturnValueOnce(20)
				.mockReturnValueOnce(10);

			const pages = packer.packAbilityGroups(groups);

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

			const packer = new CardPacker(layout);
			const groups = [
				[ sheet, sheet, sheet ], // 10, 15, 20
				[ sheet, sheet, sheet ] // 10, 10, 10
			];

			SheetFormatter.calculateAbilitySize = vi.fn()
				.mockReturnValueOnce(10)
				.mockReturnValueOnce(15)
				.mockReturnValueOnce(20)
				.mockReturnValue(10);

			const pages = packer.packAbilityGroups(groups);

			expect(pages.length).toBe(2);
			// Should be:
			// | 20 15 10 |
			// |       10 |
			//   --------
			// | 10 10    |
			expect(pages[0].getAllCells().length).toBe(4);
			expect(pages[1].getAllCells().length).toBe(2);
		});
	});
});
