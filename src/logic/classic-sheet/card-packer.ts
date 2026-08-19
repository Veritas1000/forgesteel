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
	_spacing: number;

	constructor(maxHeight: number, spacing: number) {
		this.contents = [];
		this.h = 0;
		this.maxHeight = maxHeight;
		this._spacing = spacing;
	}

	fits = (card: AbilityCell, altMaxHeight?: number): boolean => {
		if (altMaxHeight) {
			return altMaxHeight >= this.h + card.h;
		}
		return this.maxHeight >= this.h + card.h;
	};

	add(cell: AbilityCell) {
		this.contents.push(cell);
		this.h += cell.h + (this.contents.length > 1 ? this._spacing : 0);
	}
}

export class CellRow {
	stacks: StackedCell[];
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

	add = (cell: AbilityCell) => {
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

// Stores cards in rows on the page.
// It will focus on packing cards to maximize space, but only
// to the point where a given row will only be as tall as the
// largest single card in that row.
export class CardRowPage {
	rows: CellRow[];
	_layout: CardPageLayout;
	_currentRowIdx: number;
	h: number;
	maxHeight: number;

	constructor(layout: CardPageLayout) {
		this._layout = layout;
		this.rows = [];
		this.maxHeight = layout.linesY;
		this.rows.push(new CellRow(layout.perRow, this.maxHeight, layout.cardGap));
		this._currentRowIdx = 0;
		this.h = 0;
	}

	currentRow = (): CellRow => {
		return this.rows[this._currentRowIdx];
	};

	fits = (card: AbilityCell): boolean => {
		return this.currentRow().fits(card)
			|| card.h + this.h <= this.maxHeight;
	};

	add = (cell: AbilityCell) => {
		const currentRow = this.currentRow();
		if (currentRow.fits(cell)) {
			currentRow.add(cell);
		} else {
			const newRow = new CellRow(this._layout.perRow, this.maxHeight - this.h, this._layout.cardGap);
			if (newRow.fits(cell)) {
				newRow.add(cell);
				this.rows.push(newRow);
				this._currentRowIdx += 1;
			} else {
				throw new Error('Can\'t add cell to page');
			}
		}
		this.h = this.rows.map(row => row.h)
			.reduce((h, rowH) => h + rowH, 0);
	};

	getAllCells = (): StackedCell[] => {
		return this.rows.flatMap(row => row.stacks).filter(stack => stack.contents.length);
	};
}

export class CardPacker {
	layout: CardPageLayout;
	pages: CardRowPage[];
	currentPage: CardRowPage;

	constructor(layout: CardPageLayout) {
		this.layout = layout;
		this.pages = [];
		this.currentPage = this.newPage();
	}

	reset = () => {
		this.pages = [];
		this.currentPage = this.newPage();
	};

	newPage = (): CardRowPage => {
		return new CardRowPage(this.layout);
	};

	placeInPage = (ability: AbilitySheet): boolean => {
		const abilityHeight = SheetFormatter.calculateAbilitySize(ability, this.layout.cardLineLen);
		const cell = new AbilityCell(ability, abilityHeight);
		if (this.currentPage.fits(cell)) {
			this.currentPage.add(cell);
			return true;
		} else {
			this.pages.push(this.currentPage);
			this.currentPage = this.newPage();

			// try again with new page
			if (this.currentPage.fits(cell)) {
				this.currentPage.add(cell);
				return true;
			} else {
				return false;
			}
		}
	};

	packAbilities = (abilities: AbilitySheet[]): CardRowPage[] => {
		this.reset();
		abilities.every(a => {
			return this.placeInPage(a);
		});
		if (this.currentPage.getAllCells().length) {
			this.pages.push(this.currentPage);
		}
		return this.pages;
	};

	// packAbilityGroups = (abilityGroups: AbilitySheet[][]): CardPage[] => {
	// 	this.reset();
	// 	abilityGroups.every(group => {
	// 		this.currentPage.startNewGroup();
	// 		return group.every(a => {
	// 			return this.placeInPage(a);
	// 		});
	// 	});
	// 	return this.pages;
	// };
};
