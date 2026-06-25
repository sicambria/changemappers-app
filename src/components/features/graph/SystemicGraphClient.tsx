'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTranslation } from 'react-i18next';
import { Compass, Filter, Search, User, Users, Calendar, Activity, X } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { GraphNode, GraphLink } from '@/types/graph';

// ----------------------------------------------------------------------
// Types & Props
// ----------------------------------------------------------------------
interface SystemicGraphClientProps {
    initialNodes: GraphNode[];
    initialLinks: GraphLink[];
}

// ----------------------------------------------------------------------
// Colors & Styling config
// ----------------------------------------------------------------------
const NODE_COLORS = {
    USER: '#3b82f6',       // blue-500
    COMMUNITY: '#10b981',  // emerald-500
    EVENT: '#f59e0b',      // amber-500
    CAUSE: '#8b5cf6',      // violet-500
    ARCHETYPE: '#f43f5e',  // rose-500
};

// ----------------------------------------------------------------------
// Missing Capacity Engine
// ----------------------------------------------------------------------
const ALL_ARCHETYPES = ['MYCELIUM', 'KEYSTONE', 'POLLINATOR', 'PRISM', 'COMPOST', 'SENTINEL', 'ALCHEMIST', 'CANOPY', 'SPARK', 'ECHO', 'TIDE', 'HORIZON'];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function SystemicGraphClient({ initialNodes, initialLinks }: Readonly<SystemicGraphClientProps>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    const { t } = useTranslation(['graph', 'common']);
    const { theme } = useTheme();

    const [filterType, setFilterType] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isDarkTheme = theme === 'dark';
    const graphPalette = useMemo(() => ({
        label: isDarkTheme ? 'rgba(255, 255, 255, 0.82)' : '#0f172a',
        link: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.18)',
    }), [isDarkTheme]);

    // Responsive Canvas Resizing
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        handleResize(); // Initial set
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    // Graph Data Filtering Memo
    const graphData = useMemo(() => {
        let nodes = [...initialNodes];
        
        // 1. Filter by Entity Type
        if (filterType !== 'ALL') {
             nodes = nodes.filter(n => n.type === filterType || n.type === 'ARCHETYPE'); // Always keep archetypes as gravity centers
        }

        // 2. Filter by Name/City (Search)
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            nodes = nodes.filter(n => 
                n.label.toLowerCase().includes(lowerQuery) || 
                n.metadata?.location?.city?.toLowerCase().includes(lowerQuery) ||
                n.type === 'ARCHETYPE' // keep arch nodes if they connect to filtered items, handled below
            );
        }

        // 3. Filter Links to only those where both Source and Target exist in filtered Nodes
        const nodeIds = new Set(nodes.map(n => n.id));
        const links = initialLinks.filter(l => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) && 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target)
        );

        // 4. Cleanup orphan Arch nodes (only if actively searching/filtering)
        if (filterType !== 'ALL' || searchQuery) {
             const nodesWithLinks = new Set([
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 ...links.map(l => typeof l.source === 'object' ? (l.source as any).id : l.source),
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 ...links.map(l => typeof l.target === 'object' ? (l.target as any).id : l.target)
             ]);
             nodes = nodes.filter(n => n.type !== 'ARCHETYPE' || nodesWithLinks.has(n.id));
        }

        return { nodes, links };
    }, [initialNodes, initialLinks, filterType, searchQuery]);


    // Systemic Health Analyzer (Missing Capacity)
    const missingCapacity = useMemo(() => {
        // Collect all present archetypes in the visually filtered set of Users
        const presentArchetypes = new Set<string>();
        
        graphData.nodes.forEach(n => {
            if (n.type === 'USER' && n.metadata?.archetypes) {
                n.metadata.archetypes.forEach(a => presentArchetypes.add(a));
            }
        });

        // Which ones from the global 12 are missing?
        const missingArchetypes = ALL_ARCHETYPES.filter(a => !presentArchetypes.has(a));

        return { missingArchetypes, presentCount: presentArchetypes.size };
    }, [graphData.nodes]);


    // Paint Nodes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        
        // Use type-based coloring
        const color = NODE_COLORS[node.type as keyof typeof NODE_COLORS] || '#9ca3af';
        
        ctx.beginPath();
        // Base Circle
        ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = graphPalette.label;
        ctx.fillText(label, node.x, node.y + node.val + (8 / globalScale));
    }, [graphPalette.label]);


