import { AbilityCell, CardPacker, CardPage, CellRow, StackedCell } from './card-packer';
import { describe, expect, test } from 'vitest';
import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { CardPageLayout } from './sheet-layout';

const dummyAbility = {} as AbilitySheet;
const mockCell = (h: number): AbilityCell => {
	return new AbilityCell(dummyAbility, h);
};

describe('CardPacker', () => {
	describe('packAbilities', () => {
		test('returns nothing when no abilities are passed in', () => {
			const layout = {
				orientation: 'portrait',
				perRow: 3,
				linesY: 100,
				cardLineLen: 50,
				cardGap: 10
			} as CardPageLayout;

			const pages = CardPacker.packAbilities([], layout);
			expect(pages.length).toBe(0);
		});

		// packs all abilities
	});
});

describe('StackedCell', () => {
	describe('fits', () => {
		test('returns true if the given cell fits in the available space', () => {
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell20 = mockCell(20);

			const stack = new StackedCell(17);
			expect(stack.h).toBe(0);

			expect(stack.fits(cell10)).toBe(true);
			expect(stack.fits(cell15)).toBe(true);
			expect(stack.fits(cell20)).toBe(false);
		});

		test('accounts for existing cells when checking available space', () => {
			const cell10 = mockCell(10);
			const cell5 = mockCell(5);
			const cell25 = mockCell(25);

			const stack = new StackedCell(30);
			expect(stack.h).toBe(0);

			expect(stack.fits(cell10)).toBe(true);
			expect(stack.fits(cell5)).toBe(true);
			expect(stack.fits(cell25)).toBe(true);

			stack.add(cell10);
			expect(stack.h).toBe(10);

			expect(stack.fits(cell10)).toBe(true);
			expect(stack.fits(cell5)).toBe(true);
			expect(stack.fits(cell25)).toBe(false);

			stack.add(cell5);
			stack.add(cell10);
			expect(stack.h).toBe(25);

			expect(stack.fits(cell10)).toBe(false);
			expect(stack.fits(cell5)).toBe(true);
			expect(stack.fits(cell25)).toBe(false);
		});

		test('can accept an alternative fitHeight value to check against', () => {
			const cell10 = mockCell(10);
			const cell5 = mockCell(5);

			const stack = new StackedCell(30);
			stack.add(cell10);
			expect(stack.fits(cell5)).toBe(true);
			expect(stack.fits(cell5, 14)).toBe(false);
			expect(stack.fits(cell5, 15)).toBe(true);
		});
	});

	describe('add', () => {
		test('Adds the height to the current total', () => {
			const cell1 = mockCell(10);
			const cell2 = mockCell(15);
			const cell3 = mockCell(17);

			const stack = new StackedCell(100);
			expect(stack.h).toBe(0);

			stack.add(cell1);
			expect(stack.h).toBe(10);
			stack.add(cell2);
			expect(stack.h).toBe(25);
			stack.add(cell3);
			expect(stack.h).toBe(42);
		});
	});
});

