import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AirVent, Armchair, Box, Check, ChevronDown, ChevronRight, CircleHelp, Copy, DoorOpen, FolderOpen, Grid2X2, LampFloor, Leaf, Lightbulb, Maximize, Minus, Moon, MousePointer2, Move, PanelLeftClose, Plus, Redo2, RotateCcw, RotateCw, Ruler, Save, Search, Settings2, Sofa, Sparkles, Sun, Trash2, Undo2, X } from 'lucide-react';
import { Scene } from './Scene';
import { FurniturePreview } from './FurniturePreview';
import { CATALOG, DEFAULT_DESIGN, FLOOR_COLORS, WALL_COLORS, isDesign, item as createItem } from './data';
import { getWallPlacement, isWallMounted } from './wallPlacement';
import type { Design, FurnitureCategory, FurnitureItem, FurnitureKind, LightingPreset, SavedDesign } from './types';

const CATEGORIES: { name: FurnitureCategory; icon: typeof Sofa }[] = [
  { name: 'Seating', icon: Sofa },
  { name: 'Tables', icon: Box },
  { name: 'Lighting', icon: LampFloor },
  { name: 'Decor', icon: Leaf },
  { name: 'Build', icon: DoorOpen },
  { name: 'Appliances', icon: AirVent },
];
const LIGHTING: { id: LightingPreset; name: string; detail: string; icon: typeof Sun }[] = [
  { id: 'daylight', name: 'Daylight', detail: 'Bright & balanced', icon: Sun },
  { id: 'golden', name: 'Golden hour', detail: 'Warm & cozy', icon: Lightbulb },
  { id: 'studio', name: 'Studio', detail: 'Cool & even', icon: Moon },
];
type HistoryEntry = { design: Design; selectedId: string | null };

const STORAGE_KEY = 'roomforge-current-design';
const LIBRARY_KEY = 'roomforge-saved-designs';

function initialDesign(): Design {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return isDesign(saved) ? saved : DEFAULT_DESIGN;
  } catch { return DEFAULT_DESIGN; }
}
function initialLibrary(): SavedDesign[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((entry): entry is SavedDesign => isDesign(entry) && typeof (entry as SavedDesign).id === 'string' && typeof (entry as SavedDesign).savedAt === 'string').slice(0, 20) : [];
  } catch { return []; }
}

