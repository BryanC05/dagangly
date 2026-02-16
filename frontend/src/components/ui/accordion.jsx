import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext(null)

const useAccordion = () => {
  const context = React.useContext(AccordionContext)
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion")
  }
  return context
}

const Accordion = React.forwardRef(({ type = "single", collapsible = false, defaultValue, children, className, ...props }, ref) => {
  const [openItems, setOpenItems] = React.useState(
    defaultValue ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : []
  )

  const toggleItem = (value) => {
    if (type === "single") {
      if (collapsible && openItems.includes(value)) {
        setOpenItems([])
      } else {
        setOpenItems([value])
      }
    } else {
      setOpenItems(prev => 
        prev.includes(value) 
          ? prev.filter(item => item !== value)
          : [...prev, value]
      )
    }
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ value, className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("border rounded-lg", className)} {...props}>
      {children}
    </div>
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { openItems, toggleItem } = useAccordion()
  
  // Get the value from parent AccordionItem
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = openItems.includes(itemValue)

  return (
    <button
      ref={ref}
      onClick={() => toggleItem(itemValue)}
      className={cn(
        "flex flex-1 items-center justify-between py-4 px-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionItemContext = React.createContext(null)

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { openItems } = useAccordion()
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = openItems.includes(itemValue)

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden px-4 pb-4 text-sm transition-all", className)}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

// Wrapper to provide context for each item
const AccordionItemWithContext = React.forwardRef(({ value, ...props }, ref) => {
  return (
    <AccordionItemContext.Provider value={value}>
      <AccordionItem ref={ref} value={value} {...props} />
    </AccordionItemContext.Provider>
  )
})
AccordionItemWithContext.displayName = "AccordionItemWithContext"

export { Accordion, AccordionItemWithContext as AccordionItem, AccordionTrigger, AccordionContent }
