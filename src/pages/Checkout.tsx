import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Truck, CreditCard, Tag, ArrowLeft, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUddoktaPay } from "@/hooks/useUddoktaPay";
import { useIncompleteOrder } from "@/hooks/useIncompleteOrder";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { trackPurchase } from "@/lib/tracking";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "নাম দিন"),
  phone: z.string().min(11, "সঠিক ফোন নম্বর দিন").max(14),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  address: z.string().min(10, "সম্পূর্ণ ঠিকানা দিন"),
  city: z.string().min(2, "শহর/জেলা দিন"),
  area: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface DeliveryZone {
  id: string;
  name_bn: string;
  charge: number;
  estimated_days: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getItemCount, getSubtotal, getQuantityDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { createCharge, isLoading: paymentLoading } = useUddoktaPay("client");
  const { saveIncompleteOrder, markAsConverted } = useIncompleteOrder();
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useServerSide, setUseServerSide] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const watchedFields = watch();

  // Track incomplete orders in real-time
  useEffect(() => {
    saveIncompleteOrder({
      fullName: watchedFields.fullName,
      phone: watchedFields.phone,
      email: watchedFields.email,
      address: watchedFields.address,
      city: watchedFields.city,
      area: watchedFields.area,
      notes: watchedFields.notes,
    }, selectedZone);
  }, [watchedFields.fullName, watchedFields.phone, watchedFields.email, watchedFields.address, watchedFields.city, watchedFields.area, watchedFields.notes, selectedZone, saveIncompleteOrder]);

  // Fetch delivery zones from database
  const { data: deliveryZones = [] } = useQuery({
    queryKey: ["delivery-zones-checkout"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("id, name_bn, charge, estimated_days")
        .eq("is_active", true)
        .order("charge", { ascending: true });
      
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });

  // Set default zone when data loads
  useEffect(() => {
    if (deliveryZones.length > 0 && !selectedZone) {
      setSelectedZone(deliveryZones[0].id);
    }
  }, [deliveryZones, selectedZone]);


  const selectedZoneData = deliveryZones.find((z) => z.id === selectedZone);
  const subtotal = getSubtotal();
  const { amount: quantityDiscount } = getQuantityDiscount();
  const deliveryCharge = selectedZoneData?.charge || 0;
  const totalDiscount = quantityDiscount + couponDiscount;
  const total = subtotal - totalDiscount + deliveryCharge;
  const partialPayment = paymentMethod === "partial" ? Math.max(deliveryCharge, Math.round(total * 0.1)) : 0;

  const formatPrice = (price: number) => `৳${price.toLocaleString("bn-BD")}`;

  const applyCoupon = async () => {
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !coupon) {
        toast({
          title: "অবৈধ কুপন",
          description: "কুপন কোডটি সঠিক নয়",
          variant: "destructive",
        });
        return;
      }

      // Check validity
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        toast({ title: "কুপনের মেয়াদ শেষ", variant: "destructive" });
        return;
      }
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        toast({ 
          title: `ন্যূনতম অর্ডার ${formatPrice(coupon.min_order_amount)} প্রয়োজন`, 
          variant: "destructive" 
        });
        return;
      }

      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = Math.round(subtotal * (coupon.discount_value / 100));
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = coupon.discount_value;
      }

      setCouponDiscount(discount);
      setCouponApplied(true);
      toast({
        title: "কুপন প্রয়োগ করা হয়েছে!",
        description: `ছাড়: ${formatPrice(discount)}`,
      });
    } catch (error) {
      toast({
        title: "কুপন চেক করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast({
        title: "কার্ট খালি",
        description: "অর্ডার করতে কার্টে পণ্য যোগ করুন",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle UddoktaPay payment
      if (paymentMethod === "uddoktapay") {
        const paymentAmount = total;
        
        // Store pending order data
        const pendingOrder = {
          customerName: data.fullName,
          customerPhone: data.phone,
          customerEmail: data.email || null,
          shippingAddress: data.address,
          shippingCity: data.city,
          shippingArea: data.area || null,
          deliveryZoneId: selectedZone || null,
          deliveryCharge,
          subtotal,
          discountAmount: totalDiscount,
          totalAmount: total,
          notes: data.notes || null,
          couponCode: couponApplied ? couponCode : null,
          userId: user?.id || null,
          items: items.map(item => ({
            productId: item.productId,
            name: item.name_bn,
            variantName: item.variant_name_bn || null,
            quantity: item.quantity,
            price: item.price,
          })),
        };
        
        localStorage.setItem("pending_order", JSON.stringify(pendingOrder));

        // Create payment charge
        const result = await createCharge({
          fullName: data.fullName,
          email: data.email || "customer@example.com",
          amount: paymentAmount,
          orderId: `temp_${Date.now()}`,
          userId: user?.id,
          redirectUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/checkout`,
        });

        if (result.success && result.payment_url) {
          // Redirect to UddoktaPay payment page
          window.location.href = result.payment_url;
          return;
        } else {
          toast({
            title: "পেমেন্ট তৈরি করতে সমস্যা হয়েছে",
            description: result.message || "আবার চেষ্টা করুন",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Handle COD and partial payment
      const orderInsertData = {
        customer_name: data.fullName,
        customer_phone: data.phone,
        customer_email: data.email || null,
        shipping_address: data.address,
        shipping_city: data.city,
        shipping_area: data.area || null,
        delivery_zone_id: selectedZone || null,
        delivery_charge: deliveryCharge,
        subtotal,
        discount_amount: totalDiscount,
        total_amount: total,
        payment_method: (paymentMethod === "partial" ? "uddoktapay" : "cod") as "cod" | "uddoktapay" | "bkash" | "nagad",
        payment_status: (paymentMethod === "partial" ? "partial" : "unpaid") as "unpaid" | "partial" | "paid" | "refunded",
        partial_payment_amount: partialPayment || null,
        order_status: "pending" as const,
        notes: data.notes || null,
        coupon_code: couponApplied ? couponCode : null,
        user_id: user?.id || null,
      };
      
      const { data: order, error } = await supabase
        .from("orders")
        .insert(orderInsertData as any)
        .select("id, order_number")
        .single();

      if (error) throw error;

      // Create order items
      if (order) {
        await supabase.from("order_items").insert(
          items.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.name_bn,
            variant_name: item.variant_name_bn || null,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          }))
        );
      }

      // Mark incomplete order as converted and clear cart
      await markAsConverted();
      
      // Track Purchase event with hashed customer data
      trackPurchase({
        content_ids: items.map(item => item.productId),
        contents: items.map(item => ({ id: item.productId, quantity: item.quantity, item_price: item.price })),
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        value: total,
        currency: 'BDT',
        customer_name: data.fullName,
        customer_phone: data.phone,
        customer_email: data.email || undefined,
        
        customer_city: data.city,
        order_id: order.order_number,
      });

      clearCart();
      
      toast({
        title: "অর্ডার সফল হয়েছে!",
        description: `অর্ডার নম্বর: ${order.order_number}`,
      });

      navigate(`/order-confirmation/${order.order_number.replace('#', '')}`);
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "অর্ডার ব্যর্থ হয়েছে",
        description: "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartCount={0} />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">কার্ট খালি</h1>
            <Link to="/shop">
              <Button>কেনাকাটা করুন</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartCount={getItemCount()} />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/cart">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">চেকআউট</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Delivery Info */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full gradient-organic flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">ডেলিভারি তথ্য</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">নাম *</Label>
                      <Input
                        id="fullName"
                        placeholder="আপনার নাম"
                        {...register("fullName")}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">ফোন নম্বর *</Label>
                      <Input
                        id="phone"
                        placeholder="০১XXXXXXXXX"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">ইমেইল (ঐচ্ছিক)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        {...register("email")}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">সম্পূর্ণ ঠিকানা *</Label>
                      <Textarea
                        id="address"
                        placeholder="বাড়ি নম্বর, রাস্তা, এলাকা"
                        {...register("address")}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">শহর/জেলা *</Label>
                      <Input
                        id="city"
                        placeholder="ঢাকা"
                        {...register("city")}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area">এলাকা</Label>
                      <Input
                        id="area"
                        placeholder="মিরপুর"
                        {...register("area")}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">অতিরিক্ত নোট</Label>
                      <Textarea
                        id="notes"
                        placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন"
                        {...register("notes")}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Zone */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full gradient-organic flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">ডেলিভারি জোন</h2>
                  </div>

                  <RadioGroup value={selectedZone} onValueChange={setSelectedZone}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliveryZones.map((zone) => (
                        <label
                          key={zone.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                            selectedZone === zone.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={zone.id} />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{zone.name_bn}</p>
                            <p className="text-sm text-muted-foreground">
                              {zone.estimated_days} দিনের মধ্যে ডেলিভারি
                            </p>
                          </div>
                          <span className="font-bold text-primary">
                            {formatPrice(zone.charge)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Method */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-organic flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">পেমেন্ট পদ্ধতি</h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Settings className="h-3 w-3" />
                      <span>সার্ভার-সাইড</span>
                      <Switch
                        checked={useServerSide}
                        onCheckedChange={setUseServerSide}
                        className="scale-75"
                      />
                    </div>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <label
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === "cod"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="cod" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">ক্যাশ অন ডেলিভারি</p>
                          <p className="text-sm text-muted-foreground">
                            পণ্য হাতে পেয়ে টাকা দিন
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === "uddoktapay"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="uddoktapay" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">অনলাইন পেমেন্ট (bKash/Nagad/Card)</p>
                          <p className="text-sm text-muted-foreground">
                            UddoktaPay এর মাধ্যমে নিরাপদ পেমেন্ট
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          নিরাপদ
                        </span>
                      </label>

                      <label
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === "partial"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="partial" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">আংশিক পেমেন্ট</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(partialPayment || Math.max(deliveryCharge, Math.round(total * 0.1)))} এখন দিন, বাকি ডেলিভারিতে
                          </p>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    অর্ডার সারাংশ
                  </h2>

                  {/* Items */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name_bn}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {item.name_bn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.variant_name_bn} × {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="কুপন কোড"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="pl-10"
                        disabled={couponApplied}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyCoupon}
                      disabled={couponApplied || !couponCode}
                    >
                      {couponApplied ? <Check className="h-4 w-4" /> : "প্রয়োগ"}
                    </Button>
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 text-sm border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">সাবটোটাল</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>

                    {quantityDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>পরিমাণ ছাড়</span>
                        <span>-{formatPrice(quantityDiscount)}</span>
                      </div>
                    )}

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>কুপন ছাড়</span>
                        <span>-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                      <span>{formatPrice(deliveryCharge)}</span>
                    </div>

                    <div className="border-t border-border pt-3 flex justify-between text-base">
                      <span className="font-semibold">সর্বমোট</span>
                      <span className="font-bold text-primary">{formatPrice(total)}</span>
                    </div>

                    {paymentMethod === "partial" && (
                      <div className="bg-accent/10 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">এখন দিতে হবে</p>
                        <p className="text-lg font-bold text-accent">{formatPrice(partialPayment)}</p>
                      </div>
                    )}

                    {paymentMethod === "uddoktapay" && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-green-700">সম্পূর্ণ অগ্রিম পেমেন্ট</p>
                        <p className="text-lg font-bold text-green-700">{formatPrice(total)}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    size="lg"
                    disabled={isSubmitting || paymentLoading}
                  >
                    {isSubmitting || paymentLoading ? (
                      "প্রসেসিং..."
                    ) : paymentMethod === "uddoktapay" ? (
                      "পেমেন্ট করুন"
                    ) : (
                      "অর্ডার কনফার্ম করুন"
                    )}
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      <Link to="/auth" className="text-primary hover:underline">
                        লগইন করুন
                      </Link>
                      {" "}অর্ডার ট্র্যাক করতে
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
