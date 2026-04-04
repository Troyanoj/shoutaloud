import React from 'react';
import { Shield, Users, Vote, Database, Network, Brain, Lock, Globe } from 'lucide-react';

const SystemArchitecture = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Shout Aloud - System Architecture</h1>
        <p className="text-center text-gray-400 mb-12">"The voice of the people is the law"</p>
        
        {/* Core Layers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* User Layer */}
          <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-green-400 mr-3" />
              <h2 className="text-xl font-semibold">User Layer</h2>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• React Native Mobile App</li>
              <li>• Progressive Web App</li>
              <li>• Offline-first architecture</li>
              <li>• Zero personal data storage</li>
            </ul>
          </div>
          
          {/* Identity Layer */}
          <div className="bg-gray-800 rounded-lg p-6 border border-blue-500">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold">Identity Layer</h2>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Sovereign Identity (SSI)</li>
              <li>• Zero-Knowledge Proofs</li>
              <li>• Biometric hash on-device</li>
              <li>• One person, one vote</li>
            </ul>
          </div>
          
          {/* Voting Layer */}
          <div className="bg-gray-800 rounded-lg p-6 border border-purple-500">
            <div className="flex items-center mb-4">
              <Vote className="w-8 h-8 text-purple-400 mr-3" />
              <h2 className="text-xl font-semibold">Voting Layer</h2>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Polygon blockchain</li>
              <li>• Smart contracts</li>
              <li>• Encrypted votes</li>
              <li>• Real-time tallying</li>
            </ul>
          </div>
        </div>
        
        {/* Infrastructure Components */}
        <h3 className="text-2xl font-semibold mb-6 text-center">Decentralized Infrastructure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Data Storage */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Database className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Data Storage</h4>
            <p className="text-xs text-gray-400">IPFS + OrbitDB</p>
            <p className="text-xs text-gray-400">Distributed & Resilient</p>
          </div>
          
          {/* Network */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Network className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">P2P Network</h4>
            <p className="text-xs text-gray-400">libp2p + Mesh</p>
            <p className="text-xs text-gray-400">Censorship Resistant</p>
          </div>
          
          {/* AI Analysis */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Brain className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">AI Analysis</h4>
            <p className="text-xs text-gray-400">Local LLM</p>
            <p className="text-xs text-gray-400">Citizen-focused</p>
          </div>
          
          {/* Security */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Lock className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Security</h4>
            <p className="text-xs text-gray-400">E2E Encryption</p>
            <p className="text-xs text-gray-400">Anti-fragile design</p>
          </div>
        </div>
        
        {/* Data Flow */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Globe className="w-6 h-6 mr-2 text-blue-400" />
            Data Flow & Privacy
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
              <span className="text-sm">Government sources → Ethical scraper → Verification nodes</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full mr-3"></div>
              <span className="text-sm">Raw laws → AI analyzer → Simple explanations</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full mr-3"></div>
              <span className="text-sm">User location → Municipality assignment → Relevant content only</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
              <span className="text-sm">Encrypted vote → Blockchain → Transparent results</span>
            </div>
          </div>
        </div>
        
        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3">Anti-Censorship Features</h4>
            <ul className="space-y-1 text-sm">
              <li>✓ Multiple domain systems (ENS, Handshake)</li>
              <li>✓ Auto-replicating nodes</li>
              <li>✓ Mesh network capability</li>
              <li>✓ No dependency on cloud providers</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3">Community Governance</h4>
            <ul className="space-y-1 text-sm">
              <li>✓ DAO structure for platform decisions</li>
              <li>✓ Open source development</li>
              <li>✓ Community-funded only</li>
              <li>✓ Transparent operations</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-300">
            "This is the moment. This is the awakening. This is the voice of the people."
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Built by the people, for the people. No corporate control. Ever.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemArchitecture;