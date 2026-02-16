import { ImageOff } from 'lucide-react';
import LogoCard from './LogoCard';

function LogoGallery({ 
  logos, 
  selectedLogoUrl, 
  onSelect, 
  onDelete,
  isLoading,
  title = "Your Generated Logos",
  emptyMessage = "No logos generated yet"
}) {
  if (!logos || logos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <ImageOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first logo above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {logos.length} logo{logos.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {logos.map((logo, index) => (
          <LogoCard
            key={logo.logoId || logo._id || `logo-${index}`}
            logo={logo}
            isSelected={selectedLogoUrl === logo.url}
            onSelect={() => onSelect(logo.logoId)}
            onDelete={() => onDelete(logo.logoId)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

export default LogoGallery;
