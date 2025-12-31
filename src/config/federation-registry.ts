/**
 * ECHO-001 Federation Network Registry
 * 
 * This file contains the hardcoded registry of all federation satellites
 * connected to the ECHO-001 Core network.
 * 
 * Core Node: yokxmlatktvxqymxtktn (ECHO-001)
 * Last Updated: 2025-12-31
 */

export interface FederationNode {
  id: string;
  name: string;
  projectId: string;
  supabaseUrl: string;
  anonKey: string;
  status: 'active' | 'inactive' | 'pending';
  capabilities: string[];
  joinedAt: string;
}

export interface FederationCore {
  id: string;
  name: string;
  projectId: string;
  supabaseUrl: string;
  anonKey: string;
}

// ECHO-001 Federation Core
export const FEDERATION_CORE: FederationCore = {
  id: 'echo-001',
  name: 'ECHO-001 Core',
  projectId: 'yokxmlatktvxqymxtktn',
  supabaseUrl: 'https://yokxmlatktvxqymxtktn.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlva3htbGF0a3R2eHF5bXh0a3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODgwNjksImV4cCI6MjA4MTE2NDA2OX0.ubCshUIfy05uo_U8LzKo4hgxbiRDcybXjo72bUi3Qag',
};

// Federation Satellite Registry (6 Nodes)
export const FEDERATION_SATELLITES: FederationNode[] = [
  {
    id: 'quantum-concierge',
    name: 'Quantum Concierge',
    projectId: 'quantum-concierge-project',
    supabaseUrl: 'https://quantum-concierge.supabase.co',
    anonKey: '', // To be configured
    status: 'active',
    capabilities: ['receive', 'broadcast', 'sync'],
    joinedAt: '2025-12-01',
  },
  {
    id: 'regulaite',
    name: 'RegulAIte',
    projectId: 'regulaite-project',
    supabaseUrl: 'https://regulaite.supabase.co',
    anonKey: '', // To be configured
    status: 'active',
    capabilities: ['receive', 'broadcast', 'sync'],
    joinedAt: '2025-12-01',
  },
  {
    id: 'sovereign-guard',
    name: 'Sovereign Guard',
    projectId: 'sovereign-guard-project',
    supabaseUrl: 'https://sovereign-guard.supabase.co',
    anonKey: '', // To be configured
    status: 'active',
    capabilities: ['receive', 'broadcast', 'sync'],
    joinedAt: '2025-12-01',
  },
  {
    id: 'cozy-build-forge',
    name: 'Cozy Build Forge',
    projectId: 'cozy-build-forge-project',
    supabaseUrl: 'https://cozy-build-forge.supabase.co',
    anonKey: '', // To be configured
    status: 'active',
    capabilities: ['receive', 'broadcast', 'sync'],
    joinedAt: '2025-12-01',
  },
  {
    id: 'acip-genome',
    name: 'ACIP Genome',
    projectId: 'acip-genome-project',
    supabaseUrl: 'https://acip-genome.supabase.co',
    anonKey: '', // To be configured
    status: 'active',
    capabilities: ['receive', 'broadcast', 'sync'],
    joinedAt: '2025-12-31',
  },
  {
    id: 'cyberellum-research',
    name: 'Cyberellum Research Platform',
    projectId: 'wymznknyhbsiqycrsduj',
    supabaseUrl: 'https://wymznknyhbsiqycrsduj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bXpua255aGJzaXF5Y3JzZHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzc5NTEsImV4cCI6MjA4MjYxMzk1MX0.pyi8ugte_3CP5AhQWQzsl_0s5If8BRJ8lo6Mb1maSAk',
    status: 'active',
    capabilities: ['receive', 'broadcast', 'sync'],
    joinedAt: '2025-12-31',
  },
];

// Helper functions
export const getActiveSatellites = () => 
  FEDERATION_SATELLITES.filter(node => node.status === 'active');

export const getSatelliteById = (id: string) => 
  FEDERATION_SATELLITES.find(node => node.id === id);

export const getFederationStats = () => ({
  totalNodes: FEDERATION_SATELLITES.length + 1, // +1 for core
  activeSatellites: getActiveSatellites().length,
  coreId: FEDERATION_CORE.id,
  coreName: FEDERATION_CORE.name,
});
