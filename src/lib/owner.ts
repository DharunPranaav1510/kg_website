// The one person allowed to add or remove other admins. Deliberately written in
// code, not in a setting or the database, so nobody can grant it from the panel.
export const OWNER_EMAIL = "dpranaav@gmail.com";

export const isOwner = (email: string | null | undefined) => !!email && email.trim().toLowerCase() === OWNER_EMAIL;
