import { Cell, StackedCell } from './cell';
import { describe, expect, test } from 'vitest';

const mockCell = (h: number): Cell<string> => {
	return new Cell<string>('', h);
};

const cell5 = mockCell(5);
const cell10 = mockCell(10);
const cell15 = mockCell(15);
const cell20 = mockCell(20);
const cell25 = mockCell(25);

describe.concurrent('StackedCell', () => {
	describe.concurrent('fits', () => {
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

	describe.concurrent('add', () => {
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
