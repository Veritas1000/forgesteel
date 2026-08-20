import { Cell, StackedCell } from './cell';
import { CardPageLayout } from '../sheet-layout';
import { Collections } from '@/utils/collections';

export class HeightStackRow<T> {
	stacks: StackedCell<T>[];
	_layout: CardPageLayout;

	constructor(layout: CardPageLayout) {
		this.stacks = [];
		for (let i = 0; i < layout.perRow; i++) {
			this.stacks.push(new StackedCell<T>(layout.linesY, layout.cardGap));
		}
		this._layout = layout;
	}

	fits = (cell: Cell<T>): boolean => {
		// check if any of the stacks can fit the cell
		return this.stacks.some(stack => stack.fits(cell));
	};

	addToShortest = (cell: Cell<T>) => {
		const shortestStack = Collections.min(this.stacks, s => s.h);
		if (shortestStack) {
			if (!shortestStack.fits(cell)) {
				throw new Error('Can\'t add cell stack');
			}
			shortestStack.add(cell);
		}
	};

	getHeightVariance = (): number => {
		const avg = Collections.mean(this.stacks, c => c.h);
		return this.stacks.map(c => c.h)
			.reduce((prev, curr) => {
				return prev + Math.abs(avg - curr);
			}, 0);
	};

	getLeftWeight = (): number => {
		return this.stacks.map((c, i) => c.h * Math.pow(10, i))
			.reduce((prev, curr) => {
				return prev + curr;
			}, 0);
	};
}
