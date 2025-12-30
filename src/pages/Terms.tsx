import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">LEGAL</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Terms & <span className="text-gradient-primary">Conditions</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2024</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="card-scientific space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Cyberellum Technologies & Laboratory's research platform, 
                  you agree to be bound by these Terms and Conditions. If you do not agree to these 
                  terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Use of Services</h2>
                <p className="text-muted-foreground">
                  Our platform is designed for legitimate scientific research purposes. Users must:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Use the platform only for lawful research activities</li>
                  <li>Maintain the confidentiality of their account credentials</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not attempt to access data they are not authorized to view</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, features, and functionality of this platform are owned by 
                  Cyberellum Technologies and are protected by international copyright, 
                  trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Usage</h2>
                <p className="text-muted-foreground">
                  Users retain ownership of their research data. By using our platform, you grant 
                  us a license to process and store your data as necessary to provide our services. 
                  We do not sell or share your data with third parties without explicit consent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Disclaimer</h2>
                <p className="text-muted-foreground">
                  The platform is provided "as is" without warranties of any kind. Research results 
                  and AI-generated insights are for informational purposes only and should not be 
                  considered medical advice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Cyberellum Technologies shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages arising from your use of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about these terms, please contact us at{" "}
                  <a href="mailto:legal@cyberellum.com" className="text-primary hover:underline">
                    legal@cyberellum.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </ParallaxSection>

      <Footer />
    </div>
  );
};

export default Terms;
