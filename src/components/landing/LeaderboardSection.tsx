"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PlayerCard } from "../leaderboard/PlayerCard";
import { mockPlayers } from "@/lib/mockData";
import { env } from "@/config/environment";
import { SECTION_IDS } from "@/config/landingContent";

interface Player {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  level: number;
  points: number;
  avatar: string;
  wallet?: string;
  achievements: Achievement[];
  streak: number;
  gamesPlayed: number;
  winRate: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export function LeaderboardSection() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate API call
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        if (env.NEXT_PUBLIC_ENABLE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setPlayers(mockPlayers as Player[]);
        } else {
          // Replace with real API call
          // const res = await fetch('/api/leaderboard');
          // const data = await res.json();
          // setPlayers(data);
          throw new Error("API not implemented yet");
        }
      } catch (error) {
        setError("Failed to load leaderboard data");
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Set up polling for real-time updates
    const interval = setInterval(fetchLeaderboard, 180000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#060a10]"
        role="status" 
        aria-live="polite"
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" aria-hidden="true" />
          <p className="text-white/80 font-mono">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#060a10]"
        role="alert"
      >
        <div className="text-center px-4">
          <p className="text-red-400 mb-4 font-mono">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-mono"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section 
      id={SECTION_IDS.LEADERBOARD} 
      className="container mx-auto px-4 py-12"
      style={{ scrollMarginTop: 100 }}
      aria-labelledby="leaderboard-heading"
    >
      <div className="text-center mb-12">
        <h1 id="leaderboard-heading" className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4">
          Global Leaderboard
        </h1>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          See the top players from around the world and compete to claim your
          spot at the top.
        </p>
      </div>

      {/* Styled ranked ordered list */}
      <ol 
        className="max-w-4xl mx-auto space-y-4 list-none p-0"
        aria-label="Leaderboard standings"
      >
        {players.map((player, index) => (
          <li key={player.id}>
            <PlayerCard player={player} index={index} />
          </li>
        ))}
      </ol>
    </section>
  );
}