import { Button } from "@/components/ui/button";
import { Crosshair, ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blood via-blood-dark to-background" />
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-line" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 animate-fade-up">
        {/* Decorative crosshairs */}
        <div className="flex justify-center gap-4 mb-6">
          <Crosshair className="h-8 w-8 text-primary animate-pulse" />
          <Crosshair className="h-8 w-8 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Crosshair className="h-8 w-8 text-primary animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Main headline */}
        <h1 className="font-display text-6xl sm:text-7xl md:text-9xl text-foreground tracking-wider mb-4 text-blood-glow">
          PREPARE
        </h1>
        <h1 className="font-display text-6xl sm:text-7xl md:text-9xl text-primary tracking-wider mb-8 animate-flicker">
          TO DIE
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-4 font-body">
          The underground market for those who show no mercy.
        </p>
        <p className="text-sm text-primary/70 tracking-widest mb-10 font-display">
          무자비한 자들을 위한 지하 시장
        </p>

        {/* CTA Button */}
        <Button 
          variant="hero" 
          size="xl"
          className="group"
          onClick={() => document.getElementById('weapons')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Crosshair className="h-5 w-5 group-hover:animate-spin" />
          SHOP NOW
        </Button>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-20 left-4 w-20 h-20 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-20 right-4 w-20 h-20 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-20 left-4 w-20 h-20 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-20 right-4 w-20 h-20 border-r-2 border-b-2 border-primary/30" />
    </section>
  );
};

export default HeroSection;
