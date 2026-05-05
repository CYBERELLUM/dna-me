import { Link } from "react-router-dom";
import { Dna, Mail, Github, Linkedin, Twitter } from "lucide-react";
import cyberellumLogo from "@/assets/cyberellum-logo.png";
import axiomBadge from "@/assets/axiom-compliance-badge.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={cyberellumLogo} 
                alt="Cyberellum Technologies and Laboratory" 
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">CYBERELLUM</span>
                <span className="font-semibold text-foreground text-sm">Technologies and Laboratory</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced genomics research platform powered by multi-AI synthesis with LLM, multimodal ML, GAN, and a collaborative partner network.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Research Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Dna className="w-4 h-4 text-primary" />
              Research
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/library" className="text-muted-foreground hover:text-foreground transition-colors">
                  Genomics Library
                </Link>
              </li>
              <li>
                <Link to="/sequences" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sequences
                </Link>
              </li>
              <li>
                <Link to="/visualizations" className="text-muted-foreground hover:text-foreground transition-colors">
                  3D Visualizations
                </Link>
              </li>
              <li>
                <Link to="/nutrigenomics" className="text-muted-foreground hover:text-foreground transition-colors">
                  Nutrigenomics
                </Link>
              </li>
              <li>
                <Link to="/collaborate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Collaboration Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/notebook" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lab Notebook
                </Link>
              </li>
              <li>
                <Link to="/data-vault" className="text-muted-foreground hover:text-foreground transition-colors">
                  Data Vault
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blogs & News
                </Link>
              </li>
              <li>
                <a href="https://www.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  NCBI Database
                </a>
              </li>
              <li>
                <a href="https://www.ensembl.org/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ensembl
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Cyberellum Technologies & Laboratory. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              All Systems Operational
            </span>
            <span>v2.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
