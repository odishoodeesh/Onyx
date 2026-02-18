import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { generateUniverse } from './services/universeGenerator';
import { Universe, SavedUniverse } from './types';

// Icons implemented as simple SVG components
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconPlanet = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/><path d="M16.5 16.5 12 12"/></svg>;
const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/><path d="M16 12h-4"/></svg>;
const IconSociety = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconSave = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>;
const IconRefresh = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>;
const IconAtom = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-9.17-4.52-15.95C11.14-2.53 4 1.48 2 3.5c-2.04 2.03-.02 9.17 4.52 15.95 4.53 6.78 11.67 2.77 13.68.75z"/><path d="M15.8 4.2c-2.04-2.03-9.17-.02-15.95 4.52C-6.93 13.25-2.92 20.4-1 22.4s9.17.02 15.95-4.52c6.78-4.53 2.77-11.67.75-13.68z"/></svg>;
const IconShare = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1200";

const AdUnit: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const pushAd = () => {
      try {
        // @ts-ignore
        const adsbygoogle = (window.adsbygoogle = window.adsbygoogle || []);
        if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
          if (adRef.current.offsetWidth > 0) {
            adsbygoogle.push({});
          } else {
            const observer = new ResizeObserver(() => {
              if (adRef.current && adRef.current.offsetWidth > 0) {
                adsbygoogle.push({});
                observer.disconnect();
              }
            });
            observer.observe(adRef.current);
          }
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    const timer = setTimeout(pushAd, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ad-container shadow-inner">
      <span className="ad-label">Advertisement</span>
      <ins ref={adRef}
           className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: '120px' }}
           data-ad-client="ca-pub-9619447476010525"
           data-ad-slot="auto"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

const App: React.FC = () => {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('30:00');
  const [savedUniverses, setSavedUniverses] = useState<SavedUniverse[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [loadingText, setLoadingText] = useState('Calibrating multiversal lens...');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const lastSeedRef = useRef<number | null>(null);

  const expandUniverseWithAI = useCallback(async (baseUni: Universe) => {
    // process.env.API_KEY is defined by Vite. Check for string validity.
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "") {
      console.warn("AI Expansion requires an API_KEY. Proceeding with procedural baseline only.");
      return;
    }

    setIsExpanding(true);
    setLoadingText("Stabilizing singularity points...");
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a multiversal archivist. Generate a detailed profile for a fictional alternate universe based on these deterministic variables:
        Seed Code: ${baseUni.seed}
        Planetary Specs: ${baseUni.planet.climate}, ${baseUni.planet.gravity} gravity, ${baseUni.planet.moons} moons.
        Society: ${baseUni.society.techLevel} development, ${baseUni.society.government} governance.
        Major History: ${baseUni.history.majorEvent}.
        
        Provide the response in raw JSON format with these exact keys:
        "description": "A 2-sentence poetic, atmospheric summary of this world",
        "location": "A cosmic coordinate like 'Sector-9 Delta, near the Pillar of Creation'",
        "physicalLaws": {
          "constantSpeedOfLight": "A fictional value or variation",
          "gravityStrength": "Relative strength and strange effects",
          "uniqueLaw": "One strange physical or metaphysical law"
        },
        "anomalies": ["3 short strings describing bizarre local phenomena"]`,
        config: {
          responseMimeType: "application/json",
          seed: baseUni.seed,
        },
      });

      const rawText = textResponse.text || '{}';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const expandedData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      
      setLoadingText("Streaming visual data from orbit...");
      
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{
            text: `Hyper-realistic sci-fi concept art of a distant planet's horizon. 
            Environment: ${baseUni.planet.climate}. 
            Atmosphere: ${baseUni.planet.moons} natural moons visible in a strange, colorful sky. 
            Civilization: ${baseUni.society.techLevel} structures and ${baseUni.society.population} inhabitants. 
            Mood: Epic, grand, mysterious, detailed textures, 8k resolution.`
          }]
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });

      let imageUrl = FALLBACK_IMAGE;
      const candidateParts = imageResponse.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      setUniverse(prev => {
        if (prev && prev.seed === baseUni.seed) {
          return { ...prev, ...expandedData, imageUrl };
        }
        return prev;
      });
    } catch (error: any) {
      console.error("Multiversal expansion error:", error);
    } finally {
      setIsExpanding(false);
    }
  }, []);

  const updateUniverse = useCallback((force = false) => {
    const seed = Math.floor(Date.now() / (30 * 60 * 1000));
    
    if (!force && seed === lastSeedRef.current) return;
    
    lastSeedRef.current = seed;
    const newUniverse = generateUniverse(seed);
    setUniverse(newUniverse);
    expandUniverseWithAI(newUniverse);
  }, [expandUniverseWithAI]);

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const blockTime = 30 * 60 * 1000;
      const nextUpdate = (Math.floor(now / blockTime) + 1) * blockTime;
      const diff = nextUpdate - now;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      return diff;
    };

    calculateTime();
    updateUniverse();

    const interval = setInterval(() => {
      const diff = calculateTime();
      if (diff <= 1000) {
        updateUniverse();
      }
    }, 1000);

    const stored = localStorage.getItem('saved_universes_v3');
    if (stored) {
      try {
        setSavedUniverses(JSON.parse(stored));
      } catch (e) {
        console.error("Archive retrieval failed:", e);
      }
    }

    return () => clearInterval(interval);
  }, [updateUniverse]);

  const saveCurrentUniverse = () => {
    if (!universe) return;
    if (savedUniverses.find(u => u.id === universe.id)) return;
    const updated = [...savedUniverses, { ...universe, savedAt: Date.now() }];
    setSavedUniverses(updated);
    localStorage.setItem('saved_universes_v3', JSON.stringify(updated));
  };

  const removeSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedUniverses.filter(u => u.id !== id);
    setSavedUniverses(updated);
    localStorage.setItem('saved_universes_v3', JSON.stringify(updated));
  };

  const shareDimension = async () => {
    if (!universe) return;
    const shareData = {
      title: 'Dimension Log: ' + universe.seed,
      text: `Traveler, witness Dimension #${universe.seed}. A ${universe.planet.climate} world with ${universe.society.techLevel} technology. Explore the multiverse now!`,
      url: window.location.origin,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn("Share cancelled.");
      }
    } else {
      navigator.clipboard.writeText(`Witness Dimension #${universe.seed}: ${window.location.origin}`);
      setCopyStatus("Link Copied!");
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  if (!universe) return null;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8 md:py-16 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-3 mb-2">
             <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                <span className="absolute w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></span>
             </div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Temporal Sync Active</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-2 leading-none">Dimension #<span className="text-indigo-500 font-mono tracking-tighter">{universe.seed}</span></h1>
          <p className="text-slate-500 flex items-center gap-2 font-mono text-sm tracking-tight">
            <IconClock /> Next reality shift in <span className="text-indigo-400 font-bold">{timeLeft}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-right-8 duration-700">
          <button 
            onClick={shareDimension}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-800 active:scale-95 relative"
          >
            {copyStatus ? <span className="text-green-400">Copied!</span> : <><IconShare /> Share Reality</>}
          </button>
          <button 
            onClick={() => updateUniverse(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-800 active:scale-95"
            title="Sync Connection"
          >
            <IconRefresh /> Sync
          </button>
          <button 
            onClick={() => setShowSaved(!showSaved)}
            className={`flex items-center gap-2 px-6 py-3 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border active:scale-95 ${showSaved ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}
          >
            <IconSave /> Archive {savedUniverses.length > 0 && <span className="bg-white/10 px-2 rounded-full text-[10px] ml-1">{savedUniverses.length}</span>}
          </button>
        </div>
      </header>

      {showSaved ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">The Multiverse Log</h2>
            <button onClick={() => setShowSaved(false)} className="text-xs text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest px-4 py-2 border border-indigo-400/20 rounded-xl transition-colors">Return to Current</button>
          </div>
          {savedUniverses.length === 0 ? (
            <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800/50">
              <p className="text-slate-600 font-mono text-sm uppercase tracking-widest">No dimension logs captured in archive.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedUniverses.map(u => (
                <div key={u.id} className="p-6 bg-slate-900/40 border border-slate-800/50 rounded-3xl flex items-center justify-between hover:border-indigo-500/30 transition-all group cursor-pointer backdrop-blur-md" onClick={() => { setUniverse(u); setShowSaved(false); }}>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">Dimension #{u.seed}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">{u.society.techLevel} • {u.planet.climate}</p>
                  </div>
                  <button onClick={(e) => removeSaved(u.id, e)} className="p-3 text-slate-700 hover:text-red-500 transition-colors bg-white/5 rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-1000 space-y-12">
          
          {/* Hero Visual Card */}
          <section className="relative w-full aspect-[21/9] bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-800 group shadow-2xl shadow-indigo-500/5 ring-1 ring-white/5">
            {isExpanding && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950/95 backdrop-blur-xl z-30">
                <div className="relative w-20 h-20">
                   <div className="absolute inset-0 border-4 border-indigo-500/5 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] font-mono text-indigo-400 animate-pulse tracking-[0.5em] uppercase mt-2">{loadingText}</p>
              </div>
            )}
            
            <img 
              src={universe.imageUrl || FALLBACK_IMAGE} 
              alt="Dimension View" 
              className={`w-full h-full object-cover transition-all duration-[3000ms] group-hover:scale-105 ${!universe.imageUrl ? 'opacity-20 blur-sm' : 'opacity-100'}`} 
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-20">
              <div className="max-w-4xl space-y-4">
                <span className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-2 backdrop-blur-md">
                  {universe.location || "Coalescing Coordinates..."}
                </span>
                <p className="text-2xl md:text-5xl font-bold text-white drop-shadow-2xl leading-[1.1] tracking-tight">
                  {universe.description || "A window is opening into a new fold of reality. Fictional physics stabilizing for your presence."}
                </p>
              </div>
            </div>
          </section>

          {/* Ad Slot One */}
          <AdUnit />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-10">
              
              <section className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/60 p-10 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-10 flex items-center gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                  Trans-Dimensional Headlines
                </h2>
                <div className="space-y-10">
                  {universe.headlines.map((headline, idx) => (
                    <div key={idx} className="group relative pb-10 border-b border-slate-800/40 last:border-0 last:pb-0">
                      <p className="text-xl md:text-3xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-500 leading-snug cursor-default">
                        {headline}
                      </p>
                      <div className="flex items-center gap-6 mt-4">
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">{universe.society.dominantCountry} News Agency</span>
                        <span className="text-[10px] font-mono text-indigo-500/40 tracking-widest">• CYC-{idx + 1}02</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/60 p-10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-8 text-indigo-400">
                    <IconAtom />
                    <h2 className="font-black uppercase text-[10px] tracking-[0.4em]">Universal Constants</h2>
                  </div>
                  <div className="space-y-8">
                    {universe.physicalLaws ? (
                      <>
                        <div className="group">
                          <label className="block text-[9px] text-slate-600 uppercase tracking-[0.3em] mb-2 group-hover:text-indigo-400 transition-colors">Speed of Light (c)</label>
                          <p className="text-base font-bold text-slate-200">{universe.physicalLaws.constantSpeedOfLight}</p>
                        </div>
                        <div className="group">
                          <label className="block text-[9px] text-slate-600 uppercase tracking-[0.3em] mb-2 group-hover:text-indigo-400 transition-colors">Gravity Strength</label>
                          <p className="text-base font-bold text-slate-200">{universe.physicalLaws.gravityStrength}</p>
                        </div>
                        <div className="pt-8 border-t border-slate-800/40">
                          <label className="block text-[9px] text-indigo-500 uppercase tracking-[0.3em] mb-3">Primary Anomaly</label>
                          <p className="text-sm italic text-indigo-200/90 leading-relaxed font-medium">"{universe.physicalLaws.uniqueLaw}"</p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-6">
                        <div className="h-4 bg-slate-800/50 rounded-full w-4/5 animate-pulse"></div>
                        <div className="h-4 bg-slate-800/50 rounded-full w-3/5 animate-pulse delay-75"></div>
                        <div className="h-16 bg-slate-800/30 rounded-3xl w-full mt-6 animate-pulse delay-150"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/60 p-10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-8 text-slate-500">
                    <IconHistory />
                    <h2 className="font-black uppercase text-[10px] tracking-[0.4em]">Dimension History</h2>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[9px] text-slate-600 uppercase tracking-[0.3em] mb-2">Nexus Event</label>
                      <p className="text-base font-black text-slate-100 leading-tight">{universe.history.majorEvent}</p>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-600 uppercase tracking-[0.3em] mb-2">Historical War</label>
                      <p className="text-sm text-slate-400 font-medium">{universe.history.lastWar}</p>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-600 uppercase tracking-[0.3em] mb-2">Great Discovery</label>
                      <p className="text-sm text-slate-400 font-medium">{universe.history.discovery}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-10">
              <section className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/60 p-10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 text-slate-500">
                  <IconPlanet />
                  <h2 className="font-black uppercase text-[10px] tracking-[0.4em]">Planetary Info</h2>
                </div>
                <div className="space-y-8">
                  <div>
                    <span className="text-[9px] text-slate-600 uppercase tracking-[0.3em] block mb-2">Climate / Atmosphere</span>
                    <span className="text-indigo-300 font-black text-2xl">{universe.planet.climate}</span>
                  </div>
                  <div className="flex justify-between items-center py-5 border-y border-slate-800/40">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Gravity</span>
                    <span className="font-mono text-sm text-white font-black">{universe.planet.gravity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Natural Moons</span>
                    <span className="font-mono text-sm text-white font-black">{universe.planet.moons}</span>
                  </div>
                </div>
              </section>

              <section className="bg-indigo-600/5 rounded-[2.5rem] border border-indigo-500/10 p-10 overflow-hidden relative group">
                <div className="absolute -right-8 -top-8 opacity-5 rotate-[30deg] transition-transform group-hover:rotate-[45deg] duration-1000 scale-150">
                   <IconAtom />
                </div>
                <h2 className="font-black uppercase text-[10px] tracking-[0.4em] text-indigo-400 mb-8">Quantum Variances</h2>
                <ul className="space-y-6">
                  {universe.anomalies ? (
                    universe.anomalies.map((a, i) => (
                      <li key={i} className="flex gap-5 text-sm text-slate-400 leading-relaxed font-medium">
                        <span className="text-indigo-500 font-black shrink-0">//</span>
                        {a}
                      </li>
                    ))
                  ) : (
                    <li className="text-[10px] text-slate-700 italic animate-pulse tracking-[0.2em] font-mono uppercase">Scanning for spikes...</li>
                  )}
                </ul>
              </section>

              <section className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/60 p-10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 text-slate-500">
                  <IconSociety />
                  <h2 className="font-black uppercase text-[10px] tracking-[0.4em]">Social Matrix</h2>
                </div>
                <div className="space-y-8">
                  <div className="group">
                    <span className="text-[9px] text-slate-600 uppercase tracking-[0.3em] block mb-2 group-hover:text-indigo-400 transition-colors">Governing Logic</span>
                    <span className="text-indigo-100/90 font-bold text-lg leading-tight block">{universe.society.government}</span>
                  </div>
                  <div className="group">
                    <span className="text-[9px] text-slate-600 uppercase tracking-[0.3em] block mb-2 group-hover:text-indigo-400 transition-colors">Epochal Stage</span>
                    <span className="text-indigo-100/90 font-bold text-lg block">{universe.society.techLevel}</span>
                  </div>
                </div>
              </section>

              <div className="pt-4">
                <button 
                  onClick={saveCurrentUniverse}
                  disabled={!!savedUniverses.find(u => u.id === universe.id)}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/40 disabled:text-slate-700 transition-all rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-indigo-600/20 active:scale-95 disabled:shadow-none ring-1 ring-white/10"
                >
                  {!!savedUniverses.find(u => u.id === universe.id) ? 'LOGGED TO HISTORY' : 'ARCHIVE DIMENSION'}
                </button>
              </div>

              {/* Sidebar Ad Unit */}
              <AdUnit />
            </div>
          </div>
        </div>
      )}

      <footer className="mt-32 pt-16 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-700 text-[10px] uppercase tracking-[0.4em] font-bold">
        <p className="opacity-50">© 2025 Alternate Universe Generator • Shared Reality Instance.</p>
        <div className="flex items-center gap-10">
           <a href="/ads.txt" target="_blank" className="hover:text-indigo-400 transition-colors opacity-75">Ads Auth</a>
           <div className="flex items-center gap-4 group">
              <span className="w-2 h-2 bg-green-500 rounded-full group-hover:animate-pulse"></span>
              <span className="opacity-75">Stream Verified</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;