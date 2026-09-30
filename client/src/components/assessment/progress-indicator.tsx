import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  stepLabels 
}: ProgressIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="mt-4 flex justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          
          return (
            <div 
              key={index}
              className={cn(
                "flex flex-col items-center gap-2 flex-1",
                index === 0 && "items-start",
                index === stepLabels.length - 1 && "items-end"
              )}
            >
              <div 
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium hidden sm:block text-center",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
