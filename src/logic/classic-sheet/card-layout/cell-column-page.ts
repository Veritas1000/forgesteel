import { CardPageLayout } from '../sheet-layout';
import { Cell } from './cell';
import { Collections } from '@/utils/collections';
import { HeightStackRow } from './height-stack-row';

export class CellColumnPage<T> {
	columns: HeightStackRow<T>;
	h: number;
	_layout: CardPageLayout;

	constructor(layout: CardPageLayout) {
		this.columns = new HeightStackRow<T>(layout);
		this.h = 0;
		this._layout = layout;
	}

	fits = (cell: Cell<T>): boolean => {
		// check if any of the stacks can fit the cell
		return this.columns.fits(cell);
	};

	add = (cell: Cell<T>) => {
		if (!this.fits(cell)) {
			throw new Error('Can\'t add cell to page');
		}
		this.addGroup([ cell ]);
	};

	addGroup = (cellGroup: Cell<T>[]): Cell<T>[] => {
		if (cellGroup.length > 5) {
			// above a group size of 5, the number of permutations is
			// just way too big to be practical, so sort the group by height,
			// and grab the smallest and largest
			cellGroup.sort((a, b) => a.h - b.h);
			const extremes = [
				cellGroup.shift(),
				cellGroup.shift(),
				cellGroup.pop(),
				cellGroup.pop()
			].filter(c => !!c);

			const notAdded1 = this.addGroup(extremes);
			// TODO this is incomplete
			if (notAdded1.length) {
				return cellGroup.concat(...notAdded1);
			} else {
				return this.addGroup(cellGroup);
			}
		}
		// For small groups, get all permutations of the input group
		const permutations = Collections.getPermutations<Cell<T>>(cellGroup);
		let bestOrder: Cell<T>[] = cellGroup;
		let bestHeightVariance: number = Infinity;
		let bestLeftWeight: number = Infinity;

		permutations.forEach(testGroup => {
			// reset/create copy of current page state
			const numCols = this.columns.stacks.length;
			const stackRow = new HeightStackRow<unknown>(this.columns._layout);
			for (let i = 0; i < numCols; ++i) {
				const refH = this.columns.stacks[i].h;
				stackRow.stacks[i].add(new Cell<null>(null, refH));
			}

			testGroup.forEach(cell => {
				if (stackRow.fits(cell)) {
					stackRow.addToShortest(cell);
				}
			});
			const variance = stackRow.getHeightVariance();
			if (variance < bestHeightVariance) {
				bestHeightVariance = variance;
				bestOrder = testGroup;
				bestLeftWeight = stackRow.getLeftWeight();
			} else if (variance === bestHeightVariance) {
				// prefer orders where the taller stacks are to the left
				const newLeftWeight = stackRow.getLeftWeight();
				if (newLeftWeight < bestLeftWeight) {
					bestHeightVariance = variance;
					bestOrder = testGroup;
					bestLeftWeight = newLeftWeight;
				} else if (newLeftWeight === bestLeftWeight) {
					// prefer order where larger cards added first
					const oldD = bestOrder.map(c => c.h).reduce((total, h, i) => {
						return total + (h * i);
					}, 0);
					const newD = testGroup.map(c => c.h).reduce((total, h, i) => {
						return total + (h * i);
					}, 0);
					if (newD < oldD) {
						bestHeightVariance = variance;
						bestOrder = testGroup;
						bestLeftWeight = newLeftWeight;
					}
				}
			}
		});

		// iterate, adding tallest to the shortest stack each time
		const notAdded: Cell<T>[] = [];
		bestOrder.forEach(c => {
			if (this.columns.fits(c)) {
				this.columns.addToShortest(c);
			} else {
				notAdded.push(c);
			}
		});
		this.h = Math.max(...this.columns.stacks.map(s => s.h));
		return notAdded;
	};

	getAllCells = (): Cell<T>[] => {
		return this.columns.stacks.flatMap(stack => stack.contents);
	};
}
