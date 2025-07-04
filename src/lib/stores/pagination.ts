export interface PaginationConfig {
	page: number;
	limit: number;
	total: number;
}

export function createPagination(initialConfig: PaginationConfig) {
	let config = $state(initialConfig);

	return {
		get config() {
			return config;
		},
		setPage(page: number) {
			config.page = page;
		},
		setTotal(total: number) {
			config.total = total;
		},
		get totalPages() {
			return Math.ceil(config.total / config.limit);
		},
		get hasNext() {
			return config.page < this.totalPages;
		},
		get hasPrev() {
			return config.page > 1;
		},
		nextPage() {
			if (this.hasNext) {
				config.page++;
			}
		},
		prevPage() {
			if (this.hasPrev) {
				config.page--;
			}
		}
	};
}
