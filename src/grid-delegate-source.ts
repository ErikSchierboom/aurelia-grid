import { Grid } from './grid';
import { GridColumn } from './grid-column';

import { IGridDataSource, IGridData, IDataInfo, IDataSortInfo, GridDataSource } from './grid-source';

/** Remote Source of Grid Data via a function */
export class DelegateGridData extends GridDataSource {
	private dataRead: (event: IDataInfo) => Promise<any>;

	constructor(grid: Grid) {
		super(grid);
		this.dataRead = grid.sourceRead;
		if (!this.dataRead) {
			throw new Error("'data-read.call' is not defined on the grid.");
		}

		this.supportsPagination = this.grid.sourceSupportsPagination;
		this.supportsSorting = this.grid.sourceSupportsSorting;
		this.supportsMultiColumnSorting = this.grid.sourceSupportsMultiColumnSorting;
	}

	refresh() {

		this.loading = true;
		var sort = this.sorting.map<IDataSortInfo>(s => {
			return { field: s.field, sorting: s.sorting };
		});

		var requestInfo = {
			page: this.page,
			pageSize: this.pageSize,
			sort: sort
		};

		if (sort && sort.length > 0) {
			// add the default sort field and sort to the default requestInfo
			var s0 = sort[0];
			requestInfo["field"] = s0["field"];
			requestInfo["sorting"] = s0["sorting"];
		}

		var d = this.dataRead(requestInfo);

		if (!d) {
			// uh - no result
			this.count = 0;
			this.items = [];
			this.loading = false;
			this.onData();
			return;
		}

		if (d.then) {
			d.then(result => {
				this.handleResult(result);
				this.loading = false;
			}).catch(error => {
				if (this.grid.sourceReadError)
					this.grid.sourceReadError(error);
				this.loading = false;
			});
		} else {
			if (Array.isArray(d)) {
				this.handleResult(d, true);
				this.loading = false;
			} else {
				this.handleResult(d, false);
				this.loading = false;
			}
		};
	}

	private handleResult(result: any, isArray: boolean = false) {
		var r: IGridData;
		if (this.grid.sourceTransform)
			r = this.grid.sourceTransform(result);
		else {
			if (isArray) {
				r = { data: result, count: result.length };
			} else {
				r = <IGridData>result;
			}
		}

		if (r) {
			this.count = r.count || 0;
			this.items = r.data || [];
		} else{
			this.count = 0;
			this.items = [];
		}
		if(this.count == 0){
			this.page = 1;
			this.pageCount = 0;
		}
		this.onData();
	}
}