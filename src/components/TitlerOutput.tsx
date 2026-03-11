import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { TitlerState, TitlerPreset } from "../types";

const TitlerOutput: React.FC = () => {
  const [state, setState] = useState<TitlerState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io({
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    
    socket.on("connect", () => {
      console.log("OBS Output: Connected to server via WebSocket");
      setConnected(true);
    });

    socket.on("connect_error", (err) => {
      console.error("OBS Output: Connection Error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("OBS Output: Disconnected:", reason);
      setConnected(false);
    });

    socket.on("titler-update", (newState: TitlerState) => {
      setState(newState);
    });

    return () => { socket.disconnect(); };
  }, []);

  if (!connected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs uppercase tracking-[0.3em]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
          Esperando Conexión...
        </div>
      </div>
    );
  }

  if (!state || !state.activePresetId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent text-zinc-500/20 font-mono text-[10px] uppercase tracking-widest">
        Sistema Listo - Sin Preset Activo
      </div>
    );
  }

  const activePreset = state.presets.find(p => p.id === state.activePresetId);

  useEffect(() => {
    if (activePreset?.fontFamily) {
      const fontId = 'dynamic-google-font';
      let link = document.getElementById(fontId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      const fontName = activePreset.fontFamily || 'Inter';
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
    }
  }, [activePreset?.fontFamily]);

  if (!activePreset) return null;

  const getPositionClasses = () => {
    switch (activePreset.position) {
      case "bottom-right": return "bottom-20 right-20";
      case "top-left": return "top-20 left-20";
      case "top-right": return "top-20 right-20";
      case "center-bottom": return "bottom-20 left-1/2 -translate-x-1/2";
      case "full-bottom": return "bottom-0 left-0 w-full";
      default: return "bottom-20 left-20";
    }
  };

  const getAnimationProps = (): any => {
    switch (activePreset.animationType) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.5 }
        };
      case "scale":
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 },
          transition: { type: "spring", damping: 15 }
        };
      case "bounce":
        return {
          initial: { y: 200, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 200, opacity: 0 },
          transition: { type: "spring", bounce: 0.6, duration: 0.8 }
        };
      default: // slide
        return {
          initial: { x: -1000, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -1000, opacity: 0 },
          transition: { type: "spring", damping: 25, stiffness: 120 }
        };
    }
  };

  const animationProps = getAnimationProps();

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-transparent">
      {!state.visible && (
        <div className="absolute top-4 right-4 text-[10px] font-mono text-zinc-500/30 uppercase tracking-widest pointer-events-none">
          Standby - {activePreset?.label}
        </div>
      )}
      <AnimatePresence mode="wait">
        {state.visible && (
          <motion.div
            key={activePreset.id}
            {...animationProps}
            className={`absolute ${getPositionClasses()}`}
          >
            {activePreset.type === "static" ? (
              <div 
                className="shadow-2xl flex flex-col justify-center border-l-[16px] relative overflow-hidden bg-cover bg-center"
                style={{ 
                  width: `${activePreset.width}px`,
                  height: `${activePreset.height}px`,
                  backgroundColor: activePreset.secondaryColor, 
                  borderColor: activePreset.primaryColor,
                  padding: '0 3rem',
                  borderRadius: activePreset.position === "full-bottom" ? "0" : "0 2rem 2rem 0",
                  backgroundImage: activePreset.backgroundImage ? `url(${activePreset.backgroundImage})` : 'none'
                }}
              >
                {activePreset.backgroundImage && (
                  <div className="absolute inset-0 bg-black/30 z-0"></div>
                )}

                <div className="relative z-10">
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ 
                      color: activePreset.textColor, 
                      fontFamily: activePreset.fontFamily,
                      fontSize: `${activePreset.fontSize || activePreset.height * 0.3}px`,
                      lineHeight: '1.1',
                      fontWeight: 900,
                      letterSpacing: '-0.02em'
                    }}
                    className="truncate"
                  >
                    {activePreset.name}
                  </motion.h1>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ 
                      color: activePreset.textColor, 
                      opacity: 0.8,
                      fontFamily: activePreset.fontFamily,
                      fontSize: `${(activePreset.fontSize || activePreset.height * 0.3) * 0.4}px`,
                      fontWeight: 500,
                      marginTop: '0.2rem'
                    }}
                    className="truncate"
                  >
                    {activePreset.role}
                  </motion.p>
                </div>
              </div>
            ) : activePreset.type === "crawl" ? (
              /* CRAWL / TICKER (GRAFT) MODE */
              <div 
                className="shadow-2xl flex items-center relative overflow-hidden bg-cover bg-center border-t-4"
                style={{ 
                  width: activePreset.position === "full-bottom" ? "100vw" : `${activePreset.width}px`,
                  height: `${activePreset.height}px`,
                  backgroundColor: activePreset.secondaryColor, 
                  borderColor: activePreset.primaryColor,
                  backgroundImage: activePreset.backgroundImage ? `url(${activePreset.backgroundImage})` : 'none'
                }}
              >
                {activePreset.backgroundImage && (
                  <div className="absolute inset-0 bg-black/40 z-0"></div>
                )}
                
                <div className="relative z-10 w-full overflow-hidden flex items-center">
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: "-100%" }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 300 / (activePreset.crawlSpeed || 10), 
                      ease: "linear" 
                    }}
                    style={{ 
                      color: activePreset.textColor, 
                      fontFamily: activePreset.fontFamily,
                      fontSize: `${activePreset.fontSize || activePreset.height * 0.6}px`,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      paddingLeft: "50px"
                    }}
                  >
                    {activePreset.name}
                  </motion.div>
                </div>
              </div>
            ) : (
              /* SECTION MODE */
              <div 
                className="shadow-2xl flex items-center justify-center relative overflow-hidden bg-cover bg-center"
                style={{ 
                  width: `${activePreset.width}px`,
                  height: `${activePreset.height}px`,
                  backgroundColor: activePreset.secondaryColor, 
                  borderBottom: `6px solid ${activePreset.primaryColor}`,
                  borderRadius: "0.5rem",
                  backgroundImage: activePreset.backgroundImage ? `url(${activePreset.backgroundImage})` : 'none'
                }}
              >
                {activePreset.backgroundImage && (
                  <div className="absolute inset-0 bg-black/20 z-0"></div>
                )}
                <div className="relative z-10 px-4 text-center">
                  <h2 
                    style={{ 
                      color: activePreset.textColor, 
                      fontFamily: activePreset.fontFamily,
                      fontSize: `${activePreset.fontSize || activePreset.height * 0.5}px`,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em"
                    }}
                    className="truncate"
                  >
                    {activePreset.name}
                  </h2>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TitlerOutput;
