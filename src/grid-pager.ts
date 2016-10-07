import {bindable, inject, BindingEngine, customElement, processContent, TargetInstruction} from 'aurelia-framework';
import {ViewCompiler, ViewSlot, ViewResources, Container} from 'aurelia-framework';

import {Grid} from './grid';
import {IGridDataSource} from './grid-source';

export class GridPager {
	// replaced template (if defined - otherwise we use our standard template)
	template: any;
	grid: Grid;

	enabled: boolean = true;
	
	/** number of pages to show in the pager */
	@bindable numPagesToShow: number = 5;
	@bindable showFirstLast: boolean = true;
	@bindable showJump: boolean = true;
	@bindable showPagingSummary: boolean = true;
	
	// CSV with page sizes
	@bindable pageSizes: number[] = [10, 25, 50];

	@bindable nextDisabled: boolean = false;
	@bindable prevDisabled: boolean = false;

	@bindable firstVisibleItem: number = 0;
	@bindable lastVisibleItem: number = 0;
	
	@bindable autoHide: boolean = false;

	pages = [];
	
	constructor() {
	}

	refresh() {
		if (!this.grid.source)
			return;	// no source?
		
		// something changed in the data - recalculate
		// Cap the number of pages to render if the count is less than number to show at once
		var numToRender = this.grid.source.pageCount < this.numPagesToShow ? this.grid.source.pageCount : this.numPagesToShow;

		// The current page should try to appear in the middle, so get the median 
		// of the number of pages to show at once - this will be our adjustment factor
		var indicatorPosition = Math.ceil(numToRender / 2);

		// Subtract the pos from the current page to get the first page no
		var firstPageNumber = this.grid.source.page - indicatorPosition + 1;

		// If the first page is less than 1, make it 1
		if (firstPageNumber < 1)
			firstPageNumber = 1;

		// Add the number of pages to render
		// remember to subtract 1 as this represents the first page number
		var lastPageNumber = firstPageNumber + numToRender - 1;

		// If the last page is greater than the page count
		// add the difference to the first/last page
		if (lastPageNumber > this.grid.source.pageCount) {
			var dif = this.grid.source.pageCount - lastPageNumber;

			firstPageNumber += dif;
			lastPageNumber += dif;
		}

		var pages = [];

		for (var i = firstPageNumber; i <= lastPageNumber; i++) {
			pages.push(i);
		};

		this.pages = pages;

		if(this.grid.source.count > 0)
		{
			this.firstVisibleItem = (this.grid.source.page - 1) * Number(this.grid.source.pageSize) + 1;
			this.lastVisibleItem = Math.min((this.grid.source.page) * Number(this.grid.source.pageSize), this.grid.source.count);
		} else{
			this.firstVisibleItem = 0;
			this.lastVisibleItem = 0;
			this.pages = [];
		}

		this.updateButtons();
	}

	updateButtons() {
		this.nextDisabled = this.grid.source.page >= this.grid.source.pageCount;
		this.prevDisabled = this.grid.source.page <= 1;
	}

	// pageSizeChanged(newValue: number, oldValue: number) {
	// 	debugger;
	// 	if (newValue == oldValue)
	// 		return;
	// 	this.grid.source.pageSize = newValue;
	// 	this.grid.source.refresh();
	// }

	changePage(page: number) {
		var oldPage = this.grid.source.page;

		this.grid.source.page = this.validate(page);

		if (oldPage !== this.grid.source.page) {
			this.grid.source.refresh();
		}
	}

	next() {
		this.changePage(this.grid.source.page + 1);
	}

	nextJump() {
		this.changePage(this.grid.source.page + this.numPagesToShow);
	}

	prev() {
		this.changePage(this.grid.source.page - 1);
	}

	prevJump() {
		this.changePage(this.grid.source.page - this.numPagesToShow);
	}

	first() {
		this.changePage(1);
	}

	last() {
		this.changePage(this.grid.source.pageCount);
	}

	private validate(page: number): number {
		if (page < 1)
			return 1;
		if (page > this.grid.source.pageCount)
			return this.grid.source.pageCount;

		return page;
	}
}
