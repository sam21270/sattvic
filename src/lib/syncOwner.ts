/** Which account the local sattvic blob belongs to. */
export const OWNER_KEY = "sattvic-sync-owner";

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

/**
 * Whether local data may be used to describe *this account*.
 *
 * Deliberately stricter than !isForeignData. Unowned data — someone browsing
 * before they ever signed in, or a blob left behind after a wipe — is not
 * foreign, so it is kept and pushed up on first sign-in, which is right. But it
 * must not be read back as though the signed-in account had earned it: a brand
 * new account opened the profile page and was shown a "Logged your first meal"
 * badge from meals the previous person on that browser had logged.
 *
 * Ownership has to be positively proven, not merely not-disproven.
 */
export function localDataBelongsTo(email: string | null | undefined): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    return window.localStorage.getItem(OWNER_KEY) === email;
  } catch {
    return false; // storage blocked — assume nothing
  }
}
