import { HelpCircle, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { usePageContent } from "@/hooks/useCMSData";

const FAQ = () => {
  const { getItemCount } = useCart();
  const { data: pageContent, isLoading } = usePageContent("faq");

  const faqs = (pageContent?.content as any)?.questions || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartCount={getItemCount()} />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {pageContent?.title || "সাধারণ জিজ্ঞাসা"}
            </h1>
            <p className="text-muted-foreground">
              প্রায়শই জিজ্ঞাসিত প্রশ্ন ও উত্তর
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : faqs.length > 0 ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq: any, index: number) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground">
              কোন প্রশ্ন নেই
            </div>
          )}

          <div className="mt-8 p-6 bg-muted/50 rounded-xl text-center">
            <p className="text-muted-foreground mb-4">
              আপনার প্রশ্নের উত্তর পাননি?
            </p>
            <a href="/contact" className="text-primary hover:underline font-medium">
              আমাদের সাথে যোগাযোগ করুন →
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
