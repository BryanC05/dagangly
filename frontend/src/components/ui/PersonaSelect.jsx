import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const PersonaSelect = ({
  label,
  value,
  onValueChange,
  options,
  color = "yellow", // "yellow" | "orange" | "black" | "white"
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState(null);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const colorClasses = {
    yellow: "bg-[#FACC15] text-black hover:bg-[#E2B60F]",
    orange: "bg-[#F97316] text-black hover:bg-[#EA580C]",
    black: "bg-black dark:bg-[#F97316] text-white dark:text-black border-black dark:border-[#F97316] hover:bg-[#1a1a1a] dark:hover:bg-[#EA580C]",
    white: "bg-white text-black hover:bg-[#f3f4f6]",
  };

  const selectedOption = options?.find((opt) => opt.id === value || opt.value === value);
  const displayLabel = selectedOption ? selectedOption.name || selectedOption.label : value;

  return (
    <div ref={containerRef} className={cn("relative inline-flex flex-col pt-3 pb-1 min-w-[150px] select-none", className)}>
      {/* The small black tab/header at the top left */}
      {label && (
        <div className="absolute top-0 left-2 z-10 bg-black px-2 py-0.5 border-t border-b border-primary transform -skew-x-12">
          <span className="text-[9px] font-black italic uppercase text-primary tracking-wider whitespace-nowrap block">
            {label}
          </span>
        </div>
      )}
      
      {/* The main dropdown trigger body */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 text-xs font-black italic uppercase border-3 border-black dark:border-[#FACC15] rounded-lg px-4.5 py-2 flex items-center justify-between gap-3 shadow-[3px_3px_0px_0px_#F97316] transform -skew-x-12 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#F97316]",
          colorClasses[color]
        )}
      >
        <span className="transform skew-x-12 block">{displayLabel}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform transform skew-x-12", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[48px] z-50 bg-white dark:bg-[#1a1505] border-3 border-black dark:border-[#FACC15] rounded-lg shadow-[6px_6px_0px_0px_#F97316] max-h-60 overflow-y-auto transform -skew-x-6 p-1.5 space-y-1">
          {options?.map((option) => {
            const optId = option.id !== undefined ? option.id : option.value;
            const optName = option.name || option.label;
            const isSelected = optId === value;
            return (
              <div
                key={optId}
                onMouseEnter={() => setHoveredId(optId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  onValueChange(optId);
                  setIsOpen(false);
                }}
                className={cn(
                  "cursor-pointer px-2.5 py-2 text-xs font-black italic uppercase rounded-md flex items-center justify-between transition-all transform hover:-translate-x-1 border-2 border-transparent",
                  isSelected
                    ? "bg-black text-[#FACC15] dark:bg-primary dark:text-black border-black dark:border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                    : "text-black dark:text-foreground hover:bg-[#FACC15] hover:text-black hover:border-black"
                )}
              >
                <span className="transform skew-x-6 flex items-center gap-1.5">
                  {(isSelected || hoveredId === optId) && (
                    <span className="text-[#F97316] dark:text-black animate-pulse">★</span>
                  )}
                  {optName}
                </span>
                {isSelected && (
                  <span className="text-[8px] bg-[#F97316] text-white px-1.5 py-0.5 rounded font-black italic transform skew-x-6">ACTIVE</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonaSelect;
