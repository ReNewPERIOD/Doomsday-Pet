"use client";
import { useState, useEffect, useRef } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// --- CẤU HÌNH ---
const PROGRAM_ID = new PublicKey("CrwC7ekPmUmmuQPutMzBXqQ4MTydjw1EVS2Zs3wpk9fc");
const GAME_ADDRESS = new PublicKey("CKLoD6Y96itdYXxkM58aGr4Sz3rEMXzmaxGCPtbuNbiU");

// --- URL VIDEO ---
const VIDEO_NORMAL   = "/v1.mp4"; 
const VIDEO_DAMAGED  = "/v2.mp4"; 
const VIDEO_DEFEATED = "/v3.mp4"; 

// --- ASSETS ---
const IMG_FIST = "https://img.upanh.moe/1fdsF7NQ/FIST2-removebg-webp.webp";
const IMG_HERO = "https://img.upanh.moe/HTQcpVQD/web3-removebg-webp.webp";
const AUDIO_BATTLE_THEME = "https://files.catbox.moe/ind1d6.mp3";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&display=swap');

  body { margin: 0; background: #000; overflow: hidden; touch-action: none; }
  
  @keyframes punch-loop {
    0% { transform: translateX(0) scale(1); }
    20% { transform: translateX(30px) scale(0.9); } 
    40% { transform: translateX(-180px) scale(1.1); } 
    100% { transform: translateX(0) scale(1); }
  }

  @keyframes screen-shake-light { 0% { transform: translate(0, 0); } 25% { transform: translate(-3px, 3px); } 75% { transform: translate(3px, -3px); } 100% { transform: translate(0, 0); } }
  @keyframes screen-shake-strong { 0% { transform: translate(0, 0); } 20% { transform: translate(-7px, 7px); } 40% { transform: translate(7px, -7px); } 60% { transform: translate(-7px, 7px); } 80% { transform: translate(7px, -7px); } 100% { transform: translate(0, 0); } }

  .game-wrapper {
    position: relative; width: 100vw; height: 100vh; overflow: hidden;
    display: flex; flex-direction: column; justify-content: flex-end;
  }

  /* VIDEO STACK */
  .video-stack { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; background: #000; }
  .bg-video-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.5s ease-in-out; opacity: 0; filter: brightness(0.6); }
  .bg-video-layer.active { opacity: 1; z-index: 1; }
  .bg-hit-light { animation: screen-shake-light 0.3s ease-out; }
  .bg-hit-strong { animation: screen-shake-strong 0.4s ease-in-out; filter: hue-rotate(-20deg) contrast(1.2) brightness(1.2); }

  .hero-layer { position: absolute; right: 2%; bottom: 20%; width: 25%; max-width: 300px; z-index: 4; filter: drop-shadow(0 0 20px #00e5ff); pointer-events: none; }
  .fist-layer { position: absolute; right: 18%; bottom: 25%; width: 45%; max-width: 700px; z-index: 5; animation: punch-loop 0.8s infinite ease-in-out; pointer-events: none; filter: drop-shadow(0 0 15px #00e5ff); }

  /* MOBILE OPTIMIZATION */
  @media (max-width: 768px) {
    .bg-video-layer { object-position: 65% center; }
    .fist-layer { width: 70%; bottom: 35%; right: 5%; }
    .hero-layer { width: 40%; bottom: 25%; right: -10%; }
    .extra-hud { top: 80px !important; left: 10px !important; right: auto !important; width: 150px !important; padding: 8px !important; font-size: 0.65rem !important; background: rgba(0,0,0,0.6) !important; border: 1px solid rgba(0,229,255,0.3) !important; }
    .combat-btn { padding: 18px !important; font-size: 1.3rem !important; }
  }

  .hud-overlay { position: relative; z-index: 20; width: 100%; padding: 20px 40px 30px; background: linear-gradient(to top, rgba(0,0,0,0.98) 70%, transparent); border-top: 1px solid rgba(0, 229, 255, 0.3); display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
  .chart-hp-frame { width: 100%; height: 25px; background: rgba(20, 0, 0, 0.6); border: 2px solid #ff3300; transform: skewX(-10deg); overflow: hidden; }
  .chart-hp-fill { height: 100%; background: repeating-linear-gradient(45deg, #ff0000 0, #ff0000 5px, #990000 5px, #990000 10px); box-shadow: 0 0 30px #ff0000; transition: width 0.3s ease-out; }

  .combat-btn { width: 100%; padding: 20px; font-size: 1.5rem; font-family: 'Rajdhani', sans-serif; font-weight: 800; border: none; cursor: pointer; color: white; background: linear-gradient(90deg, #00c6ff, #0072ff); clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); box-shadow: 0 0 20px rgba(0, 198, 255, 0.5); letter-spacing: 2px; transition: all 0.2s; }
  .combat-btn:active { transform: scale(0.95); background: #fff; color: #000; }
  .combat-btn:disabled { background: #555; color: #aaa; cursor: not-allowed; box-shadow: none; }
  
  .btn-loot { background: linear-gradient(90deg, #f1c40f, #f39c12); color: black; animation: pulse 1s infinite; }
  .btn-loot:disabled { animation: none; background: #444; color: #888; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 #f1c40f; } 100% { box-shadow: 0 0 30px #f1c40f; } }
  
  .font-pixel { font-family: 'Press Start 2P', cursive; text-transform: uppercase; }
  .font-tech { font-family: 'Rajdhani', sans-serif; font-weight: 700; text-transform: uppercase; }

  .extra-hud { position: absolute; top: 80px; right: 30px; width: 260px; padding: 15px; border: 1px solid #00e5ff; color: #00e5ff; font-family: 'Rajdhani', sans-serif; font-weight: 700; text-transform: uppercase; background: rgba(0, 0, 0, 0.8); z-index: 50; pointer-events: none; }
  .extra-hud small { font-weight: 400; font-size: 0.8rem; color: #ccc; }

  .music-btn { position: fixed; top: 80px; left: 20px; z-index: 50; background: rgba(0,0,0,0.6); border: 1px solid #00e5ff; color: #00e5ff; padding: 10px; cursor: pointer; font-family: 'Press Start 2P'; font-size: 0.8rem; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
`;

const shortenAddress = (address) => {
  if (!address) return "WAITING...";
  const str = address.toString();
  return str.slice(0, 4) + ".." + str.slice(-4);
};

// COMPONENT VIDEO
const BackgroundVideo = ({ src, shakeClass }) => {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
        }
    }, [src]);
    return (
        <video 
            ref={videoRef}
            className={`bg-video-layer ${shakeClass}`} 
            autoPlay loop muted playsInline
            src={src}
        />
    );
};

function GameContent() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [gameState, setGameState] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(60); 
  const [potBalance, setPotBalance] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [lastHitter, setLastHitter] = useState(null);
  const [topHitters, setTopHitters] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsClient(true);
    audioRef.current = new Audio(AUDIO_BATTLE_THEME);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) playPromise.catch(() => {});
  }, []);

  const toggleSound = () => {
      if (!audioRef.current) return;
      if (audioRef.current.paused) { audioRef.current.play(); setIsMuted(false); } 
      else { audioRef.current.pause(); setIsMuted(true); }
  };

  const fetchGameState = async () => {
    try {
      const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: "processed" });
      const program = new Program(idl, PROGRAM_ID, provider);
      const account = await program.account.gameData.fetch(GAME_ADDRESS);
      const balance = await connection.getBalance(GAME_ADDRESS);
      
      setGameState(account);
      setPotBalance(balance / 1000000000); 
      
      const ttl = account.timeToLive.toNumber();
      if(ttl > 0) setMaxTime(ttl);

      const lastFed = account.lastFedTimestamp.toNumber();
      if (lastFed === 0) {
          setTimeLeft(ttl);
      } else {
          const now = Math.floor(Date.now() / 1000);
          setTimeLeft(Math.max(0, (lastFed + ttl) - now));
      }

      setLastHitter(account.lastFeeder?.toString() || null);
      setTopHitters([{ address: 'Ff3r...1a2b', hits: 15 }, { address: 'Aa2d...4e5f', hits: 12 }, { address: 'Cc9t...7y8z', hits: 8 }]);
    } catch (err) {
       console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    fetchGameState(); 
    const interval = setInterval(() => {
        fetchGameState();
        if (gameState && gameState.lastFedTimestamp.toNumber() !== 0) {
             setTimeLeft((prev) => Math.max(0, prev - 1));
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [publicKey, isClient]);

  const hpPercent = maxTime > 0 ? Math.min(100, (timeLeft / maxTime) * 100) : 100;
  const isWaiting = gameState && gameState.lastFedTimestamp.toNumber() === 0;
  const isDead = timeLeft === 0 && !isWaiting;

  const getShakeClass = () => {
    if (!isHit) return "";
    if (hpPercent < 50) return "bg-hit-strong";
    return "bg-hit-light";
  };

  const getCurrentVideoState = () => {
      if (isDead) return 'dead'; 
      if (isHit) return 'damaged'; 
      if (hpPercent < 50 && !isWaiting) return 'damaged';
      return 'normal';
  };
  const currentState = getCurrentVideoState();

  const feedBeast = async () => {
    if (!publicKey || isProcessing) return;
    setIsProcessing(true);

    try {
      if(audioRef.current && audioRef.current.paused && !isMuted) audioRef.current.play();
      setIsHit(true); setTimeout(() => setIsHit(false), 400); 
      
      const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: "processed" });
      const program = new Program(idl, PROGRAM_ID, provider);
      
      const tx = await program.methods.feed().accounts({
        gameAccount: GAME_ADDRESS, player: publicKey, systemProgram: web3.SystemProgram.programId,
      }).rpc();
      
      console.log("Feed tx:", tx);
      setTimeout(fetchGameState, 1200);

    } catch (err) { 
        console.error("Feed err:", err);
        if (err && err.message && err.message.includes("GameIsDead")) {
            alert("⚠️ Too late! The Giant is dead. Wait for Claim.");
        } else {
            alert("Attack Failed: " + (err.message || "Unknown Error"));
        }
        setTimeout(fetchGameState, 800);
    } finally {
        setIsProcessing(false);
    }
  };

  const claimPrize = async () => {
     if (!publicKey || !gameState || isProcessing) return;
     if (timeLeft > 0) { alert("Wait until timer hits 0s!"); return; }
     
     setIsProcessing(true);

     try {
       const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: "processed" });
       const program = new Program(idl, PROGRAM_ID, provider);
       
       const winnerAddress = new PublicKey(gameState.lastFeeder);

       await program.methods.claimReward().accounts({
         gameAccount: GAME_ADDRESS, hunter: publicKey, winner: winnerAddress
       }).rpc();
       
       alert(`🏆 MISSION SUCCESS! Bounty Earned! Game Resetting...`);
       setTimeout(fetchGameState, 1200);

     } catch (err) { 
         console.error("Claim err:", err);
         const msg = err?.message || String(err);
         
         if (msg.includes("GameIsAlive")) {
             await fetchGameState();
             alert("⚠️ Syncing... Chain says game is still running. Try again in 2s!");
         } else {
             alert("Claim Error: " + msg); 
         }
         setTimeout(fetchGameState, 800);
     } finally {
         setIsProcessing(false);
     }
  };

  if (!isClient) return null;

  return (
    <div className="game-wrapper">
      <style>{styles}</style>

      <div className={`video-stack ${getShakeClass()}`}>
          <video className={`bg-video-layer ${currentState === 'normal' ? 'active' : ''}`} autoPlay loop muted playsInline><source src={VIDEO_NORMAL} type="video/mp4" /></video>
          <video className={`bg-video-layer ${currentState === 'damaged' ? 'active' : ''}`} autoPlay loop muted playsInline><source src={VIDEO_DAMAGED} type="video/mp4" /></video>
          <video className={`bg-video-layer ${currentState === 'dead' ? 'active' : ''}`} autoPlay loop muted playsInline><source src={VIDEO_DEFEATED} type="video/mp4" /></video>
      </div>

      {!isDead && <img src={IMG_HERO} className="hero-layer" alt="Hero" />}
      {(!isDead && !isWaiting) && <img src={IMG_FIST} className="fist-layer" alt="Fist" />}

      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", padding: "20px", display: "flex", justifyContent: "space-between", zIndex: 30, alignItems: "center" }}>
        <div><h1 className="font-pixel" style={{ margin: 0, fontSize: "1.2rem", color: "#fff", textShadow: "0 0 20px #00e5ff" }}>WEB3 <span style={{color:"#00e5ff"}}>FIGHTER</span></h1></div>
        <WalletMultiButton style={{ background: "rgba(0,0,0,0.5)", border: "2px solid #00e5ff", fontFamily: "'Rajdhani'", fontSize: "0.8rem", height: "36px", padding: "0 10px" }} />
      </div>

      <button className="music-btn" onClick={toggleSound}>{isMuted || (audioRef.current && audioRef.current.paused) ? "🔇" : "🔊"}</button>

      {publicKey ? (
        <div className="hud-overlay">
            <div style={{ flex: 2, minWidth: "200px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#ff3300", fontWeight: "bold" }}>
                    <span className="font-tech" style={{fontSize: "0.9rem"}}>BTC ARMOR</span>
                    <span className="font-tech" style={{fontSize: "1.2rem"}}>{isWaiting ? "60s" : timeLeft + "s"}</span>
                </div>
                <div className="chart-hp-frame">
                    <div className="chart-hp-fill" style={{ width: `${hpPercent}%` }}></div>
                </div>
            </div>

            <div style={{ flex: 1, textAlign: "center", minWidth: "120px" }}>
                <div className="font-tech" style={{ color: "#aaa", fontSize: "0.8rem" }}>TOTAL LOOT</div>
                <div className="font-pixel" style={{ color: "#ffd700", fontSize: "1.5rem", textShadow: "0 0 20px #ffd700" }}>
                    {potBalance.toFixed(4)}
                </div>
            </div>

            <div style={{ flex: 1, minWidth: "150px" }}>
                <div style={{ width: "100%" }}>
                    {isDead ? (
                        <button className="combat-btn btn-loot" onClick={claimPrize} disabled={isProcessing}>
                            {isProcessing ? "PROCESSING..." : "💎 CLAIM"} <span style={{fontSize: "0.7rem"}}>(2%)</span>
                        </button>
                    ) : (
                        <button className="combat-btn" onClick={feedBeast} disabled={isProcessing}>
                            {isProcessing ? "..." : (isWaiting ? "🚀 START GAME" : "👊 SMASH")}
                        </button>
                    )}
                </div>
            </div>
        </div>
      ) : (
        <div style={{ position: "absolute", bottom: "30%", width: "100%", textAlign: "center", zIndex: 30 }}>
            <h2 className="font-pixel" style={{ fontSize: "1.5rem", color: "#fff", textShadow: "0 0 30px #00e5ff", animation: "pulse 2s infinite" }}>CONNECT WALLET</h2>
        </div>
      )}

      <div className="extra-hud">
        <div style={{marginBottom: "5px"}}>
          <div>LAST HITTER</div>
          <small style={{color: "#fff"}}>{lastHitter ? shortenAddress(lastHitter) : "---"}</small>
        </div>
        <div style={{ marginTop: "5px", paddingTop: "5px", borderTop: "1px dashed #00e5ff" }}>
          <div>TOP HITTERS</div>
          {topHitters.map((hitter, index) => (
             <div key={index} style={{display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginTop: "3px"}}>
                <span style={{color: "#fff"}}>{index + 1}. {shortenAddress(hitter.address)}</span>
                <span style={{color: "#ffd700"}}>{hitter.hits}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const endpoint = clusterApiUrl("devnet");
  const wallets = [new PhantomWalletAdapter()];
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <GameContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
// test update