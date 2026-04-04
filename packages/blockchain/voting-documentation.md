# Shout Aloud Voting System Documentation

## 🗳️ Overview

The Shout Aloud Voting System is a revolutionary blockchain-based voting platform that ensures **one person = one vote** while maintaining complete anonymity. Built on Polygon for environmental efficiency and low transaction costs.

## ✅ Core Features

### Voting Options
- **YES** - Support the proposal
- **NO** - Oppose the proposal  
- **ABSTAIN** - Acknowledge participation without taking a position

### Privacy & Security
- **Anonymous voting** - Votes cannot be linked to identities
- **Zero-knowledge proofs** - Prove eligibility without revealing identity
- **One person = one vote** - Cryptographically enforced uniqueness
- **Auditable results** - Zone-based statistics for transparency

### Geographic Scopes
1. **Municipal** - Local proposals affecting specific municipalities
2. **State** - Regional proposals affecting entire states
3. **Federal** - National proposals affecting all citizens

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Polygon Blockchain                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐        ┌─────────────────────┐   │
│  │ Voting Contract  │◄──────►│  ZK Verifier        │   │
│  └──────────────────┘        └─────────────────────┘   │
│           ▲                            ▲                 │
│           │                            │                 │
└───────────┼────────────────────────────┼─────────────────┘
            │                            │
     ┌──────▼──────┐              ┌─────▼─────┐
     │   Citizens  │              │   Proofs   │
     └─────────────┘              └───────────┘
```

## 📜 Smart Contract Functions

### Identity Management

```solidity
// Register a new identity with ZK proof
function registerIdentity(
    bytes32 nullifier,           // Unique identifier preventing duplicates
    bytes32 identityCommitment,  // ZK commitment of identity
    uint256 municipalityCode,    // User's municipality
    uint256 stateCode,          // User's state
    bytes calldata proof        // Zero-knowledge proof
)
```

### Voting Functions

```solidity
// Cast an anonymous vote
function castVote(
    uint256 proposalId,         // Which proposal to vote on
    bytes32 identityCommitment, // Voter's identity
    uint8 vote,                // 1=YES, 2=NO, 3=ABSTAIN
    bytes32 nullifier,         // Prevents double voting
    bytes calldata proof,      // ZK proof of eligibility
    bytes32[] merkleProof      // Optional: for restricted voting
)
```

### Results & Auditing

```solidity
// Get overall results
function getResults(uint256 proposalId) returns (
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes,
    uint256 totalVotes,
    uint256 participationRate,
    bool isActive
)

// Get zone-specific results for auditing
function getZoneResults(uint256 proposalId, uint256 zone) returns (
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes,
    uint256 totalVotes,
    uint256 eligibleVoters,
    uint256 actualVoters
)
```

## 🔒 Privacy Model

### What IS Stored
- ✅ Anonymous vote commitments
- ✅ Nullifiers (prevent double voting)
- ✅ Zone-aggregated statistics
- ✅ Total vote counts

### What is NOT Stored
- ❌ Personal information
- ❌ Link between identity and votes
- ❌ Individual vote choices
- ❌ Biometric data

## 📊 Auditing Capabilities

### Public Auditing
Anyone can verify:
- Total votes per proposal
- Zone-based participation rates
- Overall results (YES/NO/ABSTAIN)
- Voting timeline and status

### Authorized Auditing
Auditors with proper role can:
- Verify vote commitments
- Check mathematical proofs
- Validate zone statistics
- Ensure no manipulation

## 🚀 Deployment Guide

### Prerequisites
```bash
# Install dependencies
npm install hardhat ethers @openzeppelin/contracts

# Set environment variables
export POLYGON_RPC_URL="https://polygon-rpc.com"
export PRIVATE_KEY="your-deployment-key"
export NETWORK="mumbai" # or "mainnet"
```

### Deploy Contracts
```bash
# Compile contracts
npx hardhat compile

# Deploy to Polygon Mumbai (testnet)
npx hardhat run scripts/deploy.ts --network mumbai

# Deploy to Polygon Mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

### Verify Contracts
```bash
# Verify on Polygonscan
npx hardhat verify --network mainnet DEPLOYED_ADDRESS
```

