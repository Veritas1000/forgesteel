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
