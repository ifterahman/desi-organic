import { RotateCcw, CheckCircle, XCircle, Clock, Phone, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { usePageContent } from "@/hooks/useCMSData";

const ReturnPolicy = () => {
  const { getItemCount } = useCart();
  const { data: pageContent, isLoading } = usePageContent("return_policy");

  const sections = (pageContent?.content as any)?.sections || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartCount={getItemCount()} />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <RotateCcw className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {pageContent?.title || "রিটার্ন পলিসি"}
            </h1>
            <p className="text-muted-foreground">
              আমাদের রিটার্ন ও রিফান্ড নীতিমালা
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section: any, index: number) => (
                <div key={index} className="bg-card p-6 rounded-xl border border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Default content if no CMS data */}
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">রিটার্নের সময়সীমা</h2>
                    <p className="text-muted-foreground">
                      পণ্য গ্রহণের <strong>৭ দিনের</strong> মধ্যে রিটার্ন রিকোয়েস্ট করতে হবে।
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">যে ক্ষেত্রে রিটার্ন হবে</h2>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✓ পণ্য ক্ষতিগ্রস্ত বা ত্রুটিযুক্ত হলে</li>
                      <li>✓ ভুল পণ্য ডেলিভারি হলে</li>
                      <li>✓ পণ্যের মেয়াদ উত্তীর্ণ হলে</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-600 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">যে ক্ষেত্রে রিটার্ন হবে না</h2>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✗ ব্যবহৃত বা খোলা পণ্য</li>
                      <li>✗ গ্রাহকের অসাবধানতায় ক্ষতিগ্রস্ত পণ্য</li>
                      <li>✗ ৭ দিন পরে রিটার্ন রিকোয়েস্ট</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 bg-primary/5 p-6 rounded-xl text-center">
            <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">রিটার্নের জন্য যোগাযোগ</h3>
            <p className="text-muted-foreground">আমাদের হেল্পলাইনে কল করুন</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnPolicy;
