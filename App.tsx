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

const App: React.FC = () => {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('30:00');
  const [savedUniverses, setSavedUniverses] = useState<SavedUniverse[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [loadingText, setLoadingText] = useState('Calibrating multiversal lens...');
  const lastSeedRef = useRef<number | null>(null);

  const expandUniverseWithAI = useCallback(async (baseUni: Universe) => {
    setIsExpanding(true);
    setLoadingText("Scanning dimension coordinates...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Text generation
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a detailed profile for a fictional alternate universe with these core attributes:
        Seed: ${baseUni.seed}
        Planet: ${baseUni.planet.climate}, ${baseUni.planet.gravity} gravity, ${baseUni.planet.moons} moons.
        Society: ${baseUni.society.techLevel} tech, ${baseUni.society.government} government.
        History: ${baseUni.history.majorEvent}.
        
        Provide the response in raw JSON format with these exact keys:
        "description": "A 2-sentence poetic summary of this world",
        "location": "A cosmic coordinate like 'Sector-9 Delta, near the Pillar of Creation'",
        "physicalLaws": {
          "constantSpeedOfLight": "A fictional value or variation",
          "gravityStrength": "Relative strength and effect",
          "uniqueLaw": "One strange physical law"
        },
        "anomalies": ["3 short strings describing strange local phenomena"]`,
        config: {
          responseMimeType: "application/json",
          seed: baseUni.seed,
        },
      });

      const rawText = textResponse.text || '{}';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const expandedData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      
      setLoadingText("Rendering visual data...");
      
      // Image generation
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{
            text: `Cinematic wide-angle sci-fi concept art of an alternate universe. 
            Atmosphere: ${baseUni.planet.climate}. 
            Sky: ${baseUni.planet.moons} visible moons. 
            Structures: ${baseUni.society.techLevel} architecture of the ${baseUni.society.dominantCountry} nation. 
            Mood: Mysterious, high detail, 8k resolution, Unreal Engine 5 render style.`
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
      console.error("AI expansion failed:", error);
    } finally {
      setIsExpanding(false);
    }
  }, []);

  const updateUniverse = useCallback((force = false) => {
    const seed = Math.floor(Date.now() / (30 * 60 * 1000));
    
    // Skip if we already have this universe generated for this cycle and not forcing
    if (!force && seed === lastSeedRef.current) return;
    
    lastSeedRef.current = seed;
    const newUniverse = generateUniverse(seed);
    setUniverse(newUniverse);
    
    // Trigger expansion
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
        console.error("Failed to load archive:", e);
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

  if (!universe) return null;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Dimension #<span className="text-indigo-400 font-mono">{universe.seed}</span></h1>
          <p className="text-slate-400 flex items-center gap-2">
            <IconClock /> Next shift in <span className="text-indigo-300 font-mono">{timeLeft}</span>
          </p>
        </div>
        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
          <button 
            onClick={() => updateUniverse(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-sm font-semibold border border-slate-700"
          >
            <IconRefresh /> Sync
          </button>
          <button 
            onClick={() => setShowSaved(!showSaved)}
            className={`flex items-center gap-2 px-4 py-2 transition rounded-lg text-sm font-semibold border ${showSaved ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
          >
            <IconSave /> Archivist {savedUniverses.length > 0 && <span className="bg-slate-900 px-1.5 rounded text-xs ml-1">{savedUniverses.length}</span>}
          </button>
        </div>
      </header>

      {showSaved ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-200">The Multiverse Archive</h2>
            <button onClick={() => setShowSaved(false)} className="text-sm text-indigo-400 hover:underline">Back to Now</button>
          </div>
          {savedUniverses.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-500">No dimensions archived yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedUniverses.map(u => (
                <div key={u.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-indigo-500/50 transition group cursor-pointer" onClick={() => { setUniverse(u); setShowSaved(false); }}>
                  <div>
                    <h3 className="font-bold text-slate-200"># {u.seed}</h3>
                    <p className="text-xs text-slate-500">{u.society.techLevel} • {u.planet.climate}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={(e) => removeSaved(u.id, e)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-700 space-y-6">
          
          {/* Hero Visual Card */}
          <section className="relative w-full aspect-[21/9] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 group shadow-2xl shadow-indigo-500/5">
            {isExpanding ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-sm z-10">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-sm font-mono text-indigo-300 animate-pulse">{loadingText}</p>
              </div>
            ) : null}
            
            {universe.imageUrl ? (
              <img src={universe.imageUrl} alt="Dimension Visual" className="w-full h-full object-cover transition duration-1000 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
                <IconPlanet />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
              <div className="max-w-3xl">
                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                  {universe.location || "Coalescing Coordinates..."}
                </span>
                <p className="text-xl md:text-2xl font-semibold text-white drop-shadow-md leading-relaxed">
                  {universe.description || "Entering a new fold of reality. Stand by for multiversal synchronization."}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Headlines & Physical Laws */}
            <div className="md:col-span-2 space-y-6">
              
              <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Trans-Dimensional News Feed
                </h2>
                <div className="space-y-6">
                  {universe.headlines.map((headline, idx) => (
                    <div key={idx} className="group relative pb-6 border-b border-slate-800/50 last:border-0 last:pb-0">
                      <p className="text-xl font-bold text-slate-100 group-hover:text-indigo-300 transition-colors duration-200">
                        {headline}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{universe.society.dominantCountry} Central Network</span>
                        <span className="text-[10px] font-mono text-indigo-500/50">• {idx + 1}M AGO</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Physical Laws */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                  <div className="flex items-center gap-2 mb-4 text-indigo-400">
                    <IconAtom />
                    <h2 className="font-bold uppercase text-xs tracking-widest">Physical Constants</h2>
                  </div>
                  <div className="space-y-4">
                    {universe.physicalLaws ? (
                      <>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase mb-1">C (Light Speed)</label>
                          <p className="text-sm font-medium">{universe.physicalLaws.constantSpeedOfLight}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase mb-1">Gravitational Profile</label>
                          <p className="text-sm font-medium">{universe.physicalLaws.gravityStrength}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-800/50">
                          <label className="block text-[10px] text-indigo-500 uppercase mb-1">Anomalous Law</label>
                          <p className="text-sm italic text-indigo-200">"{universe.physicalLaws.uniqueLaw}"</p>
                        </div>
                      </>
                    ) : (
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* History Card */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <IconHistory />
                    <h2 className="font-bold uppercase text-xs tracking-widest">Historical Matrix</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">Epochal Event</label>
                      <p className="text-sm font-semibold">{universe.history.majorEvent}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">Last Conflict</label>
                      <p className="text-sm">{universe.history.lastWar}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase mb-1">Key Tech Breakthrough</label>
                      <p className="text-sm">{universe.history.discovery}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Planet, Society & Facts */}
            <div className="space-y-6">
              
              {/* Planetary Diagnostics */}
              <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <IconPlanet />
                  <h2 className="font-bold uppercase text-xs tracking-widest">Planetary Diagnostics</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Climate Regime</span>
                    <span className="text-indigo-200 font-medium text-lg">{universe.planet.climate}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-y border-slate-800/50">
                    <span className="text-sm text-slate-400">Surface Gravity</span>
                    <span className="font-mono text-sm text-white">{universe.planet.gravity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Orbital Satellites</span>
                    <span className="font-mono text-sm text-white">{universe.planet.moons} Natural Moons</span>
                  </div>
                </div>
              </section>

              {/* Localized Anomalies */}
              <section className="bg-indigo-600/10 rounded-2xl border border-indigo-500/20 p-6 overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
                   <IconAtom />
                </div>
                <h2 className="font-bold uppercase text-xs tracking-widest text-indigo-400 mb-4">Localized Anomalies</h2>
                <ul className="space-y-3">
                  {universe.anomalies ? (
                    universe.anomalies.map((a, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-indigo-500 font-bold">»</span>
                        {a}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500 italic">Calculating local variances...</li>
                  )}
                </ul>
              </section>

              {/* Societal Profile */}
              <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <IconSociety />
                  <h2 className="font-bold uppercase text-xs tracking-widest">Societal Profile</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Governing Logic</span>
                    <span className="text-indigo-200 font-medium">{universe.society.government}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Technological Era</span>
                    <span className="text-indigo-200 font-medium">{universe.society.techLevel}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800/50">
                     <span className="text-[10px] text-slate-500 uppercase block mb-1">Est. Sapient Count</span>
                     <span className="text-sm font-semibold">{universe.society.population}</span>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={saveCurrentUniverse}
                  disabled={!!savedUniverses.find(u => u.id === universe.id)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all rounded-2xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  {!!savedUniverses.find(u => u.id === universe.id) ? 'Dimension Archived' : 'Archive this Reality'}
                </button>
                
                <div className="relative group cursor-help">
                  <div className="w-full py-3 bg-slate-900/30 border border-slate-800 text-slate-500 transition rounded-2xl text-center text-sm">
                    Become a Premium Traveler
                  </div>
                  <div className="absolute -top-12 left-0 w-full bg-slate-800 text-xs text-slate-200 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center border border-slate-700 shadow-xl">
                    Coming Soon: Manual Seed Entry & High-Res Downloads.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-[10px] uppercase tracking-widest">
        <p>© 202X Chronos Multiverse Systems. Distributed by Deterministic Engine.</p>
        <p className="flex items-center gap-2">
           Model Version <span className="text-slate-400 font-mono">1.2.5-STABLE</span>
           <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
           Live Connection
        </p>
      </footer>
    </div>
  );
};

export default App;