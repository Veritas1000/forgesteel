import { AbilityCell, CardPacker, CardRowPage, CellRow, StackedCell } from './card-packer';
import { describe, expect, test } from 'vitest';
import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { CardPageLayout } from './sheet-layout';

const dummyAbility = {} as AbilitySheet;
const mockCell = (h: number): AbilityCell => {
	return new AbilityCell(dummyAbility, h);
};

const cell5 = mockCell(5);
const cell10 = mockCell(10);
const cell15 = mockCell(15);
const cell20 = mockCell(20);
const cell25 = mockCell(25);

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

			const packer = new CardPacker(layout);
			const pages = packer.packAbilities([]);
			expect(pages.length).toBe(0);
		});
	});
});

describe('StackedCell', () => {
	describe('fits', () => {
		test('returns true if the given cell fits in the available space', () => {
			const stack = new StackedCell(17, 0);
			expect(stack.h).toBe(0);

			expect(stack.fits(cell10)).toBe(true);
			expect(stack.fits(cell15)).toBe(true);
			expect(stack.fits(cell20)).toBe(false);
		});

		test('accounts for existing cells when checking available space', () => {
			const stack = new StackedCell(30, 0);
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
			const stack = new StackedCell(30, 0);
			stack.add(cell10);
			expect(stack.fits(cell5)).toBe(true);
			expect(stack.fits(cell5, 14)).toBe(false);
			expect(stack.fits(cell5, 15)).toBe(true);
		});
	});

	describe('add', () => {
		test('adds the height to the current total', () => {
			const cell1 = mockCell(10);
			const cell2 = mockCell(15);
			const cell3 = mockCell(17);

			const stack = new StackedCell(100, 0);
			expect(stack.h).toBe(0);

			stack.add(cell1);
			expect(stack.h).toBe(10);
			stack.add(cell2);
			expect(stack.h).toBe(25);
			stack.add(cell3);
			expect(stack.h).toBe(42);
		});

		test('accounts for spacing between cells', () => {
			const cell1 = mockCell(10);
			const cell2 = mockCell(15);
			const cell3 = mockCell(17);

			const stack = new StackedCell(100, 5);
			expect(stack.h).toBe(0);

			stack.add(cell1);
			expect(stack.h).toBe(10);
			stack.add(cell2);
			expect(stack.h).toBe(30); // 10 + 5 + 15
			stack.add(cell3);
			expect(stack.h).toBe(52);
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
			const row = new CellRow(5, 17);

			expect(row.fits(cell10)).toBe(true);
			expect(row.fits(cell15)).toBe(true);
			expect(row.fits(cell20)).toBe(false);
		});

		test('returns if the given cell fits in the row based on number of cells', () => {
			const row = new CellRow(2, 10);

			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell10)).toBe(false);
		});

		test('returns true if the cell can fit in any of the row stacks', () => {
			const row = new CellRow(2, 25);

			expect(row.fits(cell25)).toBe(true);
			row.add(cell25);
			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);

			// [ [25] [10 15] ]
			expect(row.fits(cell15)).toBe(true);
		});

		test('returns false if stacking the cell would increase the row height', () => {
			const row = new CellRow(2, 25);

			expect(row.fits(cell20)).toBe(true);
			row.add(cell20);
			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell15)).toBe(false);
		});

		test('allows small increases to row height due to stacking', () => {
			const cell11 = mockCell(11);

			const row = new CellRow(2, 25);

			expect(row.fits(cell20)).toBe(true);
			row.add(cell20);
			expect(row.fits(cell10)).toBe(true);
			row.add(cell10);
			expect(row.fits(cell11)).toBe(true);
		});

		test('will not stack cards before the current highest card in the row', () => {
			const row = new CellRow(3, 25);

			row.add(cell10);
			row.add(cell25);
			row.add(cell10);
			row.add(cell15);

			// should be:
			// [ [10] [25] [10 15] ]
			expect(row.stacks[0].h).toBe(10);
			expect(row.stacks[0].contents.length).toBe(1);
			expect(row.stacks[0].contents).toContain(cell10);
			expect(row.stacks[1].h).toBe(25);
			expect(row.stacks[1].contents.length).toBe(1);
			expect(row.stacks[1].contents).toContain(cell25);
			expect(row.stacks[2].h).toBe(25);
			expect(row.stacks[2].contents.length).toBe(2);
			expect(row.stacks[2].contents).toContain(cell10);
			expect(row.stacks[2].contents).toContain(cell15);

			// won't add
			expect(row.fits(cell15)).toBe(false);
		});
	});

	describe('add', () => {
		test('adds a cell and updates the row\'s height', () => {
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
			const row = new CellRow(2, 10);

			row.add(cell10);
			row.add(cell10);
			expect(() => row.add(cell10)).toThrow(/Can't add/);
			expect(() => row.add(cell10)).toThrow(/Can't add/);
		});

		test('Creates a stack in a previous cell if applicable', () => {
			// NOTE: ONLY if the resulting stack height is <= the current row height
			const row = new CellRow(2, 25);

			// [ [25] [] ]
			row.add(cell25);
			// [ [25] [10] ]
			row.add(cell10);

			// [ [25] [10 15] ]
			row.add(cell15);
			expect(row.stacks[0].h).toBe(25);
			expect(row.stacks[0].contents.length).toBe(1);
			expect(row.stacks[0].contents).toContain(cell25);
			expect(row.stacks[1].h).toBe(25);
			expect(row.stacks[1].contents.length).toBe(2);
			expect(row.stacks[1].contents).toContain(cell10);
			expect(row.stacks[1].contents).toContain(cell15);
		});

		test('Does not stack a cell if it would increase the current height of the row', () => {
			const row = new CellRow(2, 25);

			// [ [20] [] ]
			row.add(cell20);
			// [ [20] [10] ]
			row.add(cell10);

			// stacking 10 + 15 would increase the row height beyond 20
			// so don't add even though there's space
			expect(() => row.add(cell15)).toThrow(/Can't add/);
		});

		test('allows small increases to row height due to stacking', () => {
			const cell11 = mockCell(11);

			const row = new CellRow(2, 25);

			row.add(cell20);
			row.add(cell10);

			// Can add since it is a small increase (<= 2)
			row.add(cell11);
			expect(row.h).toBe(21);
		});

		test('prefers adding to existing stack over adding new cell if it would not increase height of row', () => {
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

		test('will not stack cards before the current highest card in the row', () => {
			const row = new CellRow(3, 25);

			row.add(cell10);
			row.add(cell25);
			row.add(cell10);
			row.add(cell15);

			// should be:
			// [ [10] [25] [10 15] ]
			expect(row.stacks[0].h).toBe(10);
			expect(row.stacks[0].contents.length).toBe(1);
			expect(row.stacks[0].contents).toContain(cell10);
			expect(row.stacks[1].h).toBe(25);
			expect(row.stacks[1].contents.length).toBe(1);
			expect(row.stacks[1].contents).toContain(cell25);
			expect(row.stacks[2].h).toBe(25);
			expect(row.stacks[2].contents.length).toBe(2);
			expect(row.stacks[2].contents).toContain(cell10);
			expect(row.stacks[2].contents).toContain(cell15);

			// won't add
			expect(() => row.add(cell15)).toThrow(/Can't add/);
		});
	});
});

describe('CardRowPage', () => {
	describe('constructor', () => {
		test('creates an initial empty row of the given number of cells', () => {
			const layout3 = {
				perRow: 3,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page3 = new CardRowPage(layout3);
			expect(page3.rows.length).toBe(1);
			expect(page3.currentRow().stacks.length).toBe(3);

			const layout2 = {
				perRow: 2,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page2 = new CardRowPage(layout2);
			expect(page2.rows.length).toBe(1);
			expect(page2.currentRow().stacks.length).toBe(2);

			const layout5 = {
				perRow: 5,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page5 = new CardRowPage(layout5);
			expect(page5.rows.length).toBe(1);
			expect(page5.currentRow().stacks.length).toBe(5);
		});
	});

	describe('fits', () => {
		test('returns true if the current row can fit the cell', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);

			expect(page.fits(cell10)).toBe(true);
			expect(page.fits(cell15)).toBe(true);
			expect(page.fits(cell25)).toBe(true);
			expect(page.fits(mockCell(55))).toBe(false);

			page.add(cell15);

			expect(page.fits(cell10)).toBe(true);
		});

		test('returns true if a new row can fit the cell', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);
			page.add(cell15);
			page.add(cell10);

			expect(page.fits(cell10)).toBe(true);
			expect(page.fits(cell20)).toBe(true);
			// 15 + 40 > 50
			expect(page.fits(mockCell(40))).toBe(false);
		});
	});

	describe('add', () => {
		test('adds cells to the current row when possible', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);
			page.add(cell15);
			page.add(cell10);

			expect(page.rows.length).toBe(1);
			const row1 = page.rows[0];
			expect(row1.stacks.length).toBe(2);
			expect(row1.stacks[0].contents.length).toBe(1);
			expect(row1.stacks[0].contents[0]).toBe(cell15);
			expect(row1.stacks[1].contents.length).toBe(1);
			expect(row1.stacks[1].contents[0]).toBe(cell10);
		});

		test('starts a new row when necessary', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);
			page.add(cell15);
			page.add(cell10);
			page.add(cell20); // new row
			expect(page.rows.length).toBe(2);
		});

		test('increases the height of the page as cells are added', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);
			page.add(cell15);
			expect(page.h).toBe(15);
			page.add(cell10);
			expect(page.h).toBe(15);
			page.add(cell20); // new row
			expect(page.h).toBe(35);
		});
	});

	describe('getAllCells', () => {
		test('returns all cells from all rows in L->R, T->B (book) order', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);

			page.add(cell15);
			page.add(cell10);
			page.add(cell10);
			page.add(cell15);

			// result should be
			// [ [15] [10] ]
			// [ [10] [15] ]
			const cells = page.getAllCells();
			expect(cells.length).toBe(4);

			expect(cells[0].contents.length).toBe(1);
			expect(cells[0].contents[0]).toBe(cell15);

			expect(cells[1].contents.length).toBe(1);
			expect(cells[1].contents[0]).toBe(cell10);

			expect(cells[2].contents.length).toBe(1);
			expect(cells[2].contents[0]).toBe(cell10);

			expect(cells[3].contents.length).toBe(1);
			expect(cells[3].contents[0]).toBe(cell15);
		});

		test('does not return empty stacks from incomplete rows', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CardRowPage(layout);

			page.add(cell15);
			page.add(cell10);
			page.add(cell10);

			// result should be
			// [ [15] [10] ]
			// [ [10] [] ]
			const cells = page.getAllCells();
			expect(cells.length).toBe(3);

			expect(cells[0].contents.length).toBe(1);
			expect(cells[0].contents[0]).toBe(cell15);

			expect(cells[1].contents.length).toBe(1);
			expect(cells[1].contents[0]).toBe(cell10);

			expect(cells[2].contents.length).toBe(1);
			expect(cells[2].contents[0]).toBe(cell10);
		});
	});
});
