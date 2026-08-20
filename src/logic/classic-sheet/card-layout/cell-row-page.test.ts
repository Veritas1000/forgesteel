import { describe, expect, test } from 'vitest';
import { CardPageLayout } from '../sheet-layout';
import { Cell } from './cell';
import { CellRowPage } from './cell-row-page';

const mockCell = (h: number): Cell<string> => {
	return new Cell<string>('', h);
};

const cell10 = mockCell(10);
const cell15 = mockCell(15);
const cell20 = mockCell(20);
const cell25 = mockCell(25);

describe.concurrent('CellRowPage', () => {
	describe.concurrent('constructor', () => {
		test('creates an initial empty row of the given number of cells', () => {
			const layout3 = {
				perRow: 3,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page3 = new CellRowPage(layout3);
			expect(page3.rows.length).toBe(1);
			expect(page3.currentRow().stacks.length).toBe(3);

			const layout2 = {
				perRow: 2,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page2 = new CellRowPage(layout2);
			expect(page2.rows.length).toBe(1);
			expect(page2.currentRow().stacks.length).toBe(2);

			const layout5 = {
				perRow: 5,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const page5 = new CellRowPage(layout5);
			expect(page5.rows.length).toBe(1);
			expect(page5.currentRow().stacks.length).toBe(5);
		});
	});

	describe.concurrent('fits', () => {
		test('returns true if the current row can fit the cell', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellRowPage(layout);

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
			const page = new CellRowPage(layout);
			page.add(cell15);
			page.add(cell10);

			expect(page.fits(cell10)).toBe(true);
			expect(page.fits(cell20)).toBe(true);
			// 15 + 40 > 50
			expect(page.fits(mockCell(40))).toBe(false);
		});
	});

	describe.concurrent('add', () => {
		test('adds cells to the current row when possible', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellRowPage(layout);
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
			const page = new CellRowPage(layout);
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
			const page = new CellRowPage(layout);
			page.add(cell15);
			expect(page.h).toBe(15);
			page.add(cell10);
			expect(page.h).toBe(15);
			page.add(cell20); // new row
			expect(page.h).toBe(35);
		});
	});

	describe.concurrent('getAllCells', () => {
		test('returns all cells from all rows in L->R, T->B (book) order', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const page = new CellRowPage(layout);

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
			const page = new CellRowPage(layout);

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
