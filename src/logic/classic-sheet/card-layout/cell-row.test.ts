import { describe, expect, test } from 'vitest';
import { Cell } from './cell';
import { CellRow } from './cell-row';

const mockCell = (h: number): Cell<string> => {
	return new Cell<string>('', h);
};

const cell10 = mockCell(10);
const cell15 = mockCell(15);
const cell20 = mockCell(20);
const cell25 = mockCell(25);

describe.concurrent('CellRow', () => {
	describe.concurrent('constructor', () => {
		test('Creates an empty row of the given size', () => {
			const row3 = new CellRow(3, 100);
			expect(row3.stacks.length).toBe(3);

			const row2 = new CellRow(2, 100);
			expect(row2.stacks.length).toBe(2);

			const row5 = new CellRow(5, 100);
			expect(row5.stacks.length).toBe(5);
		});
	});

	describe.concurrent('fits', () => {
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

	describe.concurrent('add', () => {
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

		test('Does not stack a cell if it would increase the current height \
			of the row', () => {
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

		test('prefers adding to existing stack over adding new cell if it \
			would not increase height of row', () => {
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
