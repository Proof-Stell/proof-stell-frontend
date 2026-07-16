import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navbar } from "@/components/landing/Navbar";
import { useRouter } from "next/router";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import { useWallet } from "@/components/providers";

export default function Home() {
  const router = useRouter();
  const { status, error } = useWallet();

  const handleLoginClick = () => {
    router.push("/signup");
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Navbar onLoginClick={handleLoginClick} />

      {/* Graceful wallet error banner */}
      {status === "error" && error && (
        <div
          role="alert"
          style={{
            background: "#3b1a1a",
            borderBottom: "1px solid #ff6b6b",
            color: "#ffb3b3",
            fontSize: 14,
            padding: "10px 24px",
            textAlign: "center",
          }}
        >
          ⚠ Wallet unavailable: {error.message}. You can still browse the app.
        </div>
      )}

      <HeroSection onSignUp={() => router.push("/signup")} />
      <TestimonialsSection />
      <FeaturesSection />
    </main>
  );
}