"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

/* =================== CONFIG =================== */
const PROGRAM_ID = new PublicKey("CrwC7ekPmUmmuQPutMzBXqQ4MTydjw1EVS2Zs3wpk9fc");
const GAME_ADDRESS = new PublicKey("DQeCu4DA43CeMFmBghXqcFtz123tgRGruCxhvqcGoW1Y");

/* Only 1 video v4.mp4 */
const VIDEO = "/v4.mp4";

/* IMG */
const IMG_FIST = "https://img.upanh.moe/1fdsF7NQ/FIST2-removebg-webp.webp";
const IMG_HERO = "https://img.upanh.moe/HTQcpVQD/web3-removebg-webp.webp";
const AUDIO_BATTLE_THEME = "https://files.catbox.moe/ind1d6.mp3";

/* =================== CSS =================== */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&display=swap');
body { margin: 0; overflow: hidden; background:#000; }

/* SHAKES */
@keyframes shake-light {0%{transform:translate(0);}25%{transform:translate(-3px,3px);}75%{transform:translate(3px,-3px);}100%{transform:translate(0);}}

/* layout */
.game-wrapper { position: relative; width:100vw; height:100vh; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; }
.bg-video { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; filter:brightness(.7); }

/* effects */
.hit-shake { animation:shake-light .35s ease-out; }

/* hero */
.hero-layer { position:absolute; right:3%; bottom:20%; width:25%; max-width:300px; z-index:5; pointer-events:none; filter:drop-shadow(0 0 20px cyan); }
.fist-layer { position:absolute; right:18%; bottom:25%; width:45%; max-width:700px; z-index:6; animation:punch-loop .8s infinite ease-in-out; pointer-events:none; }

@keyframes punch-loop {0%{transform:translateX(0);}20%{transform:translateX(20px);}40%{transform:translateX(-180px);}100%{transform:translateX(0);}}

/* HUD bottom */
.hud-overlay { position:relative; z-index:20; width:100%; padding:20px 40px 30px;
  background:linear-gradient(to top, rgba(0,0,0,.98) 70%, transparent);
  border-top:1px solid rgba(0,229,255,.3); display:flex; gap:20px; align-items:flex-end;
}

.chart-hp-frame { width:100%; height:25px; background:#33000080; border:2px solid #ff3300; transform:skewX(-10deg); overflow:hidden; }
.chart-hp-fill { height:100%; background:linear-gradient(90deg,#ff0000,#aa0000); transition:width .25s ease-out; }

/* buttons */
.combat-btn {
  width:100%; padding:20px; font-size:1.5rem; font-family:'Rajdhani';
  border:none; cursor:pointer; color:white; font-weight:800;
  background:linear-gradient(90deg,#00c6ff,#0072ff);
  clip-path: polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
}
.combat-btn:disabled { background:#555; color:#aaa; }

/* loot button */
.btn-loot { background:linear-gradient(90deg,#f1c40f,#f39c12); color:black; }

/* Top-right HUD */
.extra-hud {
  position: fixed; top:70px; right:20px; z-index:9999;
  width:260px; padding:12px; background:#0009; color:#0ef;
  border:1px solid #0ef; backdrop-filter:blur(4px);
}

.music-btn { position: fixed; top:70px; left:20px; z-index:60; background:#0009; border:1px solid #0ef; color:#0ef; padding:10px; cursor:pointer; border-radius:50%; width:40px; height:40px; }
`;

/* helper */
const shortenAddress = (x) => x ? x.slice(0,6)+".."+x.slice(-4) : "WAIT";
  
/* single video component */
const BackgroundVideo = ({ isHit }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.play().catch(()=>{});
  }, []);
  return (
    <video
      ref={ref}
      className={`bg-video ${isHit ? "hit-shake" : ""}`}
      src={VIDEO}
      autoPlay loop muted playsInline
    />
  );
};

/* =================== MAIN =================== */
export default function Home() {
  const { publicKey, connect } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [gameState, setGameState] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(30);
  const [pot, setPot] = useState(0);
  const [isHit, setIsHit] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  /* ===== Connection ===== */
  const endpoint = clusterApiUrl("devnet");
  const connectionRef = useRef(new Connection(endpoint, "processed"));
  const connection = connectionRef.current;

  /* Dummy wallet */
  const dummyWallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };

  const getProvider = useCallback(
    (needSigner=false) => {
      const wallet = needSigner ? anchorWallet : (anchorWallet || dummyWallet);
      if (needSigner && !anchorWallet) return null;
      return new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    },
    [anchorWallet, connection]
  );

  /* ===== Audio ===== */
  useEffect(() => {
    audioRef.current = new Audio(AUDIO_BATTLE_THEME);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;
    audioRef.current.muted = isMuted;
    setIsClient(true);
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(()=>{});
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  /* ===== Fetch chain state ===== */
  const fetchGameState = useCallback(async () => {
    try {
      const provider = getProvider(false);
      const program = new Program(idl, PROGRAM_ID, provider);

      const acc = await program.account.gameData.fetch(GAME_ADDRESS);
      const bal = await connection.getBalance(GAME_ADDRESS);

      setGameState(acc);
      setPot(bal / 1e9);

      const ttl = acc.timeToLive.toNumber();
      setMaxTime(ttl);

      const lastFed = acc.lastFedTimestamp.toNumber();
      const now = Math.floor(Date.now() / 1000);

      if (lastFed === 0) {
        // WAITING MODE – ALWAYS reset to full TTL
        setTimeLeft(ttl);
      } else {
        setTimeLeft(Math.max(0, lastFed + ttl - now));
      }
    } catch(e) {
      console.log("fetch error", e);
    }
  }, [getProvider, connection]);

  /* ===== Realtime subscription + fallback poll ===== */
  useEffect(() => {
    if (!isClient) return;
    
    fetchGameState();

    let subId = connection.onAccountChange(GAME_ADDRESS, fetchGameState, "processed");
    const poll = setInterval(fetchGameState, 4000);

    // FIX: countdown runs ONLY when game running
    const ticker = setInterval(() => {
      setTimeLeft(t => {
        if (!gameState) return t;
        const lastFed = gameState.lastFedTimestamp.toNumber();

        if (lastFed === 0) {
          // NEW ROUND WAITING → never countdown
          return maxTime;
        }
        return Math.max(0, t - 1);
      });
    }, 1000);

    return () => {
      connection.removeAccountChangeListener(subId).catch(()=>{});
      clearInterval(poll);
      clearInterval(ticker);
    };
  }, [isClient, gameState, maxTime, fetchGameState]);

  /* Derived states */
  const isWaiting = gameState && gameState.lastFedTimestamp.toNumber() === 0;
  const isDead = timeLeft <= 0 && !isWaiting;
  const hpPercent = Math.min(100, (timeLeft / maxTime) * 100);

  /* ===== FEED ===== */
  const feedBeast = async () => {
    if (!anchorWallet || !publicKey) {
      if (connect) try { await connect(); } catch(e) {} 
      else return alert("Connect wallet");
    }
    if (processing || isDead) return;

    setProcessing(true);
    setIsHit(true);
    setTimeout(() => setIsHit(false), 350);

    try {
      const provider = getProvider(true);
      const program = new Program(idl, PROGRAM_ID, provider);

      await program.methods.feed().accounts({
        gameAccount: GAME_ADDRESS,
        player: publicKey,
        systemProgram: web3.SystemProgram.programId
      }).rpc();

      // optimistic refill
      setTimeLeft(maxTime);

      setTimeout(fetchGameState, 700);
    } catch(e) {
      alert("Feed error: " + e.message);
      setTimeout(fetchGameState, 700);
    }
    setProcessing(false);
  };

  /* ===== CLAIM ===== */
  const claimPrize = async () => {
    if (processing) return;
    if (!anchorWallet || !publicKey) return alert("Connect wallet");

    if (!isDead) return alert("Wait until 0s!");

    setProcessing(true);
    try {
      const provider = getProvider(true);
      const program = new Program(idl, PROGRAM_ID, provider);

      const winner = new PublicKey(gameState.lastFeeder);

      await program.methods.claimReward().accounts({
        gameAccount: GAME_ADDRESS,
        hunter: publicKey,
        winner
      }).rpc();

      alert("Claim success!");
      await fetchGameState();
    } catch(e) {
      alert("Claim error: " + e.message);
    }
    setProcessing(false);
  };

  if (!isClient) return null;

  /* ===== RENDER ===== */
  return (
    <div className="game-wrapper">
      <style>{styles}</style>

      {/* BG VIDEO */}
      <BackgroundVideo isHit={isHit} />

      {/* HERO */}
      {!isDead && <img src={IMG_HERO} className="hero-layer" />}
      {!isDead && <img src={IMG_FIST} className="fist-layer" />}

      {/* TOP BAR */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", padding:20,
        display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:30 }}>
        <h1 style={{ margin:0, color:"#fff", fontFamily:"Press Start 2P", fontSize:"1rem" }}>
          WEB3 <span style={{ color:"#0ef" }}>FIGHTER</span>
        </h1>
        <WalletMultiButton />
      </div>

      {/* MUSIC */}
      <div className="music-btn" onClick={toggleSound}>
        {isMuted ? "🔇" : "🔊"}
      </div>

      {/* BOTTOM HUD */}
      <div className="hud-overlay">
        <div style={{ flex:2 }}>
          <div style={{ color:"#ff3300", marginBottom:5, display:"flex", justifyContent:"space-between" }}>
            <span>BTC ARMOR</span>
            <span>{timeLeft}s</span>
          </div>

          <div className="chart-hp-frame">
            <div className="chart-hp-fill" style={{ width:`${hpPercent}%` }}></div>
          </div>
        </div>

        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
          <button className="combat-btn" disabled={processing || isDead} onClick={feedBeast}>SMASH</button>
          <button className="combat-btn btn-loot" disabled={processing || !isDead} onClick={claimPrize}>CLAIM</button>
        </div>
      </div>

      {/* TOP RIGHT HUD */}
      <div className="extra-hud">
        <div>Pot: <span style={{ color:"#fff" }}>{pot.toFixed(2)} SOL</span></div>
        <div>Last: <span style={{ color:"#fff" }}>{shortenAddress(gameState?.lastFeeder?.toString() || "")}</span></div>
      </div>
    </div>
  );
}
