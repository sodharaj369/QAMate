export class NamingStrategy {
  /**
   * Sanitizes the requirement ID and produces a revisioned filename.
   * e.g., "req-stripe-checkout", v2, "xlsx" -> "qamate_req_stripe_checkout_v2.xlsx"
   */
  public generateFilename(requirementId: string, revision: number, format: string): string {
    const cleanId = requirementId
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscores
      .replace(/_+/g, '_')         // Remove duplicate consecutive underscores
      .trim();

    return `qamate_${cleanId}_v${revision}.${format.toLowerCase()}`;
  }
}
