import { useEffect, useRef, ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export const ParallaxSection = ({ children, className = "", speed = 0.5 }: ParallaxSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !bgRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const rate = scrolled * speed;
      
      bgRef.current.style.transform = `translateY(${rate}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <section ref={sectionRef} className={`parallax-section min-h-screen ${className}`}>
      <div ref={bgRef} className="parallax-bg grid-bg opacity-30" />
      <div className="relative z-10">{children}</div>
    </section>
  );
};
