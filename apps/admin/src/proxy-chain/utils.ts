export function containsAdminDashboard(value: string) {
  const regex = /^\/dashboard/i;
  return regex.test(value);
}

export function containsAdminApi(value: string) {
  const regex = /^\/api/i;
  return regex.test(value);
}

export function containsAdminAuthApi(value: string) {
  const regex = /^\/api\/auth/i;
  return regex.test(value);
}

export function containsAdminPath(value: string) {
  return /^\//i.test(value) || /^\/$/.test(value);
}
