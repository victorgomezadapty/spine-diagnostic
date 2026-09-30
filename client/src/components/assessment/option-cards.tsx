import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Option {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface OptionCardsProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  columns?: 2 | 3 | 4;
}

export function OptionCards({
  options,
  value,
  onChange,
  label,
  description,
  columns = 2
}: OptionCardsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4"
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className={cn("grid gap-3", gridCols[columns])}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;
          
          return (
            <Card
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative p-4 cursor-pointer transition-all",
                "hover-elevate active-elevate-2",
                isSelected && "ring-2 ring-primary bg-primary/5"
              )}
              data-testid={`option-${option.value}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                {Icon && (
                  <Icon className={cn(
                    "h-6 w-6",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
                <span className={cn(
                  "font-medium",
                  isSelected && "text-primary"
                )}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
