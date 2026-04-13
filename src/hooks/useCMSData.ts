import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Blog Posts
export const useBlogPosts = (publishedOnly = false) => {
  return useQuery({
    queryKey: ["blog-posts", publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (publishedOnly) {
        query = query.eq("is_published", true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useBlogPost = (idOrSlug: string | undefined) => {
  return useQuery({
    queryKey: ["blog-post", idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!idOrSlug,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: any) => {
      const { error } = await supabase.from("blog_posts").insert(post);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("ব্লগ পোস্ট যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করা যায়নি"),
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("blog_posts").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("ব্লগ পোস্ট আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("ব্লগ পোস্ট মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};

// Page Contents
export const usePageContents = () => {
  return useQuery({
    queryKey: ["page-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
};

export const usePageContent = (pageKey: string) => {
  return useQuery({
    queryKey: ["page-content", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page_key", pageKey)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!pageKey,
  });
};

export const useUpdatePageContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageKey, ...updates }: { pageKey: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("page_contents")
        .update(updates as any)
        .eq("page_key", pageKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
      toast.success("পেইজ কন্টেন্ট আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

// Homepage Sections
export const useHomepageSections = () => {
  return useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
};

export const useHomepageSection = (sectionKey: string) => {
  return useQuery({
    queryKey: ["homepage-section", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("section_key", sectionKey)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!sectionKey,
  });
};

export const useUpdateHomepageSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionKey, ...updates }: { sectionKey: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update(updates as any)
        .eq("section_key", sectionKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-section"] });
      toast.success("সেকশন আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

// Testimonials
export const useTestimonials = (activeOnly = false) => {
  return useQuery({
    queryKey: ["testimonials", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testimonial: any) => {
      const { error } = await supabase.from("testimonials").insert(testimonial);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("রিভিউ যোগ হয়েছে");
    },
    onError: () => toast.error("যোগ করা যায়নি"),
  });
};

export const useUpdateTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("testimonials").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("রিভিউ আপডেট হয়েছে");
    },
    onError: () => toast.error("আপডেট করা যায়নি"),
  });
};

export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("রিভিউ মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছে ফেলা যায়নি"),
  });
};
