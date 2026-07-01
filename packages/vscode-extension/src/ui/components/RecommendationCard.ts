import { renderButton } from './Button.js';

export function renderRecommendationCard(
  title: string,
  reason: string,
  expectedImpact: string,
  onclickAction: string,
): string {
  return `
    <div class="action-box">
      <div class="action-box-header">Recommended Next Action</div>
      <div class="action-box-title">${title}</div>
      <div class="action-box-meta"><strong>Reason:</strong> ${reason}</div>
      <div class="action-box-meta"><strong>Expected Impact:</strong> ${expectedImpact}</div>
      <div style="margin-top: 8px;">
        ${renderButton(`🎯 ${title}`, onclickAction)}
      </div>
    </div>
  `;
}
