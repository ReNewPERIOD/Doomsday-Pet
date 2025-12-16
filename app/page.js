"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

/* ================= ASSETS ================= */
const VIDEO_BG = "/v4.mp4";

const MUSIC = {
  IDLE:   "https://files.catbox.moe/ind1d6.mp3",
  ACTION: "https://files.catbox.moe/7d9x1a.mp3",
  TENSE:  "https://files.catbox.moe/x1p9qz.mp3",
  WIN:    "https://files.catbox.moe/l9f5a2.mp3",
};

const SFX = {
  SMASH: "https://files.catbox.moe/8bq3r2.mp3",
  WIN:   "https://files.catbox.moe/z9w8x1.mp3",
};

/* ================= GAME ================= */
function Game() {
  /* ---------- REFS ---------- */
  const videoRef = useRef(null);
  const musicRef = useRef({});
  const sfxRef = useRef({});
  const currentMusicRef = useRef(null);
  const unlockedRef = useRef(false);
  const timerRef = useRef(null);

  /* ---------- STATE ---------- */
  const [audioReady, setAudioReady] = useState(false);

  // GAME ROUND STATE (QUAN TRỌNG)
  const [roundState, setRoundState] = useState("READY");
  const [timeLeft, setTimeLeft] = useState(0);

  // MEDIA STATE
  const [musicState, setMusicState] = useState("IDLE");
  const [status, setStatus] = useState("");

  /* =====================================================
     🔓 UNLOCK MEDIA
  ===================================================== */
  const unlockMedia = useCallback(() => {
    if (unlockedRef.current) return;

    Object.entries(MUSIC).forEach(([k, src]) => {
      const a = new Audio(src);
      a.loop = true;
      a.volume = 0.6;
      musicRef.current[k] = a;
    });

    Object.entries(SFX).forEach(([k, src]) => {
      const a = new Audio(src);
      a.volume = 1;
      sfxRef.current[k] = a;
    });

    try {
      const a = musicRef.current.IDLE;
      a.muted = true;
      a.play();
      a.pause();
      a.muted = false;
    } catch {}

    unlockedRef.current = true;
    setAudioReady(true);
  }, []);

  /* =====================================================
     🎼 MUSIC ENGINE
  ===================================================== */
  const playMusic = useCallback((state) => {
    if (!audioReady) return;
    if (currentMusicRef.current === state) return;

    Object.values(musicRef.current).forEach(a => {
      a.pause();
      a.currentTime = 0;
    });

    const track = musicRef.current[state];
    if (track) {
      track.play().catch(() => {});
      currentMusicRef.current = state;
    }
  }, [audioReady]);

  useEffect(() => {
    playMusic(musicState);
  }, [musicState, playMusic]);

  /* =====================================================
     ⏱ GAME TIMER
  ===================================================== */
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setRoundState("FINAL");
          setMusicState("TENSE");
          setStatus("😈 FINAL SECONDS!");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  /* =====================================================
     🎮 GAME ACTIONS
  ===================================================== */

  const startRound = () => {
    setRoundState("PLAYING");
    setTimeLeft(10); // demo 10s
    setMusicState("ACTION");
    setStatus("🔥 ROUND START!");
    startTimer();
  };

  const smash = () => {
    if (roundState !== "PLAYING") return;
    sfxRef.current.SMASH?.play().catch(() => {});
    setStatus("💥 SMASH!");
  };

  const win = () => {
    if (roundState !== "FINAL") return;
    clearInterval(timerRef.current);
    sfxRef.current.WIN?.play().catch(() => {});
    setRoundState("ENDED");
    setMusicState("WIN");
    setStatus("🏆 YOU WIN!");
  };

  const resetGame = () => {
    clearInterval(timerRef.current);
    setRoundState("READY");
    setMusicState("IDLE");
    setStatus("READY FOR NEXT ROUND");
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay loop muted playsInline
      >
        <source src={VIDEO_BG} type="video/mp4" />
      </video>

      <div className="relative z-10 h-full flex flex-col justify-end items-center pb-20">

        <div className="absolute top-2 right-2">
          <WalletMultiButton />
        </div>

        {!audioReady && (
          <button
            onPointerDown={unlockMedia}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl animate-pulse"
          >
            🔊 ENABLE SOUND
          </button>
        )}

        <div className="text-yellow-400 font-bold mb-2">
          {status}
        </div>

        {roundState === "READY" && (
          <button onPointerDown={startRound}
            className="px-10 py-4 bg-green-600 text-white font-black rounded-xl">
            🚀 START ROUND
          </button>
        )}

        {roundState === "PLAYING" && (
          <>
            <div className="text-white mb-2">⏳ {timeLeft}s</div>
            <button onPointerDown={smash}
              className="px-10 py-4 bg-red-600 text-white font-black rounded-xl">
              👊 SMASH
            </button>
          </>
        )}

        {roundState === "FINAL" && (
          <button onPointerDown={win}
            className="px-10 py-4 bg-yellow-500 text-black font-black rounded-xl">
            🏆 CLAIM WIN
          </button>
        )}

        {roundState === "ENDED" && (
          <button onPointerDown={resetGame}
            className="px-10 py-4 bg-blue-600 text-white font-black rounded-xl">
            🔁 NEXT ROUND
          </button>
        )}
      </div>
    </div>
  );
}

/* ================= PROVIDER ================= */
export default function Page() {
  const endpoint = clusterApiUrl("devnet");
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Game />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
