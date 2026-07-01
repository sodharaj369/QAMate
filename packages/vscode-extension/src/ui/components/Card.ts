export function renderCard(title: string, body: string, borderClass = ''): string {
  const extraBorder = borderClass ? `card-${borderClass}` : '';
  return `
    <div class="card ${extraBorder}">
      <div class="card-title">${title}</div>
      <div class="card-body">${body}</div>
    </div>
  `;
}
