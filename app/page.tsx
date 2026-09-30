import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import FeaturedGames from "@/components/landing/FeaturedGames";
import Challenges from "@/components/landing/Challenges";
import LeaderboardPreview from "@/components/landing/LeaderboardPreview";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="site-shell">
      <Navbar /><main><Hero /><Stats /><FeaturedGames /><Challenges /><LeaderboardPreview /><Features /><HowItWorks /><FinalCTA /></main><Footer />
    </div>
  );
}
