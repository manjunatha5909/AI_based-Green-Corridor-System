import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureCards from "../components/FeatureCards";
import Stats from "../components/Stats";
function Landing() {
  return (
    <div className="gradient min-h-screen">
      <Navbar />
      <Hero />
      <FeatureCards />
      <Stats />
    </div>
  );
}

export default Landing;