/**
 * Whether locally-stored data belongs to someone other than the user who just
 * signed in. If so it must be wiped before any sync runs, otherwise one
 * person's meals, dosha and scores get pushed into another person's account —
 * which is exactly what happened when two people shared a browser.
 *
 * Lives here rather than in the component so it can be tested without a DOM.
 */
export function isForeignData(owner: string | null, email: string | null): boolean {
  return !!owner && !!email && owner !== email;
}
