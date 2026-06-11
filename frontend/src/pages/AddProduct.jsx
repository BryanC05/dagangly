import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Upload, Plus, X, Trash2, ChevronDown, 
  ChevronUp, Sparkles, Instagram, Info, MapPin, Package,
  Layers, Settings2, Image as ImageIcon, Tag
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import api from '../utils/api';
import LocationPicker from '../components/LocationPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

const categories = [
  { id: 'food', name: 'Food & Beverages' },
  { id: 'clothing', name: 'Clothing & Apparel' },
  { id: 'handicrafts', name: 'Handicrafts' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'home', name: 'Home & Living' },
  { id: 'beauty', name: 'Beauty & Health' },
  { id: 'agriculture', name: 'Agriculture' },
  { id: 'other', name: 'Others' },
];

const units = [
  { id: 'pieces', name: 'Pieces' },
  { id: 'kg', name: 'Kilograms (kg)' },
  { id: 'grams', name: 'Grams (g)' },
  { id: 'liters', name: 'Liters (L)' },
  { id: 'meters', name: 'Meters (m)' },
  { id: 'pairs', name: 'Pairs' },
  { id: 'dozen', name: 'Dozen' },
  { id: 'cups', name: 'Cups' },
  { id: 'portions', name: 'Portions' },
];

const statuses = [
  { id: 'active', name: 'Active - Available for purchase' },
  { id: 'sold_out', name: 'Sold Out - Not available' },
  { id: 'stock_empty', name: 'Stock Empty - Waiting for restock' },
];

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_SELLER_LOCATION = {
  coordinates: [107.0782, -6.2567],
  address: 'Binus University Bekasi',
  city: 'Bekasi',
  state: 'West Java',
};

const formatUploadWarning = (warning) => {
  if (!warning) return null;
  if (warning.code === 'enhancement_unavailable') {
    return 'Image enhancement is currently unavailable on the server. Original image uploaded.';
  }
  return warning.message || 'Image was uploaded with warnings.';
};

