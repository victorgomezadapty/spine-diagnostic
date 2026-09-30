import { cn } from "@/lib/utils";

interface PainScaleProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function PainScale({
  value,
  onChange,
  label,
  description,
  leftLabel = "Sin dolor",
  rightLabel = "Dolor extremo"
}: PainScaleProps) {
  const getColor = (val: number) => {
    if (val <= 3) return "bg-green-500";
    if (val <= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Scale buttons */}
        <div className="flex gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "flex-1 h-12 rounded-md text-sm font-medium transition-all",
                "border-2",
                value === i 
                  ? cn(getColor(i), "text-white border-transparent") 
                  : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              data-testid={`pain-scale-${i}`}
            >
              {i}
            </button>
          ))}
        </div>
        
        {/* Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
        
        {/* Current value indicator */}
        <div className="text-center">
          <span className={cn(
            "inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-bold",
            getColor(value),
            "text-white"
          )}>
            {value}/10
          </span>
        </div>
      </div>
    </div>
  );
}
