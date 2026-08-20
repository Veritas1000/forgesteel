import { Cell, StackedCell } from './cell';
import { CardPageLayout } from '../sheet-layout';
import { CellRow } from './cell-row';

// Stores cards in rows on the page.
// It will focus on packing cards to maximize space, but only
// to the point where a given row will only be as tall as the
// largest single card in that row.
export class CellRowPage<T> {
	rows: CellRow<T>[];
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

	currentRow = (): CellRow<T> => {
		return this.rows[this._currentRowIdx];
	};

	fits = (cell: Cell<T>): boolean => {
		return this.currentRow().fits(cell)
			|| cell.h + this.h <= this.maxHeight;
	};

	add = (cell: Cell<T>) => {
		const currentRow = this.currentRow();
		if (currentRow.fits(cell)) {
			currentRow.add(cell);
		} else {
			const newRow = new CellRow<T>(this._layout.perRow, this.maxHeight - this.h, this._layout.cardGap);
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

	getAllCells = (): StackedCell<T>[] => {
		return this.rows.flatMap(row => row.stacks).filter(stack => stack.contents.length);
	};
}
