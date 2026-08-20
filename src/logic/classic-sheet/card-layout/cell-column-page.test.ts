import { describe, expect, test } from 'vitest';
import { CardPageLayout } from '../sheet-layout';
import { Cell } from './cell';
import { CellColumnPage } from './cell-column-page';

const mockCell = (h: number): Cell<string> => {
	return new Cell<string>('', h);
};

const cell5 = mockCell(5);
const cell10 = mockCell(10);
const cell15 = mockCell(15);
const cell20 = mockCell(20);
const cell25 = mockCell(25);

describe.concurrent('CellColumnPage', () => {
	describe.concurrent('constructor', () => {
		test('creates an initial empty set of cells equal to perRow', () => {
			const layout3 = {
				perRow: 3,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page3 = new CellColumnPage(layout3);
			expect(page3.columns.stacks.length).toBe(3);
			expect(page3.columns.stacks[0].contents.length).toBe(0);
			expect(page3.columns.stacks[1].contents.length).toBe(0);
			expect(page3.columns.stacks[2].contents.length).toBe(0);
		});
	});

	describe.concurrent('fits', () => {
		test('returns true if the current page can fit the cell', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			expect(page.fits(cell10)).toBe(true);
			expect(page.fits(cell15)).toBe(true);
			expect(page.fits(cell25)).toBe(true);
			// just based on overall height
			expect(page.fits(mockCell(55))).toBe(false);
		});

		test('returns false if the current page can not fit the cell', () => {
			const layout = {
				perRow: 2,
				linesY: 20,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			page.add(cell10);
			page.add(cell15);
			expect(page.fits(cell10)).toBe(true);
			expect(page.fits(cell15)).toBe(false);
			expect(page.fits(cell25)).toBe(false);

			page.add(cell5);
			expect(page.fits(cell10)).toBe(false);
		});
	});

	describe.concurrent('addGroup', () => {
		test('adds single cell groups to the leftmost stack all else being equal', () => {
			const layout = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);
			page.add(cell15);

			expect(page.columns.stacks[0].contents.length).toBe(1);
			expect(page.columns.stacks[0].contents[0]).toBe(cell15);
			expect(page.columns.stacks[1].contents.length).toBe(0);
			expect(page.columns.stacks[2].contents.length).toBe(0);
		});

		test('adds single cell groups to the shortest stack', () => {
			const layout = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			page.add(cell15);
			expect(page.columns.stacks[0].contents.length).toBe(1);
			expect(page.columns.stacks[0].contents[0]).toBe(cell15);
			expect(page.columns.stacks[1].contents.length).toBe(0);
			expect(page.columns.stacks[2].contents.length).toBe(0);

			page.add(cell10);
			expect(page.columns.stacks[1].contents.length).toBe(1);
			expect(page.columns.stacks[1].contents[0]).toBe(cell10);
			expect(page.columns.stacks[2].contents.length).toBe(0);

			page.add(cell15);
			expect(page.columns.stacks[2].contents.length).toBe(1);
			expect(page.columns.stacks[2].contents[0]).toBe(cell15);

			page.add(cell10);
			expect(page.columns.stacks[1].contents.length).toBe(2);
			expect(page.columns.stacks[1].contents[1]).toBe(cell10);
		});

		test('fails to add a cell if it would not fit on the page', () => {
			const layout = {
				perRow: 2,
				linesY: 20,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			page.add(cell10);
			page.add(cell15);
			expect(() => page.add(cell15)).toThrow(/Can't add/);
			expect(() => page.add(cell25)).toThrow(/Can't add/);

			page.add(cell5);
			expect(() => page.add(cell10)).toThrow(/Can't add/);
		});

		test('when adding multiple cards, arranges them so the longest \
			stack is on the left', () => {
			const layout = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			page.addGroup([ cell10, cell20, cell15 ]);
			expect(page.columns.stacks[0].contents.length).toBe(1);
			expect(page.columns.stacks[0].contents[0]).toBe(cell20);
			expect(page.columns.stacks[1].contents.length).toBe(1);
			expect(page.columns.stacks[1].contents[0]).toBe(cell15);
			expect(page.columns.stacks[2].contents.length).toBe(1);
			expect(page.columns.stacks[2].contents[0]).toBe(cell10);
		});

		test('when adding multiple cards, will combine and arrange \
			cards in the group such that the longest resulting stack \
			is on the left', () => {
			const layout = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			page.addGroup([ cell10, cell15, cell20, cell15 ]);
			// should be:
			// | [15] [20] [15] |
			// | [10]           |
			expect(page.columns.stacks[0].contents.length).toBe(2);
			expect(page.columns.stacks[0].contents[0]).toBe(cell15);
			expect(page.columns.stacks[0].contents[1]).toBe(cell10);
			expect(page.columns.stacks[1].contents.length).toBe(1);
			expect(page.columns.stacks[1].contents[0]).toBe(cell20);
			expect(page.columns.stacks[2].contents.length).toBe(1);
			expect(page.columns.stacks[2].contents[0]).toBe(cell15);
		});

		test('when adding a group, returns any cards that could not be added', () => {
			const layout = {
				perRow: 2,
				linesY: 25,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			const notAdded = page.addGroup([ cell10, cell15, cell20, cell15 ]);
			expect(notAdded.length).toBe(1);
			expect(notAdded[0]).toBe(cell15);
		});

		test('increases the height of the page as cells are added', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);
			page.add(cell15);
			expect(page.h).toBe(15);
			page.add(cell10);
			expect(page.h).toBe(15);
			page.add(cell20); // expand stack
			expect(page.h).toBe(30);
		});
	});

	describe.concurrent('getAllCells', () => {
		test('returns all cells from all rows in T->B, L-R order', () => {
			const layout = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellColumnPage(layout);

			page.addGroup([ cell10, cell15, cell20, cell15 ]);
			// should be:
			// | [15] [20] [15] |
			// | [10]           |
			const cells = page.getAllCells();
			expect(cells.length).toBe(4);

			expect(cells[0]).toBe(cell15);
			expect(cells[1]).toBe(cell10);
			expect(cells[2]).toBe(cell20);
			expect(cells[3]).toBe(cell15);
		});
	});
});
