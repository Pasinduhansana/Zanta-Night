import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Lineup from "@/components/Lineup";
import Experience from "@/components/Experience";
import Sponsors from "@/components/Sponsors";
import TicketsSection from "@/components/TicketsSection";

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <Lineup />
      <Experience />
      <Sponsors />
      <TicketsSection />
    </>
  );
}
