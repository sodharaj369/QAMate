export function renderStatusChip(label: string, status: 'ok' | 'warn' | 'info'): string {
  const cssClass = `tag-${status}`;
  return `<span class="tag ${cssClass}">${label.toUpperCase()}</span>`;
}
