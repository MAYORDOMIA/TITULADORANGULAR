import React, { useState, useEffect } from "react";
import { TitlerState, TitlerPreset } from "../types";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { 
  Play, Square, Save, Settings, Monitor, Palette, Type, 
  Zap, Plus, Trash2, Copy, Image as ImageIcon, Maximize,
  FastForward, Layout
} from "lucide-react";

interface ControlPanelProps {
  userId: string;
}

const defaultPreset: TitlerPreset = {
  id: "default",
  label: "Zócalo Principal",
  type: "static",
  name: "JUAN PÉREZ",
  role: "Director de Operaciones",
  primaryColor: "#10b981",
  secondaryColor: "#09090b",
  textColor: "#ffffff",
  fontFamily: "Inter",
  animationType: "slide",
  position: "bottom-left",
  width: 600,
  height: 120,
  backgroundImage: "",
  crawlSpeed: 10
};

const defaultState: TitlerState = {
  presets: [defaultPreset],
  activePresetId: "default",
  visible: false,
  ownerId: "" // Will be set on init
};

const ControlPanel: React.FC<ControlPanelProps> = ({ userId }) => {
  const [state, setState] = useState<TitlerState | null>(null);
  const [editingPreset, setEditingPreset] = useState<TitlerPreset | null>(null);

  useEffect(() => {
    const sessionRef = doc(db, 'sessions', userId);
    
    // Initialize if it doesn't exist
    const initSession = async () => {
      const docSnap = await getDoc(sessionRef);
      if (!docSnap.exists()) {
        await setDoc(sessionRef, { ...defaultState, ownerId: userId });
      }
    };
    initSession();

    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const newState = docSnap.data() as TitlerState;
        setState(newState);
        
        // Only set editing preset if we don't have one, or if it was deleted
        setEditingPreset(current => {
          if (!current && newState.activePresetId) {
            return newState.presets.find(p => p.id === newState.activePresetId) || newState.presets[0];
          }
          if (current && !newState.presets.find(p => p.id === current.id)) {
            return newState.presets[0];
          }
          return current;
        });
      }
    }, (error) => {
      console.error("Firestore Error: ", error);
    });

    return () => unsubscribe();
  }, [userId]);

  if (!state || !editingPreset) return <div className="p-8 text-zinc-500">Cargando sistema...</div>;

  const updateState = async (newState: TitlerState) => {
    try {
      await setDoc(doc(db, 'sessions', userId), { ...newState, ownerId: userId });
    } catch (error) {
      console.error("Error updating state:", error);
    }
  };

  const handleSavePreset = () => {
    if (!state) return;
    const newPresets = state.presets.map(p => p.id === editingPreset.id ? editingPreset : p);
    const newState = { ...state, presets: newPresets };
    updateState(newState);
  };

  const addNewPreset = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newPreset: TitlerPreset = {
      ...editingPreset,
      id: newId,
      label: `Nuevo Zócalo ${state.presets.length + 1}`,
      type: "static",
      crawlSpeed: 10
    };
    const newState = { ...state, presets: [...state.presets, newPreset], activePresetId: newId };
    updateState(newState);
    setEditingPreset(newPreset);
  };

  const deletePreset = (id: string) => {
    if (state.presets.length <= 1) return;
    const newPresets = state.presets.filter(p => p.id !== id);
    const nextActive = newPresets[0].id;
    const newState = { ...state, presets: newPresets, activePresetId: nextActive };
    updateState(newState);
    setEditingPreset(newPresets[0]);
  };

  const selectPreset = (id: string) => {
    const preset = state.presets.find(p => p.id === id);
    if (preset) {
      setEditingPreset(preset);
      updateState({ ...state, activePresetId: id });
    }
  };

  const toggleVisibility = () => {
    updateState({ ...state, visible: !state.visible });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-emerald-500">TITULADORANG</h1>
            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-[0.3em] font-bold">Zócalos y Tiras de Noticias (Graft)</p>
          </div>
          <div className="flex gap-4">
            <a href="/output" target="_blank" className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-100 font-bold rounded-xl hover:bg-zinc-800 transition-all">
              <Monitor size={18} /> SALIDA OBS
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Editor Area */}
          <div className="lg:col-span-6 space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <Layout className="text-emerald-500" size={18} />
                  <input 
                    type="text"
                    value={editingPreset.label}
                    onChange={(e) => setEditingPreset({...editingPreset, label: e.target.value})}
                    className="bg-transparent border-none focus:outline-none text-sm font-black uppercase tracking-widest w-full"
                  />
                </div>
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button 
                    onClick={() => setEditingPreset({...editingPreset, type: 'static'})}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${editingPreset.type === 'static' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  >
                    ESTÁTICO
                  </button>
                  <button 
                    onClick={() => setEditingPreset({...editingPreset, type: 'crawl'})}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${editingPreset.type === 'crawl' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  >
                    CRAWL (Graft)
                  </button>
                  <button 
                    onClick={() => setEditingPreset({...editingPreset, type: 'section'})}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${editingPreset.type === 'section' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  >
                    SECCIÓN
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {editingPreset.type === 'static' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre Principal</label>
                      <input
                        type="text"
                        value={editingPreset.name}
                        onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cargo / Subtítulo</label>
                      <input
                        type="text"
                        value={editingPreset.role}
                        onChange={(e) => setEditingPreset({ ...editingPreset, role: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                      />
                    </div>
                  </div>
                ) : editingPreset.type === 'crawl' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Texto de la Tira (Crawl)</label>
                    <textarea
                      value={editingPreset.name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                      rows={4}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none text-sm"
                      placeholder="Escribe aquí el texto que se desplazará por la pantalla..."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre de la Sección</label>
                    <input
                      type="text"
                      value={editingPreset.name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/50 outline-none font-bold uppercase"
                      placeholder="EJ: DEPORTES, CLIMA, NOTICIAS..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ancho (px)</label>
                    <input
                      type="number"
                      value={editingPreset.width}
                      onChange={(e) => setEditingPreset({ ...editingPreset, width: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alto (px)</label>
                    <input
                      type="number"
                      value={editingPreset.height}
                      onChange={(e) => setEditingPreset({ ...editingPreset, height: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {editingPreset.type === 'crawl' ? 'Velocidad' : 'Tipografía'}
                    </label>
                    {editingPreset.type === 'crawl' ? (
                      <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3">
                        <FastForward size={14} className="text-zinc-600" />
                        <input
                          type="number"
                          value={editingPreset.crawlSpeed}
                          onChange={(e) => setEditingPreset({ ...editingPreset, crawlSpeed: parseInt(e.target.value) || 1 })}
                          className="w-full bg-transparent py-3 outline-none text-sm"
                        />
                      </div>
                    ) : (
                      <select
                        value={editingPreset.fontFamily}
                        onChange={(e) => setEditingPreset({ ...editingPreset, fontFamily: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 outline-none text-sm"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Playfair Display">Playfair</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Anton">Anton</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Primario</label>
                    <input type="color" value={editingPreset.primaryColor} onChange={(e) => setEditingPreset({...editingPreset, primaryColor: e.target.value})} className="w-full h-10 rounded-lg bg-transparent cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fondo</label>
                    <input type="color" value={editingPreset.secondaryColor} onChange={(e) => setEditingPreset({...editingPreset, secondaryColor: e.target.value})} className="w-full h-10 rounded-lg bg-transparent cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Texto</label>
                    <input type="color" value={editingPreset.textColor} onChange={(e) => setEditingPreset({...editingPreset, textColor: e.target.value})} className="w-full h-10 rounded-lg bg-transparent cursor-pointer" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Imagen de Fondo (URL o Archivo)</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3">
                      <ImageIcon size={14} className="text-zinc-600" />
                      <input
                        type="text"
                        value={editingPreset.backgroundImage}
                        onChange={(e) => setEditingPreset({ ...editingPreset, backgroundImage: e.target.value })}
                        placeholder="https://ejemplo.com/fondo.png"
                        className="w-full bg-transparent py-3 outline-none text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 px-4 rounded-xl cursor-pointer transition-all text-xs font-bold border border-zinc-700">
                        <Plus size={14} /> SUBIR ARCHIVO
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingPreset({ ...editingPreset, backgroundImage: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {editingPreset.backgroundImage && (
                        <button 
                          onClick={() => setEditingPreset({ ...editingPreset, backgroundImage: "" })}
                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Posición</label>
                    <select value={editingPreset.position} onChange={(e) => setEditingPreset({...editingPreset, position: e.target.value as any})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm">
                      <option value="bottom-left">Abajo Izq</option>
                      <option value="bottom-right">Abajo Der</option>
                      <option value="top-left">Arriba Izq</option>
                      <option value="top-right">Arriba Der</option>
                      <option value="center-bottom">Centro Abajo</option>
                      <option value="full-bottom">Toda la Base (Crawl)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Animación Entrada</label>
                    <select value={editingPreset.animationType} onChange={(e) => setEditingPreset({...editingPreset, animationType: e.target.value as any})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm">
                      <option value="slide">Slide</option>
                      <option value="fade">Fade</option>
                      <option value="scale">Scale</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleSavePreset} className="w-full bg-zinc-100 text-zinc-950 font-black py-4 rounded-2xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2">
                  <Save size={18} /> GUARDAR CAMBIOS
                </button>
              </div>
            </section>
          </div>

          {/* Preset Library */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Librería de Gráficos</h2>
              <button onClick={addNewPreset} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all">
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
              {state.presets.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => selectPreset(p.id)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    state.activePresetId === p.id 
                      ? 'bg-emerald-500/10 border-emerald-500/50' 
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.type === 'crawl' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                      <span className="text-xs font-bold truncate">{p.label}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">{p.type === 'crawl' ? 'Tira de Noticias' : p.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Control Area */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl sticky top-8">
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                <Zap className="text-emerald-500" size={18} />
                <h2 className="text-sm font-black uppercase tracking-widest">Control Aire</h2>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${state.visible ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`}>
                  {state.visible ? <Play size={32} className="text-zinc-950 ml-1" /> : <Square size={32} className="text-zinc-500" />}
                </div>
                <div className="text-xs font-black uppercase tracking-widest mb-1">{state.visible ? 'ON AIR' : 'OFF AIR'}</div>
                <div className="text-[10px] text-zinc-600 font-bold truncate w-full">{editingPreset.label}</div>
              </div>

              <button
                onClick={toggleVisibility}
                className={`w-full py-6 rounded-2xl font-black text-2xl transition-all active:scale-[0.95] shadow-2xl ${
                  state.visible ? 'bg-red-500 text-white' : 'bg-emerald-500 text-zinc-950'
                }`}
              >
                {state.visible ? 'QUITAR' : 'PONER'}
              </button>

              <div className="mt-6 pt-6 border-t border-zinc-800">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Preview</div>
                <div 
                  className="w-full aspect-video rounded-xl border border-zinc-800 flex flex-col justify-center px-3 relative overflow-hidden bg-cover bg-center"
                  style={{ 
                    backgroundColor: editingPreset.secondaryColor, 
                    borderLeft: editingPreset.type === 'static' ? `4px solid ${editingPreset.primaryColor}` : 'none',
                    borderTop: editingPreset.type === 'crawl' ? `2px solid ${editingPreset.primaryColor}` : 'none',
                    backgroundImage: editingPreset.backgroundImage ? `url(${editingPreset.backgroundImage})` : 'none'
                  }}
                >
                  <div className="relative z-10">
                    {editingPreset.type === 'static' ? (
                      <>
                        <div style={{ color: editingPreset.textColor, fontFamily: editingPreset.fontFamily, fontSize: '0.8rem' }} className="font-bold truncate">{editingPreset.name}</div>
                        <div style={{ color: editingPreset.textColor, opacity: 0.7, fontFamily: editingPreset.fontFamily, fontSize: '0.6rem' }} className="truncate">{editingPreset.role}</div>
                      </>
                    ) : (
                      <div className="overflow-hidden whitespace-nowrap">
                        <div style={{ color: editingPreset.textColor, fontFamily: editingPreset.fontFamily, fontSize: '0.7rem' }} className="font-bold animate-pulse">
                          {editingPreset.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Quick Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto custom-scrollbar pb-2">
          <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mr-2 flex-shrink-0">
            ACCESOS RÁPIDOS:
          </div>
          {state.presets.map((p) => {
            const isActiveAndVisible = state.activePresetId === p.id && state.visible;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (isActiveAndVisible) {
                    updateState({ ...state, visible: false });
                  } else {
                    updateState({ ...state, activePresetId: p.id, visible: true });
                  }
                }}
                className={`relative flex-shrink-0 w-44 h-28 rounded-xl transition-all flex flex-col justify-between p-3 border-2 text-left ${
                  isActiveAndVisible
                    ? 'bg-[#13141c] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-[#13141c] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {/* Top row: Dot indicator */}
                <div className="w-full flex justify-end">
                  <div className={`w-2.5 h-2.5 rounded-full ${isActiveAndVisible ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-700'}`}></div>
                </div>
                
                {/* Bottom row: Label and Status */}
                <div className="w-full flex justify-between items-end gap-2">
                  <span className={`font-bold text-sm truncate pb-0.5 ${isActiveAndVisible ? 'text-white' : 'text-zinc-400'}`}>
                    {p.label}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    {isActiveAndVisible && (
                      <div className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        VIVO
                      </div>
                    )}
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      {p.animationType || 'FADE'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
