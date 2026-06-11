import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Minus, Plus, ShoppingCart, Truck, Shield, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/home/ProductCard";
import MiniCartPopup from "@/components/cart/MiniCartPopup";
import { Skeleton } from "@/components/ui/skeleton";
import { trackViewContent, trackAddToCart } from "@/lib/tracking";

interface ProductVariant {
  id: string;
  name_bn: string;
  weight_value: number | null;
  weight_unit: string | null;
  price: number;
  sale_price?: number | null;
  stock_quantity: number | null;
  is_default: boolean | null;
}

interface Product {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  description_bn: string | null;
  images: string[] | null;
  base_price: number;
  sale_price: number | null;
  stock_quantity: number | null;
  is_featured: boolean | null;
  category_id: string | null;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem, getItemCount, getSubtotal } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [addedItem, setAddedItem] = useState<{
    name_bn: string;
    variant_name_bn?: string;
    image_url: string;
    price: number;
    quantity: number;
  } | null>(null);

  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Fetch product by slug
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    enabled: !!slug,
  });

  // Fetch product variants
  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product!.id)
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!product?.id,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product!.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!product?.id,
  });

  // Fetch category
  const { data: category } = useQuery({
    queryKey: ['category', product?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name_bn, slug')
        .eq('id', product!.category_id!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id,
  });

  // Fetch related products (same category, excluding current)
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id, product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product!.category_id!)
        .eq('is_active', true)
        .neq('id', product!.id)
        .limit(8);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id && !!product?.id,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: product!.id,
          customer_name: reviewName,
          rating: reviewRating,
          comment: reviewComment || null,
          is_approved: false,
        } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "রিভিউ জমা হয়েছে",
        description: "আপনার রিভিউ অনুমোদনের পর প্রকাশিত হবে।",
      });
      setReviewName("");
      setReviewRating(5);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
    },
    onError: () => {
      toast({
        title: "ত্রুটি",
        description: "রিভিউ জমা দিতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  // Set default variant when variants load
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const defaultVariant = variants.find((v) => v.is_default) || variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [variants, selectedVariant]);

  // Track ViewContent when product is loaded
  useEffect(() => {
    if (product) {
      trackViewContent({
        content_name: product.name_bn,
        content_ids: [product.id],
        content_type: 'product',
        value: product.sale_price || product.base_price,
        currency: 'BDT',
      });
    }
  }, [product?.id]);

  if (productLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartCount={getItemCount()} />
        <main className="flex-1 py-6">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartCount={getItemCount()} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">পণ্য পাওয়া যায়নি</h1>
            <p className="text-muted-foreground mb-4">এই পণ্যটি বর্তমানে পাওয়া যাচ্ছে না।</p>
            <Link to="/shop">
              <Button>কেনাকাটা করুন</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentPrice = selectedVariant?.sale_price || selectedVariant?.price || product.sale_price || product.base_price;
  const originalPrice = selectedVariant?.price || product.base_price;
  const hasDiscount = selectedVariant?.sale_price || product.sale_price;
  const discountPercentage = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const stockQuantity = selectedVariant?.stock_quantity || product.stock_quantity || 0;
  const isOutOfStock = stockQuantity <= 0;
  const images = product.images || ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop"];

  const formatPrice = (price: number) => `৳${price.toLocaleString("bn-BD")}`;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name_bn: product.name_bn,
      variant_name_bn: selectedVariant?.name_bn,
      image_url: images[0],
      price: currentPrice,
      quantity: quantity,
      stock_quantity: stockQuantity,
    });

    // Track AddToCart event
    trackAddToCart({
      content_name: product.name_bn,
      content_ids: [product.id],
      content_type: 'product',
      value: currentPrice * quantity,
      currency: 'BDT',
    });

    setAddedItem({
      name_bn: product.name_bn,
      variant_name_bn: selectedVariant?.name_bn,
      image_url: images[0],
      price: currentPrice,
      quantity: quantity,
    });
    setShowMiniCart(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      toast({
        title: "নাম দিন",
        description: "আপনার নাম লিখুন।",
        variant: "destructive",
      });
      return;
    }
    submitReviewMutation.mutate();
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartCount={getItemCount()} />

      <main className="flex-1 py-6">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">হোম</Link>
            <span>/</span>
            {category && (
              <>
                <Link to={`/category/${category.slug}`} className="hover:text-primary">
                  {category.name_bn}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{product.name_bn}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name_bn}
                  className="w-full h-full object-cover"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.is_featured && (
                    <Badge className="bg-accent text-accent-foreground">বিশেষ</Badge>
                  )}
                  {hasDiscount && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      {discountPercentage}% ছাড়
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === selectedImageIndex ? "border-primary" : "border-border"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {product.name_bn}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(avgRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length} রিভিউ)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    পরিমাণ বেছে নিন
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        disabled={(variant.stock_quantity || 0) <= 0}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : (variant.stock_quantity || 0) <= 0
                            ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {variant.name_bn}
                        {variant.sale_price && (
                          <span className="ml-1 text-xs">
                            ({formatPrice(variant.sale_price)})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  পরিমাণ
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-muted transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                      className="p-3 hover:bg-muted transition-colors"
                      disabled={quantity >= stockQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stockQuantity > 0 ? `${stockQuantity}টি স্টকে আছে` : "স্টক শেষ"}
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? "স্টক শেষ" : "কার্টে যোগ করুন"}
                </Button>
                <Link to="/checkout" className="flex-1">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                  >
                    এখনই কিনুন
                  </Button>
                </Link>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">দ্রুত ডেলিভারি</p>
                    <p className="text-muted-foreground">২৪-৪৮ ঘণ্টা</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">মানি ব্যাক</p>
                    <p className="text-muted-foreground">গ্যারান্টি</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">১০০% খাঁটি</p>
                    <p className="text-muted-foreground">অর্গানিক</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Description & Reviews */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  বিবরণ
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  রিভিউ ({reviews.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {product.description_bn || "এই পণ্যের বিস্তারিত বিবরণ শীঘ্রই আসছে।"}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-8">
                  {/* Review Form */}
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">রিভিউ দিন</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">আপনার নাম</label>
                        <Input
                          placeholder="আপনার নাম লিখুন"
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">রেটিং</label>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setReviewRating(i + 1)}
                              className="p-1"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  i < reviewRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">মন্তব্য (ঐচ্ছিক)</label>
                        <Textarea
                          placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Button type="submit" disabled={submitReviewMutation.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        {submitReviewMutation.isPending ? "জমা হচ্ছে..." : "রিভিউ জমা দিন"}
                      </Button>
                    </form>
                  </div>

                  {/* Existing Reviews */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      এই পণ্যের কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-card rounded-xl p-5 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold">
                                  {review.customer_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{review.customer_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString("bn-BD")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

      <MiniCartPopup
        isOpen={showMiniCart}
        onClose={() => setShowMiniCart(false)}
        addedItem={addedItem}
        cartTotal={getSubtotal()}
        cartItemCount={getItemCount()}
      />
    </div>
  );
};

export default ProductDetail;
