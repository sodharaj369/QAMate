export function renderEmptyState(message: string): string {
  return `
    <div class="empty-state">
      <div class="empty-state-message">${message}</div>
    </div>
  `;
}