function AddProduct() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [imageItems, setImageItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [, setLocationStatus] = useState('getting');
  const [imageError, setImageError] = useState('');
  const [uploadWarnings, setUploadWarnings] = useState([]);
  const locationInitializedRef = useRef(false);

  // Variant state
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([{ name: '', price: '', stock: '' }]);

  // Option groups state
  const [optionGroups, setOptionGroups] = useState([]);

  // Instagram auto-post state
  const [postToInstagram, setPostToInstagram] = useState(false);
  const [instagramCaption, setInstagramCaption] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: 'pieces',
    status: 'active',
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (locationInitializedRef.current) return;
    locationInitializedRef.current = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            coordinates: [position.coords.longitude, position.coords.latitude],
            address: 'Current Location',
            city: '',
            state: ''
          });
          setLocationStatus('success');
        },
        (error) => {
          console.warn('Could not get current location, using default:', error);
          setCurrentLocation(DEFAULT_SELLER_LOCATION);
          setLocationStatus('fallback');
        }
      );
    } else {
      queueMicrotask(() => {
        setCurrentLocation(DEFAULT_SELLER_LOCATION);
        setLocationStatus('unsupported');
      });
    }
  }, []);

  const addMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sellerProducts']);
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      navigate('/seller/dashboard');
    },
  });

  const validateImageFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `${file.name}: Unsupported image format`;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `${file.name}: File exceeds ${MAX_IMAGE_SIZE_MB}MB`;
    }
    return null;
  };

  const processProductImage = async (file, enhance) => {
    const formPayload = new FormData();
    formPayload.append('image', file);
    formPayload.append('enhance', enhance ? 'true' : 'false');

    const response = await api.post('/product-images/process', formPayload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.data?.success || !response.data?.image?.url) {
      throw new Error('Failed to process image');
    }

    return {
      url: response.data.image.url,
      warning: response.data.warning || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (addMutation.isPending) return;

    setImageError('');
    setUploadWarnings([]);
    setImageItems((prev) => prev.map((item) => ({ ...item, error: null })));

    if (imageItems.length === 0) {
      setImageError('Please upload at least one product image');
      return;
    }

    const uploadedUrls = [];

    try {
      for (const imageItem of imageItems) {
        setImageItems((prev) =>
          prev.map((item) =>
            item.id === imageItem.id
              ? { ...item, uploadState: 'uploading', warning: null, error: null }
              : item
          )
        );

        const processed = await processProductImage(imageItem.file, imageItem.enhance);
        uploadedUrls.push(processed.url);

        setImageItems((prev) =>
          prev.map((item) =>
            item.id === imageItem.id
              ? {
                ...item,
                uploadState: 'done',
                uploadedUrl: processed.url,
                warning: formatUploadWarning(processed.warning),
                error: null,
              }
              : item
          )
        );

        const warningMessage = formatUploadWarning(processed.warning);
        if (warningMessage) {
          setUploadWarnings((prev) => (prev.includes(warningMessage) ? prev : [...prev, warningMessage]));
        }
      }

      const productData = {
        ...formData,
        price: Number(formData.price),
        stock: formData.stock ? Number(formData.stock) : null,
        images: uploadedUrls,
        tags,
        currentLocation,
        hasVariants,
        variants: hasVariants ? variants.map(v => ({
          name: v.name,
          price: Number(v.price),
          stock: v.stock ? Number(v.stock) : null
        })) : [],
        optionGroups: optionGroups.map(g => ({
          name: g.name,
          required: g.required,
          multiple: g.multiple,
          options: g.options.map(o => ({
            name: o.name,
            priceAdjust: Number(o.priceAdjust) || 0
          }))
        })),
        postToInstagram,
        instagramCaption: postToInstagram ? instagramCaption : '',
      };

      await addMutation.mutateAsync(productData);
    } catch (err) {
      setImageError(err.response?.data?.message || err.message || 'Failed to process images');
      setImageItems((prev) =>
        prev.map((item) =>
          item.uploadState === 'uploading'
            ? { ...item, uploadState: 'error', error: 'Upload failed' }
            : item
        )
      );

      if (uploadedUrls.length > 0) {
        try {
          await api.delete('/product-images/cleanup', { data: { urls: uploadedUrls } });
        } catch (cleanupErr) {
          console.error('Failed to cleanup uploaded images:', cleanupErr);
        }
      }
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert("Please enter a product name first.");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.post('/ai/generate-description', {
        name: formData.name,
        keywords: tags.join(', ')
      });
      setFormData(prev => ({ ...prev, description: response.data.description }));
    } catch (err) {
      console.error("AI Generation failed:", err);
      alert(err.response?.data?.error || "Failed to generate AI description. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageError('');
    const remainingSlots = MAX_IMAGES - imageItems.length;
    const filesToProcess = files.slice(0, Math.max(remainingSlots, 0));
    const validationErrors = [];

    if (files.length > remainingSlots) {
      validationErrors.push(`Only ${MAX_IMAGES} images are allowed`);
    }

    const nextItems = filesToProcess.reduce((acc, file) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        validationErrors.push(validationError);
        return acc;
      }

      acc.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
        originalPreview: URL.createObjectURL(file),
        enhance: false,
        enhancing: false,
        uploadedUrl: null,
        uploadState: 'pending',
        warning: null,
        error: null,
      });
      return acc;
    }, []);

    setImageItems((prev) => [...prev, ...nextItems]);
    if (validationErrors.length > 0) {
      setImageError(validationErrors.join(' | '));
    }

    e.target.value = '';
  };

  const removeImage = (id) => {
    setImageItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const toggleEnhance = async (id) => {
    const item = imageItems.find((i) => i.id === id);
    if (!item) return;

    const newEnhance = !item.enhance;

    if (!newEnhance) {
      setImageItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, enhance: false, preview: i.originalPreview } : i
        )
      );
      return;
    }

    setImageItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, enhance: true, enhancing: true } : i
      )
    );

    try {
      const formPayload = new FormData();
      formPayload.append('image', item.file);
      const response = await api.post('/product-images/preview-enhance', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success && response.data?.enhancedUrl) {
        setImageItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, enhancing: false, preview: response.data.enhancedUrl }
              : i
          )
        );
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error('Enhancement preview failed:', err);
      setImageItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, enhance: false, enhancing: false, error: 'Enhancement failed' }
            : i
        )
      );
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', price: '', stock: '' }]);
  };

  const updateVariant = (index, field, value) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, {
      name: '',
      required: false,
      multiple: false,
      options: [{ name: '', priceAdjust: '' }],
      collapsed: false
    }]);
  };

  const updateOptionGroup = (gIndex, field, value) => {
    setOptionGroups(optionGroups.map((g, i) => i === gIndex ? { ...g, [field]: value } : g));
  };

  const removeOptionGroup = (gIndex) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== gIndex));
  };

  const addOption = (gIndex) => {
    setOptionGroups(optionGroups.map((g, i) =>
      i === gIndex ? { ...g, options: [...g.options, { name: '', priceAdjust: '' }] } : g
    ));
  };

  const updateOption = (gIndex, oIndex, field, value) => {
    setOptionGroups(optionGroups.map((g, i) =>
      i === gIndex ? {
        ...g,
        options: g.options.map((o, j) => j === oIndex ? { ...o, [field]: value } : o)
      } : g
    ));
  };

  const removeOption = (gIndex, oIndex) => {
    setOptionGroups(optionGroups.map((g, i) =>
      i === gIndex ? {
        ...g,
        options: g.options.length > 1 ? g.options.filter((_, j) => j !== oIndex) : g.options
      } : g
    ));
  };

  const toggleGroupCollapse = (gIndex) => {
    setOptionGroups(optionGroups.map((g, i) =>
      i === gIndex ? { ...g, collapsed: !g.collapsed } : g
    ));
  };

  return (
    <div className="container py-8 md:py-12 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link to="/seller/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">List your product for nearby customers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>Enter the primary details of your product.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Handmade Ceramic Bowl"
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <div className="relative group">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 p-3 bg-card text-card-foreground border border-border text-xs rounded-lg shadow-xl z-50">
                      <p className="font-bold text-primary mb-1">AI Writing Tips:</p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Enter a clear, descriptive <strong>Product Name</strong> first.</li>
                        <li>Add relevant tags and select a category for best results.</li>
                        <li>Click <strong>Enhance with AI</strong> to generate a high-converting description.</li>
                        <li>Review and refine the generated text as needed.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingAI || !formData.name}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs border-primary/30 hover:border-primary text-primary transition-all duration-300"
                >
                  {isGeneratingAI ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {isGeneratingAI ? 'Generating...' : 'Enhance with AI'}
                </Button>
              </div>
              
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-2.5 text-xs text-muted-foreground mb-1">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground">💡 Smart Copilot:</span> Type a product name, then click <strong className="text-primary font-semibold">Enhance with AI</strong> to instantly auto-generate a detailed, persuasive description.
                </div>
              </div>

              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={5}
                placeholder="Describe your product... (Tip: Add a product name and tags first, then use AI to write this!)"
                className="resize-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(val) => setFormData({ ...formData, unit: val })}
                >
                  <SelectTrigger id="unit" className="h-11">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Pricing & Stock
            </CardTitle>
            <CardDescription>Manage how much you charge and how many you have.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="space-y-0.5">
                <Label className="text-base">Product Variants</Label>
                <p className="text-xs text-muted-foreground">Does this product have different sizes or colors?</p>
              </div>
              <Button
                type="button"
                variant={hasVariants ? "default" : "outline"}
                size="sm"
                onClick={() => setHasVariants(!hasVariants)}
                className="h-9 px-4 font-bold"
              >
                {hasVariants ? 'Disable Variants' : 'Enable Variants'}
              </Button>
            </div>

            {!hasVariants ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (Rp) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">Rp</span>
                    <Input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    type="number"
                    id="stock"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                    placeholder="Available stock"
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Availability</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="status" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Variant List</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addVariant}
                    className="h-8 gap-1.5 text-xs text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Variant
                  </Button>
                </div>
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex-1 grid gap-4 md:grid-cols-3">
                        <div className="grid gap-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Name</Label>
                          <Input
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            placeholder="e.g. Large"
                            className="h-9 text-sm"
                            required
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Price (Rp)</Label>
                          <Input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            placeholder="Price"
                            className="h-9 text-sm"
                            min="0"
                            required
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Stock</Label>
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                            placeholder="Stock"
                            className="h-9 text-sm"
                            min="0"
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                        disabled={variants.length <= 1}
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 mt-6 md:mt-5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Option Groups */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-5 w-5 text-primary" />
                  Custom Options
                </CardTitle>
                <CardDescription>Add customizable menus (e.g. &quot;Extra Toppings&quot;).</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addOptionGroup}
                className="h-9 px-4 gap-1.5 font-bold"
              >
                <Plus className="h-4 w-4" /> Add Menu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {optionGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl border-border/40 bg-muted/10">
                <Settings2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No custom options added yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Great for food - let buyers customize their order!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {optionGroups.map((group, gIndex) => (
                  <Card key={gIndex} className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/40 py-3 px-4 flex flex-row items-center gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleGroupCollapse(gIndex)}
                      >
                        {group.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                      <Input
                        value={group.name}
                        onChange={(e) => updateOptionGroup(gIndex, 'name', e.target.value)}
                        placeholder="Menu Name (e.g. Choose Topping)"
                        className="h-9 bg-background flex-1 text-sm font-bold"
                        required
                      />
                      <div className="flex items-center gap-4 px-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) => updateOptionGroup(gIndex, 'required', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="text-xs font-bold text-muted-foreground">Required</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.multiple}
                            onChange={(e) => updateOptionGroup(gIndex, 'multiple', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="text-xs font-bold text-muted-foreground">Multi</span>
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOptionGroup(gIndex)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    {!group.collapsed && (
                      <CardContent className="p-4 space-y-3">
                        <div className="grid gap-1 mb-2">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Choices</Label>
                        </div>
                        {group.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <Input
                              value={option.name}
                              onChange={(e) => updateOption(gIndex, oIndex, 'name', e.target.value)}
                              placeholder="Choice Name (e.g. Cheese)"
                              className="h-9 text-sm"
                              required
                            />
                            <div className="relative w-40">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">+Rp</span>
                              <Input
                                type="number"
                                value={option.priceAdjust}
                                onChange={(e) => updateOption(gIndex, oIndex, 'priceAdjust', e.target.value)}
                                placeholder="0"
                                className="h-9 pl-10 text-sm"
                                min="0"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(gIndex, oIndex)}
                              disabled={group.options.length <= 1}
                              className="h-9 w-9 text-muted-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(gIndex)}
                          className="h-8 gap-1.5 text-xs text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Choice
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
              Product Images
            </CardTitle>
            <CardDescription>Upload clear photos to attract more buyers.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <label className="flex-shrink-0 flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  disabled={imageItems.length >= MAX_IMAGES || addMutation.isPending}
                  className="hidden"
                />
              </label>

              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {imageItems.map((item, index) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden border border-border/60 aspect-square">
                    <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => removeImage(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {item.enhance && (
                      <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-600 border-none text-[8px] font-black h-4 px-1.5">
                        ENHANCED
                      </Badge>
                    )}

                    {item.enhancing && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-background/80 backdrop-blur-md flex gap-1">
                      <Button
                        type="button"
                        variant={item.enhance ? "secondary" : "outline"}
                        size="sm"
                        className={`flex-1 h-7 rounded-lg text-[9px] font-black uppercase ${item.enhance ? 'bg-purple-100 text-purple-700 border-purple-200' : 'text-muted-foreground'}`}
                        onClick={() => toggleEnhance(item.id)}
                        disabled={addMutation.isPending || item.enhancing}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {item.enhancing ? 'Wait' : item.enhance ? 'Enhanced' : 'Enhance'}
                      </Button>
                    </div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, MAX_IMAGES - imageItems.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="rounded-xl border border-dashed border-border/40 bg-muted/5 aspect-square flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                ))}
              </div>
            </div>

            {imageError && (
              <Badge variant="destructive" className="w-full justify-start py-2 px-3 rounded-lg text-xs gap-2">
                <X className="h-3.5 w-3.5" />
                {imageError}
              </Badge>
            )}

            {uploadWarnings.length > 0 && (
              <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                <Info className="h-4 w-4 shrink-0" />
                <p>{uploadWarnings.join(' | ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Product Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <LocationPicker
                onLocationSelect={(loc) => {
                  setCurrentLocation({
                    coordinates: [loc.lng, loc.lat],
                    address: loc.address,
                    city: loc.city,
                    state: loc.state,
                    pincode: loc.pincode
                  });
                }}
                initialLocation={currentLocation ? { lat: currentLocation.coordinates[1], lng: currentLocation.coordinates[0] } : null}
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-primary" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. organic, handmade"
                  onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
                  className="h-11"
                />
                <Button type="button" onClick={addTag} size="icon" className="h-11 w-11 shrink-0">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[44px] p-4 rounded-xl border border-border/40 bg-muted/10">
                {tags.length === 0 && <span className="text-xs text-muted-foreground">Add tags to help buyers find your product...</span>}
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pl-3 pr-1.5 py-1 gap-1.5 font-bold">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instagram */}
        <Card className="border-border/60 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 pb-4 border-b border-pink-500/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Instagram Auto-Post
                </CardTitle>
                <CardDescription>Post this product to Instagram when published.</CardDescription>
              </div>
              <Button
                type="button"
                variant={postToInstagram ? "default" : "outline"}
                size="sm"
                onClick={() => setPostToInstagram(!postToInstagram)}
                className={`h-9 px-4 font-bold ${postToInstagram ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-none' : ''}`}
              >
                {postToInstagram ? 'Enabled' : 'Enable'}
              </Button>
            </div>
          </CardHeader>
          {postToInstagram && (
            <CardContent className="pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="igCaption">Custom Caption (Optional)</Label>
                <Textarea
                  id="igCaption"
                  value={instagramCaption}
                  onChange={(e) => setInstagramCaption(e.target.value)}
                  placeholder="Write a custom caption... Leave empty for auto-generated caption."
                  className="resize-none h-24"
                />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Generated default includes product name, price, and link.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row gap-4 pt-8">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-base font-bold"
            onClick={() => navigate('/seller/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 text-base font-bold"
            disabled={addMutation.isPending || imageItems.length === 0}
          >
            {addMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                <span>Publishing Product...</span>
              </div>
            ) : (
              'Publish Product'
            )}
          </Button>
        </div>

        {addMutation.isError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0" />
            <p>{addMutation.error?.response?.data?.message || 'Failed to add product. Please check your data and try again.'}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default AddProduct;

