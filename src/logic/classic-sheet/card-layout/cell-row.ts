import { Cell, StackedCell } from './cell';

export class CellRow<T> {
	stacks: StackedCell<T>[];
	_currentStackIdx: number;
	maxHeight: number;
	h: number;

	constructor(cellsPerRow: number, maxHeight: number, spacing: number = 0) {
		this.stacks = [];
		for (let i = 0; i < cellsPerRow; i++) {
			this.stacks.push(new StackedCell(maxHeight, spacing));
		}
		this._currentStackIdx = -1;
		this.h = 0;
		this.maxHeight = maxHeight;
	}

	fits = (cell: Cell<T>): boolean => {
		// can't place a card bigger than we can handle
		if (cell.h > this.maxHeight) {
			return false;
		}
		// 1. do we have a new slot available
		if ((this._currentStackIdx + 1) < this.stacks.length) {
			return true;
		}
		// 2. can we stack in a previous slot
		return this.stacks
			.slice(this.getTallestIndex())
			.some(stack => stack.fits(cell, this.getMaxStackHeight()));
	};

	getTallestIndex = (): number => {
		const currentTallestStackIdx = this.stacks.findIndex(stack => {
			return stack.contents.length === 1
				&& stack.h === this.h;
		});
		return Math.max(0, currentTallestStackIdx);
	};

	getMaxStackHeight = (): number => {
		// allow a stack to slightly increase row height
		return this.h + 2;
	};

	add = (cell: Cell<T>) => {
		// if there is an existing stack
		if (this._currentStackIdx >= 0) {
			// check if current stack can fit new cell without increasing row height
			const currentStack = this.stacks[this._currentStackIdx];
			if (currentStack.fits(cell, this.getMaxStackHeight())) {
				currentStack.add(cell);
				this.h = Math.max(this.h, currentStack.h);
				return;
			}
		}
		const nextIdx = this._currentStackIdx + 1;
		// if the next index is outside the row
		if (nextIdx >= this.stacks.length) {
			// see if it can fit in a previous stack
			const stacked = this.stacks.slice(this.getTallestIndex())
				.some(stack => {
					if (stack.fits(cell, this.getMaxStackHeight())) {
						stack.add(cell);
						this.h = Math.max(this.h, stack.h);
						return true;
					}
					return false;
				});
			if (stacked) {
				return;
			} else {
				throw new Error('Can\'t add cell to row');
			}
		}
		const nextStack = this.stacks[nextIdx];
		nextStack.add(cell);
		this.h = Math.max(this.h, nextStack.h);
		this._currentStackIdx = nextIdx;
		return;
	};
}
