/**
 * Converts cents to dollars
 * @param cents - Amount in cents (integer)
 * @returns Amount in dollars (number)
 */
export function centsToDollars(cents: number): number {
	return cents / 100;
}

/**
 * Converts dollars to cents
 * @param dollars - Amount in dollars (number)
 * @returns Amount in cents (integer, rounded)
 */
export function dollarsToCents(dollars: number): number {
	return Math.round(dollars * 100);
}
