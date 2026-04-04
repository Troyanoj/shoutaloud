/**
 * Test Suite for Shout Aloud Voting System
 * Tests all voting scenarios with privacy and auditing
 */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { VotingIntegration } from './voting-deployment';

describe('Shout Aloud Voting System', () => {
  let voting: Contract;
  let verifier: Contract;
  let integration: VotingIntegration;
  let owner: Signer;
  let validator: Signer;
  let municipalityAdmin: Signer;
  let citizen1: Signer;
  let citizen2: Signer;
  let citizen3: Signer;
  
  // Test data
  const MUNICIPALITY_CDMX = 9015; // Benito Juárez
  const MUNICIPALITY_GDL = 5012;  // Guadalajara
  const STATE_CDMX = 9;
  const STATE_JALISCO = 5;
  
  before(async () => {
    // Get signers
    [owner, validator, municipalityAdmin, citizen1, citizen2, citizen3] = await ethers.getSigners();
    
    // Deploy contracts
    const VerifierFactory = await ethers.getContractFactory('ShoutAloudZKVerifier');
    verifier = await VerifierFactory.deploy();
    await verifier.deployed();
    
    const VotingFactory = await ethers.getContractFactory('ShoutAloudVoting');
    voting = await VotingFactory.deploy();
    await voting.deployed();
    
    // Setup roles
    await voting.grantRole(await voting.VALIDATOR_ROLE(), validator.address);
    await voting.grantRole(await voting.MUNICIPALITY_ADMIN_ROLE(), municipalityAdmin.address);
    
    // Initialize integration helper
    const provider = ethers.provider;
    integration = new VotingIntegration(voting.address, verifier.address, provider);
  });
  
  describe('Identity Registration', () => {
    it('Should register a new identity with one person = one identity guarantee', async () => {
      const nullifier = ethers.utils.id('citizen1-unique');
      const identityCommitment = ethers.utils.id('citizen1-commitment');
      const proof = generateMockProof();
      
      await expect(
        voting.registerIdentity(
          nullifier,
          identityCommitment,
          MUNICIPALITY_CDMX,
          STATE_CDMX,
          proof
        )
      ).to.emit(voting, 'IdentityRegistered')
        .withArgs(identityCommitment, MUNICIPALITY_CDMX, STATE_CDMX);
      
      // Verify identity is registered
      const identity = await voting.identities(identityCommitment);
      expect(identity.registered).to.be.true;
      expect(identity.municipalityCode).to.equal(MUNICIPALITY_CDMX);
    });
    
    it('Should prevent duplicate registration (one person = one identity)', async () => {
      const nullifier = ethers.utils.id('citizen1-unique'); // Same nullifier
      const identityCommitment2 = ethers.utils.id('citizen1-commitment-2');
      const proof = generateMockProof();
      
      // Try to register with same nullifier
      await expect(
        voting.registerIdentity(
          nullifier,
          identityCommitment2,
          MUNICIPALITY_CDMX,
          STATE_CDMX,
          proof
        )
      ).to.be.revertedWith('Identity already exists');
    });
    
    it('Should register citizens from different municipalities', async () => {
      // Citizen 2 from CDMX
      const nullifier2 = ethers.utils.id('citizen2-unique');
      const commitment2 = ethers.utils.id('citizen2-commitment');
      
      await voting.registerIdentity(
        nullifier2,
        commitment2,
        MUNICIPALITY_CDMX,
        STATE_CDMX,
        generateMockProof()
      );
      
      // Citizen 3 from Guadalajara
      const nullifier3 = ethers.utils.id('citizen3-unique');
      const commitment3 = ethers.utils.id('citizen3-commitment');
      
      await voting.registerIdentity(
        nullifier3,
        commitment3,
        MUNICIPALITY_GDL,
        STATE_JALISCO,
        generateMockProof()
      );
      
      const identity2 = await voting.identities(commitment2);
      const identity3 = await voting.identities(commitment3);
      
      expect(identity2.municipalityCode).to.equal(MUNICIPALITY_CDMX);
      expect(identity3.municipalityCode).to.equal(MUNICIPALITY_GDL);
    });
  });
  
  describe('Proposal Creation', () => {
    let municipalProposalId: number;
    let stateProposalId: number;
    let federalProposalId: number;
    
    it('Should create a municipal proposal', async () => {
      const ipfsHash = 'QmXxx...'; // Mock IPFS hash
      const scope = 0; // Municipal
      const category = 2; // Infrastructure
      const votingDuration = 50400; // ~1 day in blocks
      
      const tx = await voting.connect(municipalityAdmin).createProposal(
        ipfsHash,
        scope,
        category,
        MUNICIPALITY_CDMX,
        votingDuration,
        ethers.constants.HashZero
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'ProposalCreated');
      municipalProposalId = event?.args?.proposalId?.toNumber();
      
      expect(municipalProposalId).to.equal(1);
    });
    
    it('Should create a state-level proposal', async () => {
      const tx = await voting.connect(municipalityAdmin).createProposal(
        'QmYyy...',
        1, // State scope
        0, // Law category
        STATE_CDMX,
        100800, // ~2 days
        ethers.constants.HashZero
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'ProposalCreated');
      stateProposalId = event?.args?.proposalId?.toNumber();
      
      expect(stateProposalId).to.equal(2);
    });
    
    it('Should create a federal proposal', async () => {
      const tx = await voting.connect(municipalityAdmin).createProposal(
        'QmZzz...',
        2, // Federal scope
        1, // Budget category
        0, // Country level
        151200, // ~3 days
        ethers.constants.HashZero
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'ProposalCreated');
      federalProposalId = event?.args?.proposalId?.toNumber();
      
      expect(federalProposalId).to.equal(3);
    });
  });
  
  describe('Voting with YES/NO/ABSTAIN', () => {
    const commitment1 = ethers.utils.id('citizen1-commitment');
    const commitment2 = ethers.utils.id('citizen2-commitment');
    const commitment3 = ethers.utils.id('citizen3-commitment');
    
    it('Should allow YES vote on municipal proposal', async () => {
      const voteNullifier = ethers.utils.id('vote1-proposal1');
      const vote = 1; // YES
      
      await expect(
        voting.castVote(
          1, // municipalProposalId
          commitment1,
          vote,
          voteNullifier,
          generateMockProof(),
          []
        )
      ).to.emit(voting, 'VoteCommitted');
      
      // Check results
      const results = await voting.getResults(1);
      expect(results.yesVotes).to.equal(1);
      expect(results.noVotes).to.equal(0);
      expect(results.abstainVotes).to.equal(0);
    });
    
    it('Should allow NO vote', async () => {
      const voteNullifier = ethers.utils.id('vote2-proposal1');
      const vote = 2; // NO
      
      await voting.castVote(
        1,
        commitment2,
        vote,
        voteNullifier,
        generateMockProof(),
        []
      );
      
      const results = await voting.getResults(1);
      expect(results.yesVotes).to.equal(1);
      expect(results.noVotes).to.equal(1);
      expect(results.abstainVotes).to.equal(0);
    });
    
    it('Should allow ABSTAIN vote', async () => {
      // First register a new citizen in same municipality
      const nullifier4 = ethers.utils.id('citizen4-unique');
      const commitment4 = ethers.utils.id('citizen4-commitment');
      
      await voting.registerIdentity(
        nullifier4,
        commitment4,
        MUNICIPALITY_CDMX,
        STATE_CDMX,
        generateMockProof()
      );
      
      // Cast ABSTAIN vote
      const voteNullifier = ethers.utils.id('vote4-proposal1');
      const vote = 3; // ABSTAIN
      
      await voting.castVote(
        1,
        commitment4,
        vote,
        voteNullifier,
        generateMockProof(),
        []
      );
      
      const results = await voting.getResults(1);
      expect(results.yesVotes).to.equal(1);
      expect(results.noVotes).to.equal(1);
      expect(results.abstainVotes).to.equal(1);
      expect(results.totalVotes).to.equal(3);
    });
    
    it('Should prevent double voting (one person = one vote)', async () => {
      const voteNullifier = ethers.utils.id('vote1-proposal1'); // Same nullifier
      
      await expect(
        voting.castVote(
          1,
          commitment1,
          1, // YES
          voteNullifier,
          generateMockProof(),
          []
        )
      ).to.be.revertedWith('Already voted');
    });
    
    it('Should prevent voting outside municipality', async () => {
      // Citizen from Guadalajara trying to vote on CDMX proposal
      const voteNullifier = ethers.utils.id('vote3-proposal1');
      
      await expect(
        voting.castVote(
          1, // CDMX municipal proposal
          commitment3, // Guadalajara citizen
          1,
          voteNullifier,
          generateMockProof(),
          []
        )
      ).to.be.revertedWith('Not eligible for this proposal');
    });
    
    it('Should allow all citizens to vote on federal proposals', async () => {
      // CDMX citizen
      await voting.castVote(
        3, // federal proposal
        commitment1,
        1, // YES
        ethers.utils.id('vote1-proposal3'),
        generateMockProof(),
        []
      );
      
      // Guadalajara citizen
      await voting.castVote(
        3,
        commitment3,
        2, // NO
        ethers.utils.id('vote3-proposal3'),
        generateMockProof(),
        []
      );
      
      const results = await voting.getResults(3);
      expect(results.yesVotes).to.equal(1);
      expect(results.noVotes).to.equal(1);
      expect(results.totalVotes).to.equal(2);
    });
  });
  
  describe('Anonymous Storage & Auditing', () => {
    it('Should store votes anonymously', async () => {
      // Votes are stored with nullifiers, not linked to identity
      const proposalId = 1;
      const nullifier = ethers.utils.id('vote1-proposal1');
      
      // Cannot query individual votes by identity
      // Only aggregate results are available
      const results = await voting.getResults(proposalId);
      expect(results.totalVotes).to.be.gt(0);
    });
    
    it('Should provide zone-based audit results', async () => {
      const proposalId = 1;
      const zone = MUNICIPALITY_CDMX;
      
      const zoneResults = await voting.getZoneResults(proposalId, zone);
      
      expect(zoneResults.yesVotes).to.equal(1);
      expect(zoneResults.noVotes).to.equal(1);
      expect(zoneResults.abstainVotes).to.equal(1);
      expect(zoneResults.totalVotes).to.equal(3);
      expect(zoneResults.actualVoters).to.equal(3);
    });
    
    it('Should track participation by zone', async () => {
      // Set eligible voters for zone
      await voting.connect(validator).updateZoneVoterCount(1, MUNICIPALITY_CDMX, 1000);
      
      const zoneResults = await voting.getZoneResults(1, MUNICIPALITY_CDMX);
      expect(zoneResults.eligibleVoters).to.equal(1000);
      expect(zoneResults.actualVoters).to.equal(3);
      
      // Participation rate: 3/1000 = 0.3%
      const participationRate = (zoneResults.actualVoters * 100) / zoneResults.eligibleVoters;
      expect(participationRate).to.equal(0.3);
    });
    
    it('Should verify vote integrity for auditors', async () => {
      // Only auditors can verify specific votes
      await voting.grantRole(await voting.AUDITOR_ROLE(), owner.address);
      
      const nullifier = ethers.utils.id('vote1-proposal1');
      const proposalId = 1;
      const vote = 1; // YES
      
      // Calculate expected commitment
      const expectedCommitment = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'uint8', 'bytes32'],
          [proposalId, vote, nullifier]
        )
      );
      
      // Auditor can verify the vote commitment
      const isValid = await voting.connect(owner).verifyVote(
        proposalId,
        nullifier,
        expectedCommitment
      );
      
      expect(isValid).to.be.true;
    });
  });
  
  describe('Proposal Finalization', () => {
    it('Should not allow finalization while voting is active', async () => {
      await expect(
        voting.connect(municipalityAdmin).finalizeProposal(1)
      ).to.be.revertedWith('Voting still active');
    });
    
    it('Should finalize proposal after voting ends', async () => {
      // Advance blocks to end voting
      const proposal = await voting.proposals(1);
      const blocksToMine = proposal.endBlock - await ethers.provider.getBlockNumber() + 1;
      
      for (let i = 0; i < blocksToMine; i++) {
        await ethers.provider.send('evm_mine', []);
      }
      
      await expect(
        voting.connect(municipalityAdmin).finalizeProposal(1)
      ).to.emit(voting, 'ProposalFinalized')
        .withArgs(1, 1, 1, 1); // proposalId, yes, no, abstain
      
      // Check proposal is finalized
      const proposalAfter = await voting.proposals(1);
      expect(proposalAfter.finalized).to.be.true;
    });
  });
  
  describe('Security & Edge Cases', () => {
    it('Should reject invalid vote options', async () => {
      const nullifier = ethers.utils.id('invalid-vote');
      
      await expect(
        voting.castVote(
          2, // state proposal
          commitment1,
          4, // Invalid vote option
          nullifier,
          generateMockProof(),
          []
        )
      ).to.be.revertedWith('Invalid vote');
    });
    
    it('Should handle pause/unpause for emergencies', async () => {
      // Pause contract
      await voting.connect(owner).pause();
      
      // Try to register identity while paused
      await expect(
        voting.registerIdentity(
          ethers.utils.id('new-nullifier'),
          ethers.utils.id('new-commitment'),
          MUNICIPALITY_CDMX,
          STATE_CDMX,
          generateMockProof()
        )
      ).to.be.revertedWith('Pausable: paused');
      
      // Unpause
      await voting.connect(owner).unpause();
      
      // Should work now
      await voting.registerIdentity(
        ethers.utils.id('new-nullifier'),
        ethers.utils.id('new-commitment'),
        MUNICIPALITY_CDMX,
        STATE_CDMX,
        generateMockProof()
      );
    });
  });
});

