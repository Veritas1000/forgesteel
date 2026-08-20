import { AbilitySheet } from '@/models/classic-sheets/ability-sheet';
import { CardPageLayout } from '../sheet-layout';
import { Cell } from './cell';
import { CellColumnPage } from './cell-column-page';
import { CellRowPage } from './cell-row-page';
import { SheetFormatter } from '../sheet-formatter';

export class CardPacker {
	layout: CardPageLayout;

	constructor(layout: CardPageLayout) {
		this.layout = layout;
	}

	packAbilities = (abilities: AbilitySheet[]): CellRowPage<AbilitySheet>[] => {
		const pages: CellRowPage<AbilitySheet>[] = [];
		let currentPage = new CellRowPage<AbilitySheet>(this.layout);
		abilities.every(ability => {
			const abilityHeight = SheetFormatter.calculateAbilitySize(ability, this.layout.cardLineLen);
			const cell = new Cell<AbilitySheet>(ability, abilityHeight);
			if (currentPage.fits(cell)) {
				currentPage.add(cell);
				return true;
			} else {
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
		if (currentPage.getAllCells().length) {
			pages.push(currentPage);
		}
		return pages;
	};

	packAbilityGroups = (abilityGroups: AbilitySheet[][]): CellColumnPage<AbilitySheet>[] => {
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
		if (currentPage.getAllCells().length) {
			pages.push(currentPage);
		}
		return pages;
	};
};
