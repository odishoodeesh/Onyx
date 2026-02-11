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

// Ad Component
const AdUnit: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const pushAd = () => {
      try {
        // @ts-ignore
        const adsbygoogle = (window.adsbygoogle = window.adsbygoogle || []);
        // Check if the current element has already been processed by AdSense
        if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
          // Verify container has width before pushing
          if (adRef.current.offsetWidth > 0) {
            adsbygoogle.push({});
          } else {
            // Retry once if width is still 0
            setTimeout(() => {
              if (adRef.current && adRef.current.offsetWidth > 0) {
                adsbygoogle.push({});
              }
            }, 1000);
          }
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    // Use a slightly longer delay to ensure full layout stability on Vercel
    const timer = setTimeout(pushAd, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ad-container overflow-hidden">
      <ins ref={adRef}
           className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
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
    setIsExpanding(true);
    setLoadingText("Stabilizing singularity points...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Text generation
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
      
      setLoadingText("Fetching orbital visual stream...");
      
      // Image generation
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{
            text: `High-fidelity, cinematic sci-fi concept art of the planet's surface. 
            Environment: ${baseUni.planet.climate}. 
            Atmospheric features: ${baseUni.planet.moons} visible moons in a strange sky. 
            Civilization: ${baseUni.society.techLevel} architecture. 
            Mood: Breathtaking, alien, photorealistic, 8k, detailed textures.`
          }]
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });

      let imageUrl = '';
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
      console.error("Multiversal sync error:", error);
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

    const stored = localStorage.getItem('saved_universes');
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
    localStorage.setItem('saved_universes', JSON.stringify(updated));
  };

  const removeSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedUniverses.filter(u => u.id !== id);
    setSavedUniverses(updated);
    localStorage.setItem('saved_universes', JSON.stringify(updated));
  };

  const shareDimension = async () => {
    if (!universe) return;
    const shareData = {
      title: 'Alternate Universe Generator',
      text: `Dimension Traveler, witness Dimension #${universe.seed}. A ${universe.planet.climate} world governed by ${universe.society.government}.`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn("Native share cancelled or failed.");
      }
    } else {
      navigator.clipboard.writeText(`Witness Dimension #${universe.seed}: ${window.location.href}`);
      setCopyStatus("Link Copied!");
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  if (!universe) return null;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 mb-1">
             <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Synced Instance</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Dimension #<span className="text-indigo-400 font-mono">{universe.seed}</span></h1>
          <p className="text-slate-400 flex items-center gap-2">
            <IconClock /> Reality shift in <span className="text-indigo-300 font-mono">{timeLeft}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
          <button 
            onClick={shareDimension}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-sm font-semibold border border-slate-700 relative active:scale-95"
          >
            {copyStatus ? <span className="text-green-400">Copied!</span> : <><IconShare /> Share</>}
          </button>
          <button 
            onClick={() => updateUniverse(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-sm font-semibold border border-slate-700 active:scale-95"
            title="Refresh Multiversal Connection"
          >
            <IconRefresh /> Sync
          </button>
          <button 
            onClick={() => setShowSaved(!showSaved)}
            className={`flex items-center gap-2 px-4 py-2 transition rounded-lg text-sm font-semibold border active:scale-95 ${showSaved ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
          >
            <IconSave /> Archive {savedUniverses.length > 0 && <span className="bg-slate-900 px-1.5 rounded text-xs ml-1 font-mono">{savedUniverses.length}</span>}
          </button>
        </div>
      </header>

      {showSaved ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-widest text-xs">The Multiverse Archive</h2>
            <button onClick={() => setShowSaved(false)} className="text-sm text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-tighter">Back to Origin</button>
          </div>
          {savedUniverses.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No dimension logs captured.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedUniverses.map(u => (
                <div key={u.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={() => { setUniverse(u); setShowSaved(false); }}>
                  <div>
                    <h3 className="font-bold text-slate-100 mb-1">Dimension #{u.seed}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{u.society.techLevel} • {u.planet.climate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => removeSaved(u.id, e)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-1000 space-y-8">
          
          {/* Hero Visual Card */}
          <section className="relative w-full aspect-[21/9] bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 group shadow-2xl shadow-indigo-500/5">
            {isExpanding ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 backdrop-blur-sm z-20">
                <div className="relative w-16 h-16">
                   <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] font-mono text-indigo-400 animate-pulse tracking-[0.3em] uppercase mt-2">{loadingText}</p>
              </div>
            ) : null}
            
            {universe.imageUrl ? (
              <img src={universe.imageUrl} alt="Dimension Visual" className="w-full h-full object-cover transition duration-[2000ms] group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent"></div>
                <div className="text-center z-10 space-y-4">
                   <div className="mx-auto w-10 h-10 text-slate-800 animate-pulse"><IconPlanet /></div>
                   <p className="text-slate-700 font-mono text-[9px] uppercase tracking-[0.5em]">Establishing Orbital Link</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-10">
              <div className="max-w-3xl">
                <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-4">
                  {universe.location || "Coalescing Coordinates..."}
                </span>
                <p className="text-xl md:text-4xl font-bold text-white drop-shadow-2xl leading-[1.15]">
                  {universe.description || "Entering a new fold of reality. Fictional physics stabilizing for current epoch."}
                </p>
              </div>
            </div>
          </section>

          {/* Top Ad Unit */}
          <AdUnit />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              
              <section className="bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8 backdrop-blur-sm">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-8 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  Trans-Dimensional Feed
                </h2>
                <div className="space-y-8">
                  {universe.headlines.map((headline, idx) => (
                    <div key={idx} className="group relative pb-8 border-b border-slate-800/40 last:border-0 last:pb-0">
                      <p className="text-lg md:text-2xl font-bold text-slate-200 group-hover:text-indigo-400 transition-colors duration-300 cursor-default">
                        {headline}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{universe.society.dominantCountry} Global Net</span>
                        <span className="text-[9px] font-mono text-indigo-500/40 tracking-widest">• {idx + 1}CYC AGO</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8">
                  <div className="flex items-center gap-3 mb-6 text-indigo-400">
                    <IconAtom />
                    <h2 className="font-bold uppercase text-[10px] tracking-[0.3em]">Laws of Physics</h2>
                  </div>
                  <div className="space-y-6">
                    {universe.physicalLaws ? (
                      <>
                        <div className="group">
                          <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-indigo-400 transition-colors">Light Constant</label>
                          <p className="text-sm font-medium text-slate-200">{universe.physicalLaws.constantSpeedOfLight}</p>
                        </div>
                        <div className="group">
                          <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-indigo-400 transition-colors">Gravitational Force</label>
                          <p className="text-sm font-medium text-slate-200">{universe.physicalLaws.gravityStrength}</p>
                        </div>
                        <div className="pt-5 border-t border-slate-800/40">
                          <label className="block text-[9px] text-indigo-500 uppercase tracking-widest mb-2">Primary Divergence</label>
                          <p className="text-sm italic text-indigo-200/80 leading-relaxed">"{universe.physicalLaws.uniqueLaw}"</p>
                        </div>
                      </>
                    ) : (
                      <div className="animate-pulse space-y-4">
                        <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                        <div className="h-3 bg-slate-800 rounded w-3/5"></div>
                        <div className="h-10 bg-slate-800/50 rounded w-full mt-4"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8">
                  <div className="flex items-center gap-3 mb-6 text-slate-400">
                    <IconHistory />
                    <h2 className="font-bold uppercase text-[10px] tracking-[0.3em]">History Log</h2>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">Nexus Event</label>
                      <p className="text-sm font-bold text-slate-200 leading-tight">{universe.history.majorEvent}</p>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">Last Conflict</label>
                      <p className="text-sm text-slate-300">{universe.history.lastWar}</p>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">Key Discovery</label>
                      <p className="text-sm text-slate-300">{universe.history.discovery}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8">
                <div className="flex items-center gap-3 mb-6 text-slate-400">
                  <IconPlanet />
                  <h2 className="font-bold uppercase text-[10px] tracking-[0.3em]">Planetary Data</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">Atmosphere Type</span>
                    <span className="text-indigo-300 font-bold text-xl">{universe.planet.climate}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-y border-slate-800/40">
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Gravity</span>
                    <span className="font-mono text-sm text-white font-bold">{universe.planet.gravity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Natural Moons</span>
                    <span className="font-mono text-sm text-white font-bold">{universe.planet.moons}</span>
                  </div>
                </div>
              </section>

              <section className="bg-indigo-600/5 rounded-3xl border border-indigo-500/10 p-8 overflow-hidden relative group">
                <div className="absolute -right-6 -top-6 opacity-5 rotate-[30deg] transition-transform group-hover:rotate-[60deg] duration-700">
                   <IconAtom />
                </div>
                <h2 className="font-bold uppercase text-[10px] tracking-[0.3em] text-indigo-400 mb-6">Quantum Anomalies</h2>
                <ul className="space-y-4">
                  {universe.anomalies ? (
                    universe.anomalies.map((a, i) => (
                      <li key={i} className="flex gap-4 text-sm text-slate-400 leading-snug">
                        <span className="text-indigo-500 font-black">/</span>
                        {a}
                      </li>
                    ))
                  ) : (
                    <li className="text-[10px] text-slate-600 italic animate-pulse tracking-widest font-mono uppercase">Detecting local spikes...</li>
                  )}
                </ul>
              </section>

              <section className="bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8">
                <div className="flex items-center gap-3 mb-6 text-slate-400">
                  <IconSociety />
                  <h2 className="font-bold uppercase text-[10px] tracking-[0.3em]">Civilization</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">Governing Logic</span>
                    <span className="text-indigo-200/90 font-medium">{universe.society.government}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">Technological Era</span>
                    <span className="text-indigo-200/90 font-medium">{universe.society.techLevel}</span>
                  </div>
                </div>
              </section>

              <div className="pt-4 flex flex-col gap-4">
                <button 
                  onClick={saveCurrentUniverse}
                  disabled={!!savedUniverses.find(u => u.id === universe.id)}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/50 disabled:text-slate-600 transition-all rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-500/20 active:scale-95"
                >
                  {!!savedUniverses.find(u => u.id === universe.id) ? 'LOGGED TO ARCHIVE' : 'LOG THIS REALITY'}
                </button>
              </div>

              {/* Sidebar Ad Unit */}
              <AdUnit />
            </div>
          </div>
        </div>
      )}

      <footer className="mt-24 pt-12 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-600 text-[9px] uppercase tracking-[0.3em] font-mono">
        <p>© 2025 Chronos Multiverse Systems • All Realities Reserved.</p>
        <div className="flex items-center gap-8">
           <a href="/ads.txt" target="_blank" className="hover:text-indigo-400 transition-colors">Authorization</a>
           <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
              STREAM STABLE
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;