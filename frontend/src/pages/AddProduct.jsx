
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Plus, X, MapPin, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import LocationPicker from '../components/LocationPicker';
import Layout from '@/components/layout/Layout';
import './AddProduct.css';

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

function AddProduct() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [, setLocationStatus] = useState('getting');

  // Variant state
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([{ name: '', price: '', stock: '' }]);

  // Option groups state
  const [optionGroups, setOptionGroups] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: 'pieces',
  });

  // Get seller's current location on component mount
  useEffect(() => {
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
          console.error('Error getting location:', error);
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('unsupported');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      images,
      tags,
      currentLocation,
      hasVariants,
      variants: hasVariants ? variants.map(v => ({
        name: v.name,
        price: Number(v.price),
        stock: Number(v.stock)
      })) : [],
      optionGroups: optionGroups.map(g => ({
        name: g.name,
        required: g.required,
        multiple: g.multiple,
        options: g.options.map(o => ({
          name: o.name,
          priceAdjust: Number(o.priceAdjust) || 0
        }))
      }))
    };

    addMutation.mutate(productData);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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

  // --- Variant helpers ---
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

  // --- Option group helpers ---
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
    <Layout>
      <div className="add-product container py-8">
        <button onClick={() => navigate(-1)} className="back-button inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="add-product-container max-w-4xl mx-auto">
          <div className="form-header text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
            <p className="text-muted-foreground">List your product for nearby customers</p>
          </div>

          <form onSubmit={handleSubmit} className="product-form space-y-8">
            {/* Basic Info */}
            <div className="form-section p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b">Basic Information</h3>

              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter product name"
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="4"
                    placeholder="Describe your product..."
                    className="w-full p-2 border rounded-md bg-background text-foreground resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="category" className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="unit" className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="grams">Grams (g)</option>
                      <option value="liters">Liters (L)</option>
                      <option value="meters">Meters (m)</option>
                      <option value="pairs">Pairs</option>
                      <option value="dozen">Dozen</option>
                      <option value="cups">Cups</option>
                      <option value="portions">Portions</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="form-section p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b">Pricing & Stock</h3>

              {/* Variant Toggle */}
              <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-muted/50 border">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted-foreground/30 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <div>
                  <span className="text-sm font-medium">This product has size/type variants</span>
                  <p className="text-xs text-muted-foreground">e.g. Small, Medium, Large with different prices</p>
                </div>
              </div>

              {!hasVariants ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="price" className="block text-sm font-medium mb-1">Price (Rp) *</label>
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="stock" className="block text-sm font-medium mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      id="stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      min="0"
                      placeholder="Available stock"
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="variants-builder space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Product Variants</label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>
                  {variants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        placeholder="Variant name (e.g. Large)"
                        className="flex-1 p-2 border rounded-md bg-background text-foreground text-sm"
                        required
                      />
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        placeholder="Price (Rp)"
                        className="w-28 p-2 border rounded-md bg-background text-foreground text-sm"
                        min="0"
                        required
                      />
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        placeholder="Stock"
                        className="w-20 p-2 border rounded-md bg-background text-foreground text-sm"
                        min="0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        disabled={variants.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Option Groups (Menus) */}
            <div className="form-section p-6 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2 pb-2 border-b">
                <div>
                  <h3 className="text-xl font-semibold">Custom Options (Optional)</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add customizable menus like &quot;Choose chicken part&quot;, &quot;Ice level&quot;, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={addOptionGroup}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus size={14} /> Add Menu
                </button>
              </div>

              {optionGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No custom options added yet.</p>
                  <p className="text-xs mt-1">Great for food & beverages — let buyers customize their order!</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {optionGroups.map((group, gIndex) => (
                    <div key={gIndex} className="border rounded-lg overflow-hidden">
                      {/* Group Header */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 cursor-pointer" onClick={() => toggleGroupCollapse(gIndex)}>
                        <button type="button" className="p-0.5">
                          {group.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => updateOptionGroup(gIndex, 'name', e.target.value)}
                          placeholder="Menu name (e.g. Choose Chicken Part)"
                          className="flex-1 p-1.5 border rounded-md bg-background text-foreground text-sm"
                          onClick={(e) => e.stopPropagation()}
                          required
                        />
                        <label className="inline-flex items-center gap-1 text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) => updateOptionGroup(gIndex, 'required', e.target.checked)}
                            className="rounded"
                          />
                          Required
                        </label>
                        <label className="inline-flex items-center gap-1 text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={group.multiple}
                            onChange={(e) => updateOptionGroup(gIndex, 'multiple', e.target.checked)}
                            className="rounded"
                          />
                          Multi-select
                        </label>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeOptionGroup(gIndex); }}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Group Options */}
                      {!group.collapsed && (
                        <div className="p-3 space-y-2">
                          {group.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => updateOption(gIndex, oIndex, 'name', e.target.value)}
                                placeholder="Option name (e.g. Breast)"
                                className="flex-1 p-2 border rounded-md bg-background text-foreground text-sm"
                                required
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">+Rp</span>
                                <input
                                  type="number"
                                  value={option.priceAdjust}
                                  onChange={(e) => updateOption(gIndex, oIndex, 'priceAdjust', e.target.value)}
                                  placeholder="0"
                                  className="w-24 p-2 border rounded-md bg-background text-foreground text-sm"
                                  min="0"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOption(gIndex, oIndex)}
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                disabled={group.options.length <= 1}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(gIndex)}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                          >
                            <Plus size={14} /> Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="form-section p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b">Product Location</h3>
              <p className="text-sm text-muted-foreground mb-4">Where is this product located? (Defaults to your current location)</p>

              <div style={{ marginTop: '1rem' }}>
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
              </div>
            </div>

            {/* Images */}
            <div className="form-section p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b">Product Images</h3>

              <div className="image-upload mb-4">
                <label htmlFor="images" className="upload-btn inline-flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload size={24} className="mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload</span>
                </label>
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {images.length > 0 && (
                <div className="image-preview-grid grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="image-preview relative w-32 h-32 border rounded-lg overflow-hidden group">
                      <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="remove-image absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="form-section p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b">Tags</h3>

              <div className="tags-section">
                <div className="tag-input-wrapper flex gap-2 mb-4">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag (e.g., handmade, organic)"
                    className="flex-1 p-2 border rounded-md bg-background text-foreground"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTag(e);
                    }}
                  />
                  <button type="button" onClick={addTag} className="add-tag-btn px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
                    <Plus size={16} />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="tags-list flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="tag-item inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="form-actions flex gap-4 pt-4 border-t">
              <button
                type="button"
                className="btn-secondary flex-1 py-3 border rounded-md hover:bg-muted"
                onClick={() => navigate('/seller/dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? 'Adding Product...' : 'Add Product'}
              </button>
            </div>

            {addMutation.isError && (
              <div className="error-message p-3 mt-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                {addMutation.error?.response?.data?.message || 'Failed to add product'}
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default AddProduct;