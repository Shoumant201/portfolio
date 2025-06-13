import Image from "next/image";
import ParticleBackground from "./components/ParticleBackground";

export default function Home() {
  return (
    <main className="relative h-screen text-white">
      <ParticleBackground />
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-5xl font-bold">Hello, Next.js + Three.js!</h1>
      </div>
    </main>
  );
}
