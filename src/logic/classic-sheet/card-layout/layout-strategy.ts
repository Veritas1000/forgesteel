import { CardPageLayout, ExtraCards } from '../sheet-layout';
import { Cell, CellPage } from './cell';
import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { CellColumnPage } from './cell-column-page';
import { CellRowPage } from './cell-row-page';
import { Options } from '@/models/options';
import { SheetFormatter } from '../sheet-formatter';

export interface CardLayoutStrategy {
	packAbilities(abilities: AbilitySheet[], extraCards: ExtraCards): CellPage<AbilitySheet>[];
	getAbilityPageClasses(): string[];
};

abstract class CardLayoutStrategyBase implements CardLayoutStrategy {
	layout: CardPageLayout;
	fillStyle: 'rules' | 'blank';

	constructor(layout: CardPageLayout, fillStyle: 'rules' | 'blank') {
		this.layout = layout;
		this.fillStyle = fillStyle;
	};

	abstract packAbilities(abilities: AbilitySheet[], extraCards: ExtraCards): CellPage<AbilitySheet>[];
	abstract getAbilityPageClasses(): string[];

	finalizePage = (page: CellPage<AbilitySheet>) => {
		return page;
	};
}

export class CardLayoutStrategyFactory {
	static from = (options: Options, layout: CardPageLayout): CardLayoutStrategy => {
		if (options.packingStrategy === 'original') {
			return new ClassicLayoutStrategy(layout, options.fillStyle);
		} else {
			return new DenseLayoutStrategy(layout, options.fillStyle);
		}
	};
};

export class ClassicLayoutStrategy extends CardLayoutStrategyBase {
	packAbilities = (abilities: AbilitySheet[], extraCards: ExtraCards): CellRowPage<AbilitySheet>[] => {
		abilities.sort(SheetFormatter.sortAbilitiesByType);

		const pages: CellRowPage<AbilitySheet>[] = [];
		let currentPage = new CellRowPage<AbilitySheet>(this.layout);

		abilities.every(ability => {
			const abilityHeight = SheetFormatter.calculateAbilitySize(ability, this.layout.cardLineLen);
			const cell = new Cell<AbilitySheet>(ability, abilityHeight);
			if (currentPage.fits(cell)) {
				currentPage.add(cell);
				return true;
			} else {
				this.finalizePage(currentPage);
				pages.push(currentPage);
				currentPage = new CellRowPage<AbilitySheet>(this.layout);

				// try again with new page
				if (currentPage.fits(cell)) {
					currentPage.add(cell);
					return true;
				} else {
					return false;
				}
			}
		});
		if (currentPage.getCells().length) {
			this.finalizePage(currentPage);
			pages.push(currentPage);
		}
		return pages;
	};

	getAbilityPageClasses = () => {
		return [
			'abilities',
			'page',
			this.layout.orientation,
			'row-cards',
			`row-cards-${this.layout.perRow}`
		];
	};
}

export class DenseLayoutStrategy extends CardLayoutStrategyBase {
	packAbilities = (allAbilities: AbilitySheet[], extraCards: ExtraCards): CellColumnPage<AbilitySheet>[] => {
		const abilityGroups = SheetFormatter.sortAndGroupAbilities(allAbilities);

		const pages: CellColumnPage<AbilitySheet>[] = [];
		let currentPage = new CellColumnPage<AbilitySheet>(this.layout);

		abilityGroups.every(group => {
			const groupCells = group.map(ability => {
				const abilityHeight = SheetFormatter.calculateAbilitySize(ability, this.layout.cardLineLen);
				return new Cell<AbilitySheet>(ability, abilityHeight);
			});
			const notAdded = currentPage.addGroup(groupCells);
			if (notAdded.length) {
				pages.push(currentPage);
				currentPage = new CellColumnPage<AbilitySheet>(this.layout);

				// try again with new page
				const notAddedAgain = currentPage.addGroup(notAdded);
				if (notAddedAgain.length) {
					throw new Error('Not sure what to do');
				} else {
					return true;
				}
			} else {
				return true;
			}
		});
		if (currentPage.getCells().length) {
			pages.push(currentPage);
		}
		return pages;
	};

	getAbilityPageClasses = () => {
		return [
			'abilities',
			'page',
			this.layout.orientation,
			'column-cards',
			`column-cards-${this.layout.perRow}`
		];
	};
};