// Drop I18NextProvider wrapper, use plain divs
return (
    <div className="flex h-full min-h-0 w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200">
                
                {/* CANVAS CONTAINER */}
                <div ref={containerRef} className="flex-1 relative overflow-hidden">
                    <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeLabel="label"
                        nodeCanvasObject={paintNode}
                        nodeRelSize={1}
                        linkColor={() => graphPalette.link}
                        linkWidth={1.5}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        // Add physics parameters
                        cooldownTicks={100}
                        onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                    />
                    
                    {/* Floating Toggle Sidebar Info button */}
                    {!isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="absolute top-6 left-6 z-10 rounded-full border border-emerald-200 bg-white/90 p-3 shadow-lg transition-colors hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60"
                        >
                            <Filter size={20} className="text-emerald-400" />
                        </button>
                    )}
                </div>

                {/* SIDEBAR */}
                {isSidebarOpen && (
                    <div className="w-80 lg:w-96 border-l border-slate-200 bg-white/95 backdrop-blur-xl flex flex-col h-full overflow-y-auto dark:border-white/10 dark:bg-slate-900/90">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Activity className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <h1 className="font-semibold text-lg">{t('graph.title', 'Systemic Health & Capacity Graph')}</h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('graph.subtitle', 'Ecosystem Relationships')}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="p-6 space-y-6">
                            
                            {/* Search */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block dark:text-slate-400">{t('graph.filterByName', 'Filter by name')}</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder={t('graph.searchPlaceholder', 'Search nodes...')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* View Layers */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block dark:text-slate-400">{t('graph.visibilityLayers', 'Visibility Layers')}</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'ALL', label: t('graph.layers.all', 'All'), icon: Compass },
                                        { id: 'USER', label: t('graph.layers.users', 'Users'), icon: User, color: 'bg-blue-500' },
                                        { id: 'COMMUNITY', label: t('graph.layers.communities', 'Communities'), icon: Users, color: 'bg-emerald-500' },
                                        { id: 'EVENT', label: t('graph.layers.events', 'Events'), icon: Calendar, color: 'bg-amber-500' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setFilterType(opt.id)}
                                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${filterType === opt.id ? 'border-l-2 border-slate-400 bg-slate-100 dark:border-slate-300 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <opt.icon size={16} className="text-slate-500 dark:text-slate-400" />
                                            <span>{opt.label}</span>
                                            {opt.color && <div className={`ml-auto w-2 h-2 rounded-full ${opt.color}`} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Missing Capacity Analyzer */}
                        <div className="mt-auto border-t border-slate-200 bg-slate-100/70 p-6 dark:border-white/5 dark:bg-slate-800/30">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                                <Activity className="text-rose-400" size={16} />
                                {t('graph.health.missingCapacities', 'Missing Capacities')}
                            </h3>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed dark:text-slate-400">
                                {t('graph.health.missingDescription', 'These roles are not currently represented in your network.')}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                                {missingCapacity.missingArchetypes.map((arch) => (
                                    <span key={arch} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded text-xs dark:text-rose-300">
                                        {t(`common:archetypes.${arch}`, { defaultValue: arch })}
                                    </span>
                                ))}
                                {missingCapacity.missingArchetypes.length === 0 && (
                                    <span className="text-emerald-700 text-xs font-medium px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded dark:text-emerald-400">
                                        {t('graph.health.allPresent', 'System is balanced')}
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/10">
                                <span>{t('graph.health.visibleElements', { count: graphData.nodes.length, defaultValue: `${graphData.nodes.length} items` })}</span>
                                <span>{t('graph.health.visibleLinks', { count: graphData.links.length, defaultValue: `${graphData.links.length} links` })}</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
    );
}

