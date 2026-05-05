import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { Lock } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumb currentPage="Privacy" />
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">PRIVACY</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Privacy <span className="text-gradient-primary">Policy</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2024</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="card-scientific space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect information you provide directly, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Account information (email, name, institution)</li>
                  <li>Research data you upload or generate</li>
                  <li>Usage data and platform interactions</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use collected information to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Provide and improve our research platform</li>
                  <li>Process and analyze your research queries</li>
                  <li>Communicate with you about your account</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>256-bit encryption for data in transit and at rest</li>
                  <li>Two-factor authentication options</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and audit logging</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal data. We may share information with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Service providers who assist in platform operations</li>
                  <li>Collaboration partner networks with your consent</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2>
                <p className="text-muted-foreground">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Access and download your data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use essential cookies for platform functionality and optional analytics 
                  cookies to improve our services. You can manage cookie preferences in your 
                  browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy-related inquiries, contact our Data Protection Officer at{" "}
                  <a href="mailto:privacy@cyberellum.com" className="text-primary hover:underline">
                    privacy@cyberellum.com
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

export default Privacy;
