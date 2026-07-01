export function renderButton(label: string, onclickAction: string, secondary = false): string {
  const cssClass = secondary ? 'btn-secondary' : 'btn-primary';
  return `<button class="${cssClass}" onclick="${onclickAction}">${label}</button>`;
}
