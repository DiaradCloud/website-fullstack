const ADMIN_SESSION_KEY = "diarad-admin-session";

export function hasStandaloneAdminSession() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "mehrad";
}

export function setStandaloneAdminSession(username: string) {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, username);
}

export function clearStandaloneAdminSession() {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
