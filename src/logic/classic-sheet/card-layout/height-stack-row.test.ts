import { describe, expect, test } from 'vitest';
import { CardPageLayout } from '../sheet-layout';
import { Cell } from './cell';
import { HeightStackRow } from './height-stack-row';

const mockCell = (h: number): Cell<string> => {
	return new Cell<string>('', h);
};

const cell10 = mockCell(10);
const cell15 = mockCell(15);
const cell20 = mockCell(20);
const cell25 = mockCell(25);

describe.concurrent('HeightStackRow', () => {
	describe.concurrent('constructor', () => {
		test('creates an initial empty set of cells equal to perRow', () => {
			const layout3 = {
				perRow: 3,
				linesY: 10,
				cardGap: 0
			} as CardPageLayout;
			const row = new HeightStackRow(layout3);
			expect(row.stacks.length).toBe(3);
			expect(row.stacks[0].contents.length).toBe(0);
			expect(row.stacks[1].contents.length).toBe(0);
			expect(row.stacks[2].contents.length).toBe(0);
		});
	});

	describe.concurrent('fits', () => {
		test('returns true if the current row can fit the cell', () => {
			const layout = {
				perRow: 2,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const row = new HeightStackRow(layout);

			expect(row.fits(cell10)).toBe(true);
			expect(row.fits(cell15)).toBe(true);
			expect(row.fits(cell25)).toBe(true);
			expect(row.fits(mockCell(55))).toBe(false);
		});
	});

	describe.concurrent('addShortest', () => {
		test('always adds to the shortest stack, defaulting to the left', () => {
			const layout3 = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const row = new HeightStackRow(layout3);

			row.addToShortest(cell15);
			expect(row.stacks[0].contents.length).toBe(1);
			expect(row.stacks[0].contents[0]).toBe(cell15);
			expect(row.stacks[1].contents.length).toBe(0);
			expect(row.stacks[2].contents.length).toBe(0);

			row.addToShortest(cell20);
			expect(row.stacks[1].contents.length).toBe(1);
			expect(row.stacks[1].contents[0]).toBe(cell20);
			expect(row.stacks[2].contents.length).toBe(0);

			row.addToShortest(cell10);
			expect(row.stacks[2].contents.length).toBe(1);
			expect(row.stacks[2].contents[0]).toBe(cell10);

			row.addToShortest(cell10);
			expect(row.stacks[2].contents.length).toBe(2);
			expect(row.stacks[2].contents[1]).toBe(cell10);

			row.addToShortest(cell10);
			expect(row.stacks[0].contents.length).toBe(2);
			expect(row.stacks[0].contents[1]).toBe(cell10);
		});

		test('throws an error if the cell can not be added', () => {
			const layout = {
				perRow: 2,
				linesY: 20,
				cardGap: 0
			} as CardPageLayout;
			const row = new HeightStackRow(layout);

			row.addToShortest(cell10);
			row.addToShortest(cell15);
			row.addToShortest(cell10);
			expect(() => row.addToShortest(cell10)).toThrow(/Can't add/);
		});
	});

	describe.concurrent('getHeightVariance', () => {
		test('returns zero if all stacks are the same height', () => {
			const layout3 = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const row = new HeightStackRow(layout3);

			expect(row.getHeightVariance()).toBe(0);

			row.addToShortest(cell10);
			row.addToShortest(cell10);
			row.addToShortest(cell10);
			expect(row.getHeightVariance()).toBe(0);
		});

		test('returns the absolute total variance from the mean of all stacks', () => {
			const layout3 = {
				perRow: 3,
				linesY: 50,
				cardGap: 0
			} as CardPageLayout;
			const row = new HeightStackRow(layout3);

			row.addToShortest(cell15);
			// mean is 15 / 3 = 5, variance is 10 + 5 + 5
			expect(row.getHeightVariance()).toBe(20);

			row.addToShortest(mockCell(9));
			// mean is 24 / 3 = 8, variance is 7 + 1 + 8 = 16
			expect(row.getHeightVariance()).toBe(16);
		});
	});
});
