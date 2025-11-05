// UI-specific formatters
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

// Re-export parseDate from shared package
export { parseDate } from "@beagle-wt/shared-db/formatters";
