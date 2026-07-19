import { Hero } from "@/features/landing/hero";
import { Features } from "@/features/landing/features";
import { Stats } from "@/features/landing/stats";
import { Testimonials } from "@/features/landing/testimonials";
import { Cta } from "@/features/landing/cta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <Cta />
    </>
  );
}