## 💻 Integration Examples

### JavaScript/TypeScript
```typescript
import { VotingIntegration } from '@shout-aloud/voting';

// Initialize
const voting = new VotingIntegration(
  votingAddress,
  verifierAddress,
  provider
);

// Register identity
const result = await voting.registerIdentity(
  nullifier,
  identityCommitment,
  municipalityCode,
  stateCode,
  zkProof
);

// Cast vote
const voteResult = await voting.castVote(
  proposalId,
  identityCommitment,
  1, // YES
  voteNullifier,
  zkProof
);

// Get results
const results = await voting.getResults(proposalId);
console.log(`YES: ${results.yes}, NO: ${results.no}, ABSTAIN: ${results.abstain}`);
```

### Direct Contract Interaction
```javascript
// Using ethers.js
const voting = new ethers.Contract(address, abi, signer);

// Cast vote transaction
const tx = await voting.castVote(
  proposalId,
  identityCommitment,
  vote,
  nullifier,
  proof,
  []
);

await tx.wait();
```

## 📈 Gas Costs (Polygon)

| Operation | Estimated Gas | Cost (50 Gwei) |
|-----------|--------------|----------------|
| Register Identity | ~150,000 | ~0.0075 MATIC |
| Cast Vote | ~200,000 | ~0.01 MATIC |
| Create Proposal | ~100,000 | ~0.005 MATIC |
| Get Results | ~50,000 | ~0.0025 MATIC |

## 🛡️ Security Considerations

### Implemented Protections
- ✅ Reentrancy guards on all state-changing functions
- ✅ Access control for administrative functions
- ✅ Pausable in case of emergency
- ✅ Input validation on all parameters
- ✅ Zero-knowledge proof verification

### Best Practices
1. Always verify ZK proofs before voting
2. Use unique nullifiers for each vote
3. Keep identity commitments secure
4. Monitor gas prices before transactions
5. Verify contract addresses before interaction

## 📱 Frontend Integration

### Required Data
```typescript
interface VotingData {
  // From identity module
  identityCommitment: string;
  municipalityCode: number;
  
  // For voting
  proposalId: number;
  voteChoice: 1 | 2 | 3; // YES | NO | ABSTAIN
  
  // Generated per vote
  voteNullifier: string;
  zkProof: ProofData;
}
```

### User Flow
1. **View Proposals** - Show active proposals for user's zone
2. **Select Vote** - Choose YES/NO/ABSTAIN
3. **Generate Proof** - Create ZK proof locally
4. **Submit Vote** - Send transaction to blockchain
5. **View Results** - Show real-time results

## 🔍 Monitoring & Analytics

### Events to Monitor
```solidity
event IdentityRegistered(bytes32 indexed identityCommitment, uint256 indexed municipalityCode);
event ProposalCreated(uint256 indexed proposalId, uint8 scope, uint256 targetZone);
event VoteCommitted(uint256 indexed proposalId, bytes32 indexed voteCommitment, uint256 zone);
event ProposalFinalized(uint256 indexed proposalId, uint256 yes, uint256 no, uint256 abstain);
```

### Key Metrics
- **Participation Rate** - Voters / Eligible Citizens
- **Zone Distribution** - Votes per municipality/state
- **Vote Distribution** - YES vs NO vs ABSTAIN ratios
- **Time to Finalization** - Proposal lifecycle

## 🚨 Emergency Procedures

### Pause Voting
```solidity
// Only admin can pause
await voting.pause();

// Resume when safe
await voting.unpause();
```

### Update Roles
```solidity
// Grant new validator
await voting.grantRole(VALIDATOR_ROLE, newValidator);

// Revoke compromised admin
await voting.revokeRole(ADMIN_ROLE, compromisedAdmin);
```

## 📞 Support & Resources

- **Documentation**: https://docs.shoutaloud.org
- **Discord**: https://discord.gg/shoutaloud
- **GitHub**: https://github.com/shoutaloud
- **Email**: support@shoutaloud.org

## ⚖️ License

MIT License - Open source for the people

---

*"When the people speak, power listens. One person, one vote, one voice."*