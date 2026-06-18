export function monthlyFreshnessLabel(priceDate?: string): string {
  if (!priceDate) {
    const now = new Date();
    return now.getDate() >= 12 ? 'Este mes' : 'Pendiente';
  }
  const now = new Date();
  const date = new Date(priceDate);
  const sameMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (sameMonth) {
    return date.getDate() >= 12 ? 'Este mes' : 'Pendiente';
  }
  return 'Mes anterior';
}

export function monthlyFreshnessVariant(priceDate?: string): 'success' | 'warning' | 'danger' {
  if (!priceDate) {
    const now = new Date();
    return now.getDate() >= 12 ? 'success' : 'warning';
  }
  const now = new Date();
  const date = new Date(priceDate);
  const sameMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (sameMonth) {
    return date.getDate() >= 12 ? 'success' : 'warning';
  }
  return 'danger';
}

export function monthlyFreshnessIcon(priceDate?: string): 'flash' | 'time' | 'alert-circle' {
  if (!priceDate) {
    const now = new Date();
    return now.getDate() >= 12 ? 'flash' : 'time';
  }
  const now = new Date();
  const date = new Date(priceDate);
  const sameMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (sameMonth) {
    return date.getDate() >= 12 ? 'flash' : 'time';
  }
  return 'alert-circle';
}