describe('CellRow', () => {
	describe('constructor', () => {
		test('Creates an empty row of the given size', () => {
			const row3 = new CellRow(3, 100);
			expect(row3.stacks.length).toBe(3);

			const row2 = new CellRow(2, 100);
			expect(row2.stacks.length).toBe(2);

			const row5 = new CellRow(5, 100);
			expect(row5.stacks.length).toBe(5);
		});
	});

	describe('fits', () => {
		test('returns if the given cell fits in the row based on maxHeight', () => {
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell20 = mockCell(20);

			const row = new CellRow(5, 17);

			expect(row.fits(cell10)).toBe(true);
			expect(row.fits(cell15)).toBe(true);
			expect(row.fits(cell20)).toBe(false);
		});

		test('returns if the given cell fits in the row based on number of cells', () => {
			const cell10 = mockCell(10);

			const row = new CellRow(2, 10);

			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell10)).toBe(false);
		});

		test('returns true if the cell can fit in any of the row\'s stacks', () => {
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell25 = mockCell(25);

			const row = new CellRow(2, 25);

			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell25)).toBe(true);
			row.add(cell25);

			// [[10],[15]] [[20]]
			expect(row.fits(cell15)).toBe(true);
		});

		test('returns false if stacking the cell would increase the row\'s height', () => {
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell20 = mockCell(20);

			const row = new CellRow(2, 25);

			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell20)).toBe(true);
			row.add(cell20);
			expect(row.fits(cell15)).toBe(false);
		});
	});

	describe('add', () => {
		test('adds a cell and updates the row\'s height', () => {
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell20 = mockCell(20);

			const row = new CellRow(5, 30);
			expect(row.h).toBe(0);

			row.add(cell10);
			expect(row.h).toBe(10);
			row.add(cell15);
			expect(row.h).toBe(15);
			row.add(cell20);
			expect(row.h).toBe(20);
			row.add(cell10);
			expect(row.h).toBe(20);
		});

		test('Throws an Error when trying to add a card beyond what will fit', () => {
			const cell10 = mockCell(10);

			const row = new CellRow(2, 10);

			row.add(cell10);
			row.add(cell10);
			expect(() => row.add(cell10)).toThrow(/Can't add/);
			expect(() => row.add(cell10)).toThrow(/Can't add/);
		});

		test('Creates a stack in a previous cell if applicable', () => {
			// NOTE: ONLY if the resulting stack height is <= the current row height
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell25 = mockCell(25);

			const row = new CellRow(2, 25);

			// [ [10], [] ]
			row.add(cell10);
			// [ [10], [25] ]
			row.add(cell25);

			// [ [10, 15], [25] ]
			row.add(cell15);
			expect(row.stacks[0].h).toBe(25);
			expect(row.stacks[0].contents.length).toBe(2);
			expect(row.stacks[0].contents).toContain(cell10);
			expect(row.stacks[0].contents).toContain(cell15);
			expect(row.stacks[1].h).toBe(25);
			expect(row.stacks[1].contents.length).toBe(1);
			expect(row.stacks[1].contents).toContain(cell25);
		});

		test('Does not stack a cell if it would increase the current height of the row', () => {
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell20 = mockCell(20);

			const row = new CellRow(2, 25);

			// [ [10], [] ]
			row.add(cell10);
			// [ [10], [20] ]
			row.add(cell20);

			// stacking 10 + 15 would increase the row height beyond 20
			// so don't add even though there's space
			expect(() => row.add(cell15)).toThrow(/Can't add/);
		});

		test('prefers adding to existing stack first if it wouldn\'t increase height of row', () => {
			// ONLY most recent?
			const cell10 = mockCell(10);
			const cell15 = mockCell(15);
			const cell25 = mockCell(25);

			const row = new CellRow(3, 25);

			row.add(cell25);
			row.add(cell10);
			row.add(cell15);

			// should be:
			// [ [25] [10 15] ]
			expect(row.stacks[0].h).toBe(25);
			expect(row.stacks[0].contents.length).toBe(1);
			expect(row.stacks[0].contents).toContain(cell25);
			expect(row.stacks[1].h).toBe(25);
			expect(row.stacks[1].contents.length).toBe(2);
			expect(row.stacks[1].contents).toContain(cell10);
			expect(row.stacks[1].contents).toContain(cell15);
		});
	});
});

describe('CardPage', () => {
	describe('constructor', () => {
		test('Creates an initial empty row of the given number of cells', () => {
			const page3 = new CardPage(3, 10);
			expect(page3.rows.length).toBe(1);
			expect(page3.currentRow().stacks.length).toBe(3);

			const page2 = new CardPage(2, 10);
			expect(page2.rows.length).toBe(1);
			expect(page2.currentRow().stacks.length).toBe(2);

			const page5 = new CardPage(5, 10);
			expect(page5.rows.length).toBe(1);
			expect(page5.currentRow().stacks.length).toBe(5);
		});
	});
});
