# Image Enhancements Features (Planned)

This document outlines potential future enhancements for product images in the UMKM Marketplace. The goal is to make seller-uploaded food images look more vibrant, appetizing, and well-lit without requiring heavy AI processing models.

Currently, this feature is **disabled** to maintain consistency, but can be quickly toggled on using the approaches below.

## Proposed Approaches

### Approach 1: Frontend CSS Filters (Soft Enhancement)
The fastest and zero-cost way to make images pop is to apply CSS filters directly to the `<img>` elements when they are rendered in the browser.

**How to implement:**
Add the following Tailwind CSS utility classes to image tags across `ProductCard.jsx`, `ProductDetail.jsx`, `Cart.jsx`, and `Orders.jsx`:
- `saturate-150`: Boosts color vibrance by 50%
- `contrast-125`: Increases contrast by 25% to fix washed-out shadows
- `brightness-110`: Adds a 10% lighting boost

```jsx
<img 
  src={product.image} 
  className="object-cover saturate-150 contrast-125 brightness-110" 
/>
```

**Pros:**
- Zero backend processing required
- Extremely fast (hardware accelerated by browser)
- Can be easily tweaked or disabled

**Cons:**
- Doesn't fix the underlying image file
- If images are shared manually (e.g. copied to WhatsApp), they will revert to the dull original

---

### Approach 2: Backend Go Processing (Permanent Enhancement)
If the goal is to permanently fix vendor images right as they are uploaded, we can process them on the Go backend before saving to cloud storage.

**How to implement:**
Modify the upload handler in `backend/internal/handlers/upload.go` to use a fast, native Go imaging library like `github.com/disintegration/imaging`.

```go
import "github.com/disintegration/imaging"

func EnhanceImage(src image.Image) image.Image {
    // 1. Boost saturation by 20%
    img := imaging.AdjustSaturation(src, 20)
    
    // 2. Fix lighting (brightness +10, contrast +15)
    img = imaging.AdjustBrightness(img, 10)
    img = imaging.AdjustContrast(img, 15)
    
    // 3. Make the food look crisp
    img = imaging.Sharpen(img, 0.5)
    
    return img
}
```

**Pros:**
- Fixes the actual image file permanently
- Consistent display across all platforms (Web, Mobile, WhatsApp previews)

**Cons:**
- Adds CPU load to the backend during the upload phase
- Sellers cannot undo the enhancement once saved

## Future Roadmap

When enabling this feature:
1. First, test **Approach 1** to find the exact saturation and contrast balance that looks good across a wide range of seller photos.
2. If sellers complain about dull photos when sharing links, migrate to **Approach 2** to bake the enhancements directly into the files.
