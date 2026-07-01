import { icons } from '../icons.js';

export function renderTimeline(events: string[]): string {
  if (events.length === 0) return '';

  const items = events
    .map((event) => {
      return `
      <div class="timeline-item">
        <div class="timeline-icon">${icons.history}</div>
        <div class="timeline-text">${event}</div>
      </div>
    `;
    })
    .join('');

  return `
    <div class="timeline-container">
      <div class="timeline-header">Timeline</div>
      ${items}
    </div>
  `;
}
