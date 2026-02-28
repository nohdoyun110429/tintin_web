import { Skull, AlertTriangle } from "lucide-react";

const Footer = () => {
  return (
    <footer id="about" className="border-t border-border bg-background/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Skull className="h-6 w-6 text-primary" />
              <span className="font-display text-xl tracking-widest">NO MERCY</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The underground market for those who show no mercy. 
              All transactions are final. No refunds. No questions.
            </p>
          </div>

          {/* Warning */}
          <div>
            <h4 className="font-display text-sm tracking-widest text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              DISCLAIMER
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is a fictional in-game weapon shop for entertainment purposes only. 
              All weapons, stats, and lore are part of a video game universe. 
              No real weapons are sold here.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm tracking-widest text-foreground mb-4">
              // INTEL
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer">Operations</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Support</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Secure Channel</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 NO MERCY. All rights reserved. 무자비한 자들을 위한 지하 시장
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
