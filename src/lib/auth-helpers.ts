const ADMIN_EMAIL_DOMAIN = "tabungansampah.local";

export function toAdminEmail(username: string): string {
  const trimmed = username.trim();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@${ADMIN_EMAIL_DOMAIN}`;
}

export function adminUsername(email: string): string {
  return email.endsWith(`@${ADMIN_EMAIL_DOMAIN}`) ? email.split("@")[0] : email;
}
