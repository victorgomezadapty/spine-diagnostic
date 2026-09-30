import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface YesNoToggleProps {
  value: "yes" | "no" | undefined;
  onChange: (value: "yes" | "no") => void;
  label: string;
  description?: string;
  yesLabel: string;
  noLabel: string;
  required?: boolean;
}

export function YesNoToggle({
  value,
  onChange,
  label,
  description,
  yesLabel,
  noLabel,
  required = false
}: YesNoToggleProps) {
  const showRequiredHint = required && value === undefined;
  
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={cn(
            "flex-1 h-14 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
            "border-2",
            value === "yes" 
              ? "bg-primary text-primary-foreground border-primary" 
              : showRequiredHint
                ? "bg-muted/50 border-destructive/30 hover:bg-muted text-muted-foreground hover:text-foreground"
                : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          data-testid="toggle-yes"
        >
          <Check className="h-5 w-5" />
          {yesLabel}
        </button>
        
        <button
          type="button"
          onClick={() => onChange("no")}
          className={cn(
            "flex-1 h-14 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
            "border-2",
            value === "no" 
              ? "bg-foreground text-background border-foreground shadow-sm" 
              : showRequiredHint
                ? "bg-muted/50 border-destructive/30 hover:bg-muted text-muted-foreground hover:text-foreground"
                : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          data-testid="toggle-no"
        >
          <X className="h-5 w-5" />
          {noLabel}
        </button>
      </div>
    </div>
  );
}
