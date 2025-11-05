export const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

export const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export const numberFormatter = new Intl.NumberFormat("en-US");

export const percentageFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export const parseDate = (dateStr: string | undefined): Date | null => {
	if (!dateStr) return null;
	// Parse MM/DD/YY format
	const [month, day, year] = dateStr.split("/");
	if (!month || !day || !year) return null;
	// Convert 2-digit year to 4-digit (assuming 2000s)
	const fullYear =
		parseInt(year, 10) < 50
			? 2000 + parseInt(year, 10)
			: 1900 + parseInt(year, 10);
	return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
};
