import { CardPageLayout } from '../sheet-layout';

export class Cell<T> {
	data: T;
	h: number;

	constructor(data: T, height: number) {
		this.data = data;
		this.h = height;
	}
};

export class StackedCell<T> {
	contents: Cell<T>[];
	h: number;
	maxHeight: number;
	_spacing: number;

	constructor(maxHeight: number, spacing: number) {
		this.contents = [];
		this.h = 0;
		this.maxHeight = maxHeight;
		this._spacing = spacing;
	}

	fits = (cell: Cell<T>, altMaxHeight?: number): boolean => {
		if (altMaxHeight) {
			return altMaxHeight >= this.h + cell.h;
		}
		return this.maxHeight >= this.h + cell.h;
	};

	add(cell: Cell<T>) {
		this.contents.push(cell);
		this.h += cell.h + (this.contents.length > 1 ? this._spacing : 0);
	}
}

export interface CellPage<T> {
	getCells(): (Cell<T> | StackedCell<T>)[];
	h: number;
	getHeight(): number | string;
}

export abstract class CellPageBase<T> implements CellPage<T> {
	_layout: CardPageLayout;
	h: number;
	maxHeight: number;

	constructor(layout: CardPageLayout) {
		this._layout = layout;
		this.maxHeight = layout.linesY;
		this.h = 0;
	};

	getHeight(): number | string {
		return this.h * this._layout.lineHPx;
	};

	abstract getCells(): (Cell<T> | StackedCell<T>)[];
}
