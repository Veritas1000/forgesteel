import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { CardPageLayout } from './sheet-layout';
import { SheetFormatter } from './sheet-formatter';

export class AbilityCell {
	sheet: AbilitySheet;
	h: number;

	constructor(sheet: AbilitySheet, height: number) {
		this.sheet = sheet;
		this.h = height;
	}
};

export class StackedCell {
	contents: AbilityCell[];
	h: number;
	maxHeight: number;

	constructor(maxHeight: number) {
		this.contents = [];
		this.h = 0;
		this.maxHeight = maxHeight;
	}

	fits = (card: AbilityCell, altMaxHeight?: number): boolean => {
		if (altMaxHeight) {
			return altMaxHeight >= this.h + card.h;
		}
		return this.maxHeight >= this.h + card.h;
	};

	add(cell: AbilityCell) {
		this.contents.push(cell);
		this.h += cell.h;
	}
}

export class CellRow {
	stacks: StackedCell[];
	_currentStackIdx: number;
	maxHeight: number;
	h: number;

	constructor(cellsPerRow: number, maxHeight: number) {
		this.stacks = [];
		for (let i = 0; i < cellsPerRow; i++) {
			this.stacks.push(new StackedCell(maxHeight));
		}
		this._currentStackIdx = -1;
		this.h = 0;
		this.maxHeight = maxHeight;
	}

	fits = (cell: AbilityCell): boolean => {
		// can't place a card bigger than we can handle
		if (cell.h > this.maxHeight) {
			return false;
		}
		// 1. do we have a new slot available
		if ((this._currentStackIdx + 1) < this.stacks.length) {
			return true;
		}
		// 2. can we stack in a previous slot
		return this.stacks.some(stack => stack.fits(cell, this.h));
	};

	add = (cell: AbilityCell) => {
		// if there is an existing stack
		if (this._currentStackIdx >= 0) {
			// check if current stack can fit new cell without increasing row height
			const currentStack = this.stacks[this._currentStackIdx];
			if (currentStack.fits(cell, this.h)) {
				currentStack.add(cell);
				return;
			}
		}
		const nextIdx = this._currentStackIdx + 1;
		// if the next index is outside the row
		if (nextIdx >= this.stacks.length) {
			// see if it can fit in a previous stack
			const stacked = this.stacks.some(stack => {
				if (stack.fits(cell, this.h)) {
					stack.add(cell);
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

export class CardPage {
	rows: CellRow[];
	_currentRow: number;
	h: number;
	maxHeight: number;

	constructor(cellsPerRow: number, maxHeight: number) {
		this.rows = [];
		this.rows.push(new CellRow(cellsPerRow, maxHeight));
		this._currentRow = 0;
		this.maxHeight = maxHeight;
		this.h = 0;
	}

	currentRow = (): CellRow => {
		return this.rows[this._currentRow];
	};

	fits = (card: AbilityCell): boolean => {
		return this.currentRow().fits(card);
	};

	add = (card: AbilityCell) => {
		return this.currentRow().add(card);
	};
}

export class CardPacker {
	static packAbilities = (abilities: AbilitySheet[], layout: CardPageLayout): CardPage[] => {
		const pages: CardPage[] = [];
		let page = new CardPage(layout.perRow, layout.linesY);
		abilities.every(a => {
			const aH = SheetFormatter.calculateAbilitySize(a, layout.cardLineLen);
			const cell = new AbilityCell(a, aH);
			if (page.fits(cell)) {
				page.add(cell);
				return true;
			} else {
				pages.push(page);
				page = new CardPage(layout.perRow, layout.linesY);

				// try again with new page
				if (page.fits(cell)) {
					page.add(cell);
				} else {
					return false;
				}
			}
		});
		return pages;
	};
};