export default function App() {
  const [design, setDesign] = useState<Design>(initialDesign);
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(design.items.find((entry) => entry.kind === 'sofa')?.id ?? null);
  const [category, setCategory] = useState<FurnitureCategory>('Seating');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'furniture' | 'room'>('furniture');
  const [showGrid, setShowGrid] = useState(false);
  const [view, setView] = useState<'perspective' | 'top'>('perspective');
  const [resetKey, setResetKey] = useState(0);
  const [library, setLibrary] = useState<SavedDesign[]>(initialLibrary);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [toast, setToast] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = design.items.find((entry) => entry.id === selectedId);
  const filteredCatalog = CATALOG.filter((entry) => entry.category === category && entry.name.toLowerCase().includes(search.toLowerCase()));

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);
  const update = useCallback((recipe: (current: Design) => Design) => {
    setDesign((current) => {
      const next = recipe(current);
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      setPast((history) => [...history.slice(-39), { design: current, selectedId }]);
      setFuture([]);
      setIsSaved(false);
      return next;
    });
  }, [selectedId]);
  const undo = useCallback(() => {
    const previous = past[past.length - 1];
    if (!previous) return;
    setFuture((entries) => [{ design, selectedId }, ...entries]);
    setDesign(previous.design);
    setSelectedId(previous.selectedId);
    setPast((entries) => entries.slice(0, -1));
    setIsSaved(false);
  }, [past, design, selectedId]);
  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setPast((entries) => [...entries, { design, selectedId }]);
    setDesign(next.design);
    setSelectedId(next.selectedId);
    setFuture((entries) => entries.slice(1));
    setIsSaved(false);
  }, [future, design, selectedId]);

  const addFurniture = useCallback((kind: FurnitureKind, x = 0, z?: number) => {
    const backWall = z === undefined || Math.abs(z + design.roomDepth / 2) < Math.abs(x + design.roomWidth / 2);
    const wallMounted = kind === 'door' || kind === 'window' || kind === 'aircond';
    const positionX = wallMounted ? (backWall ? x : -design.roomWidth / 2) : x;
    const positionZ = wallMounted ? (backWall ? -design.roomDepth / 2 : z ?? 0) : z ?? 0.6;
    const entry = createItem(kind, positionX, positionZ, wallMounted && !backWall ? Math.PI / 2 : 0);
    if (wallMounted) Object.assign(entry, getWallPlacement(entry, design.roomWidth, design.roomDepth));
    if (z === undefined) {
      if (wallMounted) {
        const halfWidth = entry.width / 2 + 0.15;
        const candidates = [-1.65, -0.5, 0.65, 1.8, -2.4, 2.4, 0].filter((value) => Math.abs(value) + halfWidth < design.roomWidth / 2);
        const free = candidates.find((value) => design.items.every((other) => (other.kind !== 'door' && other.kind !== 'window' && other.kind !== 'aircond') || Math.abs(other.rotation) > 0.1 || Math.abs(other.position[0] - value) > (other.width + entry.width) / 2 + 0.12));
        entry.position[0] = free ?? candidates[0] ?? 0;
      } else {
        const candidates: [number, number][] = [[0, 0.6], [-1.8, 1.55], [1.8, 1.55], [-1.8, -0.8], [1.8, -0.8], [0, 1.8], [-2, 0.2], [2, 0.2]];
        const free = candidates.find(([candidateX, candidateZ]) => Math.abs(candidateX) + entry.width / 2 < design.roomWidth / 2 && Math.abs(candidateZ) + entry.depth / 2 < design.roomDepth / 2 && design.items.every((other) => other.kind === 'door' || other.kind === 'window' || other.kind === 'aircond' || Math.abs(other.position[0] - candidateX) > (other.width + entry.width) * 0.45 || Math.abs(other.position[2] - candidateZ) > (other.depth + entry.depth) * 0.45));
        if (free) entry.position = [free[0], 0, free[1]];
      }
    }
    update((current) => ({ ...current, items: [...current.items, entry] }));
    setSelectedId(entry.id);
    setMobilePanel(false);
    notify(`${entry.name} added. Drag ${wallMounted ? 'along a wall' : 'to arrange it'}.`);
  }, [design.roomWidth, design.roomDepth, update, notify]);
  const fitOpenings = (current: Design, roomWidth: number, roomDepth: number): Design => ({ ...current, roomWidth, roomDepth, items: current.items.map((entry) => isWallMounted(entry) ? { ...entry, ...getWallPlacement(entry, roomWidth, roomDepth) } : entry) });
  const updateSelected = (changes: Partial<FurnitureItem>) => {
    if (!selectedId || !selected) return;
    if ((selected.kind === 'door' || selected.kind === 'window' || selected.kind === 'aircond') && changes.rotation !== undefined) {
      const leftWall = Math.abs(selected.rotation) < 0.1;
      update((current) => ({ ...current, items: current.items.map((entry) => entry.id === selectedId ? { ...entry, ...getWallPlacement({ ...entry, position: leftWall ? [0, 0, -entry.position[0]] : [-entry.position[2], 0, 0], rotation: leftWall ? Math.PI / 2 : 0 }, current.roomWidth, current.roomDepth) } : entry) }));
      return;
    }
    if (changes.scale !== undefined && isWallMounted(selected)) {
      update((current) => ({ ...current, items: current.items.map((entry) => entry.id === selectedId ? { ...entry, ...changes, ...getWallPlacement({ ...entry, ...changes }, current.roomWidth, current.roomDepth) } : entry) }));
      return;
    }
    update((current) => ({ ...current, items: current.items.map((entry) => entry.id === selectedId ? { ...entry, ...changes } : entry) }));
  };
  const moveItem = (id: string, x: number, z: number) => update((current) => ({ ...current, items: current.items.map((entry) => {
    if (entry.id !== id) return entry;
    if (isWallMounted(entry)) {
      const leftWall = x < 0 && Math.abs(x) / current.roomWidth > Math.abs(z) / current.roomDepth;
      return { ...entry, ...getWallPlacement({ ...entry, position: [x, 0, z], rotation: leftWall ? Math.PI / 2 : 0 }, current.roomWidth, current.roomDepth) };
    }
    return { ...entry, position: [Math.max(-current.roomWidth / 2 + entry.width / 3, Math.min(current.roomWidth / 2 - entry.width / 3, x)), 0, Math.max(-current.roomDepth / 2 + entry.depth / 3, Math.min(current.roomDepth / 2 - entry.depth / 3, z))] };
  }) }));
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    update((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== selectedId) }));
    setSelectedId(null); notify('Furniture removed');
  }, [selectedId, update, notify]);
  const duplicateSelected = () => {
    if (!selected) return;
    const wallMounted = selected.kind === 'door' || selected.kind === 'window' || selected.kind === 'aircond';
    const alongWall = Math.abs(selected.rotation) < 0.1;
    const copy = { ...selected, id: crypto.randomUUID(), position: [selected.position[0] + (wallMounted && alongWall ? selected.width * selected.scale + 0.25 : 0.35), 0, selected.position[2] + (wallMounted && !alongWall ? selected.width * selected.scale + 0.25 : 0.35)] as [number, number, number] };
    if (wallMounted) Object.assign(copy, getWallPlacement(copy, design.roomWidth, design.roomDepth));
    update((current) => ({ ...current, items: [...current.items, copy] }));
    setSelectedId(copy.id); notify('Furniture duplicated');
  };
  const saveDesign = () => {
    const name = saveName.trim() || design.name;
    const saved: SavedDesign = { ...design, name, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
    const next = [saved, ...library.filter((entry) => entry.name !== name)].slice(0, 20);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...design, name }));
      setLibrary(next); setDesign((current) => ({ ...current, name })); setIsSaved(true); setSaveName('');
      notify('Design saved to your collection');
    } catch { notify('Browser storage is full. Remove an older saved design and try again.'); }
  };
  const loadDesign = (saved: SavedDesign) => {
    update(() => ({ ...saved }));
    setSelectedId(null); setShowLibrary(false); setIsSaved(true); notify(`“${saved.name}” opened`);
  };

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)); } catch { /* Saved collection remains available if storage is full. */ }
  }, [design]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (event.key === 'Delete' || event.key === 'Backspace') deleteSelected();
      if (event.key.toLowerCase() === 'r') updateSelected({ rotation: (selected?.rotation || 0) + Math.PI / 4 });
      if (event.key === 'Escape') { setSelectedId(null); setShowLibrary(false); setShowHelp(false); setMobilePanel(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return <div className="app-shell">
    <a href="#workspace" className="skip-link">Skip to workspace</a>
    <header className="topbar">
      <a className="brand" href="#" aria-label="RoomForge home" onClick={(event) => { event.preventDefault(); setSelectedId(null); }}>
        <span className="brand-mark"><Box size={24} strokeWidth={1.65} /></span>
        <span>roomforge<span className="brand-dot">.</span></span>
      </a>
      <span className="top-divider" />
      <div className="project-title"><span className="project-title-label">MY WORKSPACE</span><button className="project-name" aria-label="Open my designs" onClick={() => setShowLibrary(true)}>{design.name}<ChevronDown size={14} /></button></div>
      <div className="header-actions">
        <div className="history-actions"><button className="icon-button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!past.length} onClick={undo}><Undo2 size={18} /></button><button className="icon-button" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!future.length} onClick={redo}><Redo2 size={18} /></button></div>
        <button className="button button-secondary library-button" onClick={() => setShowLibrary(true)}><FolderOpen size={17} />My designs</button>
        <button className={`button button-primary ${isSaved ? 'saved' : ''}`} onClick={saveDesign}>{isSaved ? <Check size={17} /> : <Save size={17} />}{isSaved ? 'Saved' : 'Save design'}</button>
        <button className="icon-button help-button" aria-label="Help and keyboard shortcuts" onClick={() => setShowHelp(true)}><CircleHelp size={20} /></button>
      </div>
    </header>

    <main className="main-layout">
      <aside className={`catalog-panel ${mobilePanel ? 'mobile-open' : ''}`} aria-label="Design tools">
        <div className="panel-tabs"><button className={activeTab === 'furniture' ? 'active' : ''} onClick={() => setActiveTab('furniture')}><Armchair size={17} />Furniture</button><button className={activeTab === 'room' ? 'active' : ''} onClick={() => setActiveTab('room')}><Settings2 size={17} />Room</button></div>
        {activeTab === 'furniture' ? <div className="catalog-content">
          <div className="panel-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h1>Furniture library</h1></div><button className="icon-button mobile-close" aria-label="Close furniture library" onClick={() => setMobilePanel(false)}><PanelLeftClose size={19} /></button></div>
          <p className="panel-description">Good spaces start with pieces you love.</p>
          <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a piece..." aria-label="Search furniture" />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button>}</label>
          <div className="category-tabs" aria-label="Furniture categories">{CATEGORIES.map(({ name, icon: Icon }) => <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}><Icon size={16} /><span>{name}</span></button>)}</div>
          <div className="catalog-list">{filteredCatalog.map((entry) => <button key={entry.kind} className="catalog-card" draggable onDragStart={(event) => { event.dataTransfer.setData('text/roomforge-furniture', entry.kind); event.dataTransfer.effectAllowed = 'copy'; localStorage.setItem('roomforge-drag-kind', entry.kind); }} onClick={() => addFurniture(entry.kind)} aria-label={`Add ${entry.name}`}>
            <span className={`furniture-preview preview-${entry.kind}`} style={{ '--item-color': entry.color } as CSSProperties}><FurniturePreview kind={entry.kind} color={entry.color} /></span>
            <span className="catalog-card-text"><strong>{entry.name}</strong><small>{entry.description}</small><span className="catalog-size">{entry.width.toFixed(1)} × {entry.depth.toFixed(1)} m</span></span>
            <span className="add-circle"><Plus size={17} /></span>
          </button>)}</div>
          {!filteredCatalog.length && <div className="empty-search"><Search size={28} /><strong>No pieces found</strong><span>Try another name or category.</span><button onClick={() => setSearch('')}>Clear search</button></div>}
          <div className="catalog-tip"><MousePointer2 size={18} /><p><strong>Make yourself at home.</strong><br />Click a piece to add it, then drag it around your room.</p></div>
        </div> : <div className="catalog-content room-settings">
          <div className="panel-heading"><div><span className="eyebrow">SET THE FOUNDATION</span><h1>Your room</h1></div></div><p className="panel-description">A little space. Endless possibilities.</p>
          <section className="settings-section"><h2><Ruler size={16} />Dimensions</h2><div className="dimension-inputs"><label>Width<div><input aria-label="Room width" type="number" min="3" max="12" step="0.5" value={design.roomWidth} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 3 && value <= 12) update((current) => fitOpenings(current, value, current.roomDepth)); }} /><span>m</span></div></label><span className="dimension-times">×</span><label>Depth<div><input aria-label="Room depth" type="number" min="3" max="12" step="0.5" value={design.roomDepth} onChange={(event) => { const value = Number(event.target.value); if (value >= 3 && value <= 12) update((current) => fitOpenings(current, current.roomWidth, value)); }} /><span>m</span></div></label></div><p className="field-hint">Room area: {(design.roomWidth * design.roomDepth).toFixed(1)} m² · 3–12 m per side</p></section>
          <section className="settings-section"><h2>Walls</h2><div className="swatches">{WALL_COLORS.map((color) => <button key={color} className={`swatch ${design.wallColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} aria-label={`Wall color ${color}`} aria-pressed={design.wallColor === color} onClick={() => update((current) => ({ ...current, wallColor: color }))}>{design.wallColor === color && <Check size={16} />}</button>)}</div><p className="field-hint">Warm whites make a room feel open and calm.</p></section>
          <section className="settings-section"><h2>Flooring</h2><div className="swatches">{FLOOR_COLORS.map((color) => <button key={color} className={`swatch floor-swatch ${design.floorColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} aria-label={`Floor color ${color}`} aria-pressed={design.floorColor === color} onClick={() => update((current) => ({ ...current, floorColor: color }))}>{design.floorColor === color && <Check size={16} />}</button>)}</div></section>
          <section className="settings-section"><h2><Sun size={16} />Lighting mood</h2><div className="lighting-options">{LIGHTING.map(({ id, name, detail, icon: Icon }) => <button key={id} className={design.lighting === id ? 'active' : ''} onClick={() => update((current) => ({ ...current, lighting: id }))}><Icon size={20} /><span><strong>{name}</strong><small>{detail}</small></span>{design.lighting === id && <Check size={16} />}</button>)}</div></section>
        </div>}
        <div className="panel-footer"><span className="status-dot" />All changes saved locally</div>
      </aside>

      <section className="workspace" id="workspace" aria-label="3D room editor" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}>
        <div className="workspace-toolbar">
          <button className="mobile-catalog-button button button-secondary" onClick={() => setMobilePanel(true)}><Plus size={17} />Add furniture</button>
          <div className="view-switch"><button className={view === 'perspective' ? 'active' : ''} onClick={() => setView('perspective')}><Box size={16} />3D view</button><button className={view === 'top' ? 'active' : ''} onClick={() => setView('top')}><Grid2X2 size={16} />Top view</button></div>
          <div className="workspace-tools"><button className={`icon-button ${showGrid ? 'active' : ''}`} title="Show dimensions and floor grid" aria-label="Show dimensions and floor grid" aria-pressed={showGrid} onClick={() => setShowGrid(!showGrid)}><Ruler size={18} /></button><button className="icon-button" aria-label="Reset camera view" title="Reset camera" onClick={() => setResetKey((value) => value + 1)}><Maximize size={18} /></button></div>
        </div>
        <div className="scene-container"><Scene design={design} selectedId={selectedId} onSelect={setSelectedId} onMove={moveItem} onAdd={addFurniture} showGrid={showGrid} resetKey={resetKey} view={view} lighting={design.lighting} /></div>
        <div className="room-caption"><span className="room-caption-dot" /><span>{design.roomWidth} × {design.roomDepth} m</span><span className="caption-separator">/</span><span>{design.items.length} pieces</span><span className="caption-separator">/</span><span>{LIGHTING.find((entry) => entry.id === design.lighting)?.name}</span></div>
        {!selected && <div className="canvas-hint"><Move size={15} /><span>Drag to orbit <span>·</span> Scroll to zoom <span>·</span> Click a piece to edit</span></div>}
        {selected && <div className="selection-panel">
          <div className="selection-heading"><span className="selection-icon"><FurniturePreview kind={selected.kind} color={selected.color} /></span><div><strong>{selected.name}</strong><span>{selected.width.toFixed(1)} × {selected.depth.toFixed(1)} × {selected.height.toFixed(1)} m</span></div><button className="icon-button" aria-label="Deselect furniture" onClick={() => setSelectedId(null)}><X size={17} /></button></div>
          <div className="selection-actions"><button onClick={() => updateSelected({ rotation: selected.rotation - Math.PI / 4 })} title="Rotate left"><RotateCcw size={17} /><span>Rotate</span></button><button onClick={() => updateSelected({ rotation: selected.rotation + Math.PI / 4 })} title="Rotate right"><RotateCw size={17} /><span>45°</span></button><button onClick={duplicateSelected} title="Duplicate"><Copy size={17} /><span>Duplicate</span></button><button className="delete-action" onClick={deleteSelected} title="Remove furniture"><Trash2 size={17} /><span>Remove</span></button></div>
          <div className="selection-options"><label>Color<div className="mini-swatches">{['#b4ac97', '#b57858', '#6d7b6c', '#a6b4b3', '#d1c4ad', '#747474'].map((color) => <button key={color} className={selected.color === color ? 'active' : ''} style={{ backgroundColor: color }} aria-label={`Furniture color ${color}`} onClick={() => updateSelected({ color })} />)}</div></label><label>Size<div className="size-stepper"><button aria-label="Decrease furniture size" disabled={selected.scale <= 0.6} onClick={() => updateSelected({ scale: Math.max(0.6, selected.scale - 0.1) })}><Minus size={14} /></button><span>{Math.round(selected.scale * 100)}%</span><button aria-label="Increase furniture size" disabled={selected.scale >= 1.4} onClick={() => updateSelected({ scale: Math.min(1.4, selected.scale + 0.1) })}><Plus size={14} /></button></div></label></div>
        </div>}
        <button className="clear-room-button" onClick={() => setConfirmClear(true)} disabled={!design.items.length}><Trash2 size={14} />Clear room</button>
      </section>
    </main>

    {toast && <div className="toast" role="status"><Check size={18} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    {showLibrary && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLibrary(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="library-title"><div className="modal-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="library-title">A place for every idea.</h2><p>Your saved spaces, right where you left them.</p></div><button className="icon-button" aria-label="Close saved designs" onClick={() => setShowLibrary(false)}><X size={20} /></button></div><div className="save-new"><input aria-label="New design name" placeholder={design.name} value={saveName} onChange={(event) => setSaveName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveDesign(); }} maxLength={50} /><button className="button button-primary" onClick={saveDesign}><Save size={16} />Save current room</button></div><div className="saved-designs">{library.length ? library.map((saved) => <article className="saved-card" key={saved.id}><button className="saved-card-main" onClick={() => loadDesign(saved)}><span className="saved-room-icon"><Box size={30} /></span><span><strong>{saved.name}</strong><small>{saved.roomWidth} × {saved.roomDepth} m · {saved.items.length} pieces</small><small>{new Date(saved.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></span><ChevronRight size={18} /></button><button className="icon-button" aria-label={`Delete saved design ${saved.name}`} onClick={() => { const next = library.filter((entry) => entry.id !== saved.id); try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); setLibrary(next); notify('Saved design deleted'); } catch { notify('Could not update browser storage'); } }}><Trash2 size={16} /></button></article>) : <div className="empty-library"><FolderOpen size={38} /><h3>Your collection starts here.</h3><p>Save your current room to come back to it anytime.</p></div>}</div></section></div>}
    {showHelp && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false); }}><section className="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="modal-heading"><div><span className="eyebrow">A LITTLE GUIDANCE</span><h2 id="help-title">Make yourself at home.</h2></div><button className="icon-button" aria-label="Close help" onClick={() => setShowHelp(false)}><X size={20} /></button></div><div className="help-steps"><div><MousePointer2 /><span><strong>Find your pieces</strong><p>Click furniture to add it, or drag it from the library straight into your room.</p></span></div><div><Move /><span><strong>Arrange your space</strong><p>Drag furniture to move it. Drag empty space to orbit, and scroll to zoom.</p></span></div><div><Sparkles /><span><strong>Set the mood</strong><p>Open the Room tab to change dimensions, finishes, and lighting.</p></span></div></div><div className="shortcuts"><h3>Keyboard shortcuts</h3><span>Undo <kbd>Ctrl</kbd> + <kbd>Z</kbd></span><span>Rotate selected <kbd>R</kbd></span><span>Remove selected <kbd>Delete</kbd></span><span>Deselect / close <kbd>Esc</kbd></span></div><p className="privacy-note"><Check size={16} />No account needed. Your designs stay in this browser.</p></section></div>}
    {confirmClear && <div className="modal-backdrop"><section className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="clear-title"><span className="confirm-icon"><Trash2 size={24} /></span><h2 id="clear-title">Start with a fresh room?</h2><p>This removes all furniture from your current design. Your room dimensions and finishes will stay, and you can undo this action.</p><div><button className="button button-secondary" onClick={() => setConfirmClear(false)}>Keep my room</button><button className="button button-danger" onClick={() => { update((current) => ({ ...current, items: [] })); setSelectedId(null); setConfirmClear(false); notify('Room cleared. You can undo this action.'); }}>Clear furniture</button></div></section></div>}
  </div>;
}
