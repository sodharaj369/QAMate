export function renderProgress(currentStep: string, steps: string[]): string {
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1) return '';

  const prevStep = currentIndex > 0 ? `✔ ${steps[currentIndex - 1]}` : '';
  const activeStep = `🟡 ${currentStep}`;
  const nextStep = currentIndex < steps.length - 1 ? `○ ${steps[currentIndex + 1]}` : '';

  return `
    <div class="stepper-container">
      <span class="step-prev">${prevStep}</span>
      <span class="step-active">${activeStep}</span>
      <span class="step-next">${nextStep}</span>
    </div>
  `;
}
