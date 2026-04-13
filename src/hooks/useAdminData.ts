import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Products
export const useProducts = () => {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name_bn)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("products").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("পণ্য আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("পণ্য মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, products(count)")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: { name: string; name_bn: string; slug: string }) => {
      const { error } = await supabase.from("categories").insert(category);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("ক্যাটাগরি যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করা যায়নি"),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("ক্যাটাগরি আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};

// Orders
export const useOrders = () => {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("অর্ডার আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

// Coupons
export const useCoupons = () => {
  return useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: any) => {
      const { error } = await supabase.from("coupons").insert(coupon);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("কুপন যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করা যায়নি"),
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("coupons").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("কুপন আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("কুপন মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};

// Delivery Zones
export const useDeliveryZones = () => {
  return useQuery({
    queryKey: ["admin-delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("charge", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zone: any) => {
      const { error } = await supabase.from("delivery_zones").insert(zone);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("জোন যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করা যায়নি"),
  });
};

export const useUpdateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("delivery_zones").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("জোন আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("জোন মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};

// Banners
export const useBanners = () => {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (banner: any) => {
      const { error } = await supabase.from("banners").insert(banner);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("ব্যানার যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করা যায়নি"),
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("banners").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("ব্যানার আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("ব্যানার মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};

// Customers (Profiles)
export const useCustomers = () => {
  return useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

// Site Settings
export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data?.reduce((acc: any, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
    },
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: { key: string; value: any }[]) => {
      for (const setting of settings) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key: setting.key, value: setting.value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("সেটিংস সংরক্ষিত হয়েছে");
    },
    onError: () => toast.error("সংরক্ষণ করা যায়নি"),
  });
};

// Dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      // Today's orders
      const { count: todayOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      // Total products
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Total customers
      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Today's sales
      const { data: todaySales } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", today);

      const totalSales = todaySales?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      // Recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Low stock products
      const { data: lowStock } = await supabase
        .from("products")
        .select("name_bn, stock_quantity, low_stock_threshold")
        .lt("stock_quantity", 10)
        .gt("stock_quantity", 0)
        .limit(5);

      return {
        todayOrders: todayOrders || 0,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        todaySales: totalSales,
        recentOrders: recentOrders || [],
        lowStock: lowStock || [],
      };
    },
  });
};

// Chat
export const useChatSessions = () => {
  return useQuery({
    queryKey: ["admin-chat-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useChatMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["chat-messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};