/**
 * Integration Tests
 */
describe('Voting Integration Tests', () => {
  let integration: VotingIntegration;
  
  before(async () => {
    // Deploy fresh contracts for integration tests
    const [owner] = await ethers.getSigners();
    
    const VerifierFactory = await ethers.getContractFactory('ShoutAloudZKVerifier');
    const verifier = await VerifierFactory.deploy();
    
    const VotingFactory = await ethers.getContractFactory('ShoutAloudVoting');
    const voting = await VotingFactory.deploy();
    
    integration = new VotingIntegration(
      voting.address,
      verifier.address,
      ethers.provider
    );
    
    // Setup roles
    await voting.grantRole(await voting.MUNICIPALITY_ADMIN_ROLE(), owner.address);
  });
  
  it('Should handle complete voting flow through integration', async () => {
    // 1. Register identity
    const registerResult = await integration.registerIdentity(
      ethers.utils.id('integration-nullifier'),
      ethers.utils.id('integration-commitment'),
      MUNICIPALITY_CDMX,
      STATE_CDMX,
      { a: [1, 2], b: [[3, 4], [5, 6]], c: [7, 8] }
    );
    
    expect(registerResult.success).to.be.true;
    expect(registerResult.txHash).to.be.a('string');
    
    // 2. Create proposal
    const proposalResult = await integration.createProposal(
      'QmIntegrationTest...',
      0, // Municipal
      0, // Law
      MUNICIPALITY_CDMX,
      1, // 1 day voting
      undefined
    );
    
    expect(proposalResult.success).to.be.true;
    expect(proposalResult.proposalId).to.equal(1);
    
    // 3. Cast vote
    const voteResult = await integration.castVote(
      1,
      ethers.utils.id('integration-commitment'),
      1, // YES
      ethers.utils.id('integration-vote-nullifier'),
      { a: [1, 2], b: [[3, 4], [5, 6]], c: [7, 8] }
    );
    
    expect(voteResult.success).to.be.true;
    
    // 4. Get results
    const results = await integration.getResults(1);
    expect(results.yes).to.equal(1);
    expect(results.no).to.equal(0);
    expect(results.abstain).to.equal(0);
    expect(results.isActive).to.be.true;
    
    // 5. Get zone results
    const zoneResults = await integration.getZoneResults(1, MUNICIPALITY_CDMX);
    expect(zoneResults.votes.yes).to.equal(1);
    expect(zoneResults.participation.actual).to.equal(1);
  });
});

// Helper function to generate mock proof
function generateMockProof(): string {
  const proof = {
    a: [1, 2],
    b: [[3, 4], [5, 6]],
    c: [7, 8]
  };
  
  return ethers.utils.defaultAbiCoder.encode(
    ['uint256[2]', 'uint256[2][2]', 'uint256[2]'],
    [proof.a, proof.b, proof.c]
  );
}