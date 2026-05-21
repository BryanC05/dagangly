import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUrl';
import { cn } from '@/lib/utils';

export default function ProductImage({
  src,
  alt = 'Product',
  className,
  imgClassName,
  aspect = 'aspect-square',
}) {
  const [failed, setFailed] = useState(false);
  const url = resolveImageUrl(src);

  if (!url || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          aspect,
          className,
        )}
        aria-label={alt}
      >
        <ImageIcon className="h-8 w-8 opacity-40" />
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden bg-muted', aspect, className)}>
      <img
        src={url}
        alt={alt}
        className={cn('h-full w-full object-cover', imgClassName)}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
}
