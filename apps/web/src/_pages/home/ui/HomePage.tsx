import { LandingNavbar } from './LandingNavbar';
import { ScrollAnimator } from './ScrollAnimator';
import { CostSection } from './sections/CostSection';
import { FlowSection } from './sections/FlowSection';
import { FooterSection, PricingSection } from './sections/FooterSection';
import { HeroSection } from './sections/HeroSection';
import { InventorySection } from './sections/InventorySection';
import { OperativeBentoSection } from './sections/OperativeBentoSection';
import { ProblemSection } from './sections/ProblemSection';
import './landing.css';

export function HomePage() {
  return (
    <main className="landing">
      <ScrollAnimator />
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <FlowSection />
      <InventorySection />
      <CostSection />
      <OperativeBentoSection />
      <PricingSection />
      <FooterSection />
    </main>
  );
}
