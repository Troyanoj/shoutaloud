// src/services/identity/didClient.ts
import { createHash } from 'crypto-browserify';

export interface DIDIdentity {
  did: string;
  privateKey: string;
  publicKey: string;
  created_at: string;
}

export interface SignedVote {
  vote_data: {
    proposal_id: string;
    option_id: string;
    municipality: string;
    timestamp: string;
  };
  signature: string;
  did: string;
}

class DIDClient {
  private static readonly STORAGE_KEY = 'shout_aloud_did';

  // Generate a simple DID (in production, use proper DID methods)
  generateDID(): DIDIdentity {
    const timestamp = Date.now().toString();
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    
    const privateKey = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const publicKey = this.derivePublicKey(privateKey);
    const did = `did:shout:${this.hashString(publicKey + timestamp)}`;

    const identity: DIDIdentity = {
      did,
      privateKey,
      publicKey,
      created_at: new Date().toISOString(),
    };

    this.storeIdentity(identity);
    return identity;
  }

  // Get stored DID or generate new one
  getOrCreateDID(): DIDIdentity {
    const stored = this.getStoredIdentity();
    if (stored) {
      return stored;
    }
    return this.generateDID();
  }

  // Sign vote data
  signVote(
    proposalId: string,
    optionId: string,
    municipality: string,
    identity?: DIDIdentity
  ): SignedVote {
    const did = identity || this.getOrCreateDID();
    
    const voteData = {
      proposal_id: proposalId,
      option_id: optionId,
      municipality,
      timestamp: new Date().toISOString(),
    };

    const dataString = JSON.stringify(voteData);
    const signature = this.createSignature(dataString, did.privateKey);

    return {
      vote_data: voteData,
      signature,
      did: did.did,
    };
  }

  // Verify signature
  verifySignature(signedVote: SignedVote, publicKey: string): boolean {
    const dataString = JSON.stringify(signedVote.vote_data);
    const expectedSignature = this.createSignature(dataString, publicKey);
    return expectedSignature === signedVote.signature;
  }

  // Check if user has already voted (client-side check)
  hasVotedLocally(proposalId: string): boolean {
    const votes = this.getLocalVotes();
    return votes.some(vote => vote.proposal_id === proposalId);
  }

  // Store vote locally to prevent double voting
  storeVoteLocally(proposalId: string, optionId: string): void {
    const votes = this.getLocalVotes();
    votes.push({
      proposal_id: proposalId,
      option_id: optionId,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('shout_aloud_votes', JSON.stringify(votes));
  }

  // Get current DID
  getCurrentDID(): DIDIdentity | null {
    return this.getStoredIdentity();
  }

  // Reset identity (for testing)
  resetIdentity(): void {
    localStorage.removeItem(DIDClient.STORAGE_KEY);
    localStorage.removeItem('shout_aloud_votes');
  }

  // Private methods
  private derivePublicKey(privateKey: string): string {
    // Simple derivation - in production use proper cryptographic methods
    return this.hashString(privateKey + 'public');
  }

  private createSignature(data: string, privateKey: string): string {
    // Simple signature - in production use proper digital signatures
    return this.hashString(data + privateKey);
  }

  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private storeIdentity(identity: DIDIdentity): void {
    localStorage.setItem(DIDClient.STORAGE_KEY, JSON.stringify(identity));
  }

  private getStoredIdentity(): DIDIdentity | null {
    const stored = localStorage.getItem(DIDClient.STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private getLocalVotes(): Array<{ proposal_id: string; option_id: string; timestamp: string }> {
    const stored = localStorage.getItem('shout_aloud_votes');
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
}

export const didClient = new DIDClient();