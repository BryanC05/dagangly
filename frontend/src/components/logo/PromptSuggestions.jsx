import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { logoPromptSuggestions } from '@/data/logoPrompts';

function PromptSuggestions({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSelect = (prompt) => {
    onSelect(prompt);
    setIsOpen(false);
  };

  const categories = Object.entries(logoPromptSuggestions);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Need inspiration?
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Logo Prompt Ideas
          </DialogTitle>
          <DialogDescription>
            Browse example prompts to help you create the perfect logo for your business
          </DialogDescription>
        </DialogHeader>
        
        <Accordion type="single" collapsible className="w-full">
          {categories.map(([key, category]) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(prompt)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

export default PromptSuggestions;
