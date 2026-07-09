import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EcosystemStrip from "@/components/EcosystemStrip";
import PropertyTerminal from "@/components/PropertyTerminal";
import InvestmentMethods from "@/components/InvestmentMethods";
import StatsStrip from "@/components/StatsStrip";
import WhyUs from "@/components/WhyUs";
import Roadmap from "@/components/Roadmap";
import PapersSection from "@/components/PapersSection";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <EcosystemStrip />
        <PropertyTerminal />
        {/* <InvestmentMethods /> */}
        <StatsStrip />
        <WhyUs />
        {/* <Roadmap /> */}
        <PapersSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <Watermark />
    </>
  );
}
