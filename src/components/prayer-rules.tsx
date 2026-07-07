import { cn } from "@/lib/utils";

interface PrayerRulesProps {
  title: string;
  rules: string[];
  highlightedSteps?: readonly number[];
  className?: string;
}

export function PrayerRules({
  title,
  rules,
  highlightedSteps = [],
  className,
}: PrayerRulesProps) {
  const highlightedStepSet = new Set(highlightedSteps);

  return (
    <section className={cn("text-left", className)}>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {rules.map((rule, index) => {
          const step = index + 1;
          const isHighlighted = highlightedStepSet.has(step);

          return (
            <li
              key={rule}
              className={cn("flex gap-3", isHighlighted && "text-foreground")}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-foreground",
                  isHighlighted &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {step}
              </span>
              <span className={cn(isHighlighted && "font-medium")}>{rule}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
