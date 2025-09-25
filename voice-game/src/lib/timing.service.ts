export interface TimingStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface TimingResult {
  totalTime: number;
  steps: TimingStep[];
  breakdown: string;
}

export class TimingService {
  private startTime: number;
  private steps: TimingStep[] = [];
  private currentStep: TimingStep | null = null;

  constructor(private operationName: string) {
    this.startTime = Date.now();
  }

  startStep(stepName: string): void {
    if (this.currentStep) {
      this.endCurrentStep();
    }
    this.currentStep = {
      name: stepName,
      startTime: Date.now(),
    };
  }

  endStep(): void {
    if (this.currentStep) {
      this.endCurrentStep();
    }
  }

  private endCurrentStep(): void {
    if (!this.currentStep) return;

    const endTime = Date.now();
    const duration = endTime - this.currentStep.startTime;
    this.currentStep.endTime = endTime;
    this.currentStep.duration = duration;
    this.steps.push(this.currentStep);
    console.log(`✅ Step ${this.steps.length} completed: ${this.currentStep.name} took ${duration}ms`);
    this.currentStep = null;
  }

  logStepInfo(message: string): void {
    console.log(`${message}`);
  }

  complete(): TimingResult {
    if (this.currentStep) {
      this.endCurrentStep();
    }

    const totalTime = Date.now() - this.startTime;
    
    const breakdown = this.generateBreakdown(totalTime);
    console.log(`\nTotal ${this.operationName} completed in ${totalTime}ms`);
    console.log(`📊 Performance breakdown:`);
    this.steps.forEach((step, index) => {
      const percentage = step.duration ? ((step.duration / totalTime) * 100).toFixed(1) : '0.0';
      console.log(`   - ${step.name}: ${step.duration}ms (${percentage}%)`);
    });
    console.log('─'.repeat(60));

    return {
      totalTime,
      steps: [...this.steps],
      breakdown
    };
  }

  completeWithError(error: any): void {
    const totalTime = Date.now() - this.startTime;
    console.error(`❌ Error in ${this.operationName} after ${totalTime}ms:`, error);
  }

  private generateBreakdown(totalTime: number): string {
    const breakdown = this.steps.map(step => {
      const percentage = step.duration ? ((step.duration / totalTime) * 100).toFixed(1) : '0.0';
      return `${step.name}: ${step.duration}ms (${percentage}%)`;
    }).join(', ');
    
    return `Total: ${totalTime}ms | ${breakdown}`;
  }

  getCurrentStep(): TimingStep | null {
    return this.currentStep;
  }

  getCompletedSteps(): TimingStep[] {
    return [...this.steps];
  }
}

export function createTimingService(operationName: string): TimingService {
  return new TimingService(operationName);
}

export function timeStep<T>(
  stepName: string, 
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  console.log(`Starting ${stepName}...`);
  
  return operation().then(result => {
    const duration = Date.now() - startTime;
    console.log(`${stepName} completed in ${duration}ms`);
    return result;
  }).catch(error => {
    const duration = Date.now() - startTime;
    console.error(`${stepName} failed after ${duration}ms:`, error);
    throw error;
  });
}
