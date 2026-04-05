// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ShoutAloudVoting
 * @notice Complete voting system with anonymous voting and zone-based auditing
 * @dev Implements one person one vote with YES/NO/ABSTAIN options on Polygon
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ShoutAloudVoting is ReentrancyGuard, Pausable, AccessControl {
    // ============ Constants ============
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant MUNICIPALITY_ADMIN_ROLE = keccak256("MUNICIPALITY_ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    uint8 public constant VOTE_YES = 1;
    uint8 public constant VOTE_NO = 2;
    uint8 public constant VOTE_ABSTAIN = 3;
    
    // ============ State Variables ============
    uint256 private _proposalIdCounter;
    
    // Nullifiers to prevent double registration (one person = one identity)
    mapping(bytes32 => bool) public nullifierExists;
    
    // Identity registry (DID hash => Identity)
    mapping(bytes32 => Identity) public identities;
    
    // Proposals
    mapping(uint256 => Proposal) public proposals;
    
    // Vote commitments for privacy
    mapping(uint256 => mapping(bytes32 => bytes32)) private voteCommitments;
    
    // Municipality proposals for easy querying
    mapping(uint256 => uint256[]) public municipalityProposals;
    
    // Zone statistics for auditing
    mapping(uint256 => mapping(uint256 => ZoneStats)) public zoneStats;
    
    // ============ Structs ============
    struct Identity {
        bool registered;
        bytes32 nullifier;
        bytes32 identityCommitment;
        uint256 municipalityCode;
        uint256 stateCode;
        uint256 registrationBlock;
        uint256 reputation;
    }
    
    struct Proposal {
        string ipfsHash;                    // Full proposal content
        ProposalType proposalType;
        uint256 targetZone;                 // Municipality/State/Country code
        uint256 startBlock;
        uint256 endBlock;
        bool finalized;
        bytes32 merkleRoot;                 // For eligible voters
        VoteCount totalVotes;
        mapping(bytes32 => bool) hasVoted;  // Track who voted
        mapping(uint256 => ZoneStats) zoneBreakdown;  // Stats per zone
    }
    
    struct ProposalType {
        uint8 scope;       // 0: Municipal, 1: State, 2: Federal
        uint8 category;    // 0: Law, 1: Budget, 2: Infrastructure, etc.
    }
    
    struct VoteCount {
        uint256 yes;
        uint256 no;
        uint256 abstain;
        uint256 total;
    }
    
    struct ZoneStats {
        uint256 totalVoters;
        uint256 actualVoters;
        VoteCount votes;
    }
    
    // ============ Events ============
    event IdentityRegistered(
        bytes32 indexed identityCommitment,
        uint256 indexed municipalityCode,
        uint256 stateCode
    );
    
    event ProposalCreated(
        uint256 indexed proposalId,
        uint8 scope,
        uint256 targetZone,
        uint256 startBlock,
        uint256 endBlock
    );
    
    event VoteCommitted(
        uint256 indexed proposalId,
        bytes32 indexed voteCommitment,
        uint256 indexed zone
    );
    
    event ProposalFinalized(
        uint256 indexed proposalId,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 abstainVotes
    );
    
    event ZoneStatsUpdated(
        uint256 indexed proposalId,
        uint256 indexed zone,
        uint256 participation
    );
    
    // ============ Modifiers ============
    modifier onlyRegistered(bytes32 identityCommitment) {
        require(identities[identityCommitment].registered, "Identity not registered");
        _;
    }
    
    modifier proposalExists(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= _proposalIdCounter, "Invalid proposal");
        _;
    }
    
    modifier votingActive(uint256 proposalId) {
        require(block.number >= proposals[proposalId].startBlock, "Voting not started");
        require(block.number <= proposals[proposalId].endBlock, "Voting ended");
        require(!proposals[proposalId].finalized, "Proposal finalized");
        _;
    }
    
    // ============ Constructor ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }
    
    // ============ Identity Management ============
    
    /**
     * @notice Register a new identity with ZK proof
     * @param nullifier Unique nullifier to prevent duplicates
     * @param identityCommitment ZK commitment of identity
     * @param municipalityCode User's municipality
     * @param stateCode User's state
     * @param proof ZK proof of valid identity
     */
    function registerIdentity(
        bytes32 nullifier,
        bytes32 identityCommitment,
        uint256 municipalityCode,
        uint256 stateCode,
        bytes calldata proof
    ) external whenNotPaused {
        // Verify one person = one identity
        require(!nullifierExists[nullifier], "Identity already exists");
        require(!identities[identityCommitment].registered, "Commitment already registered");
        
        // Verify ZK proof (simplified - in production use actual verifier)
        require(_verifyIdentityProof(nullifier, identityCommitment, municipalityCode, proof), "Invalid proof");
        
        // Register identity
        nullifierExists[nullifier] = true;
        identities[identityCommitment] = Identity({
            registered: true,
            nullifier: nullifier,
            identityCommitment: identityCommitment,
            municipalityCode: municipalityCode,
            stateCode: stateCode,
            registrationBlock: block.number,
            reputation: 0
        });
        
        emit IdentityRegistered(identityCommitment, municipalityCode, stateCode);
    }
    
    // ============ Proposal Management ============
    
    /**
     * @notice Create a new proposal
     * @param ipfsHash IPFS hash of proposal content
     * @param scope Voting scope (0: Municipal, 1: State, 2: Federal)
     * @param category Proposal category
     * @param targetZone Target municipality/state/country code
     * @param votingDuration Duration in blocks
     * @param merkleRoot Merkle root of eligible voters (optional)
     */
    function createProposal(
        string memory ipfsHash,
        uint8 scope,
        uint8 category,
        uint256 targetZone,
        uint256 votingDuration,
        bytes32 merkleRoot
    ) external onlyRole(MUNICIPALITY_ADMIN_ROLE) returns (uint256) {
        require(scope <= 2, "Invalid scope");
        require(votingDuration > 0 && votingDuration <= 100800, "Invalid duration"); // Max ~2 weeks
        
        _proposalIdCounter++;
        uint256 proposalId = _proposalIdCounter;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.ipfsHash = ipfsHash;
        newProposal.proposalType = ProposalType(scope, category);
        newProposal.targetZone = targetZone;
        newProposal.startBlock = block.number;
        newProposal.endBlock = block.number + votingDuration;
        newProposal.merkleRoot = merkleRoot;
        
        // Add to municipality list
        if (scope == 0) {
            municipalityProposals[targetZone].push(proposalId);
        }
        
        emit ProposalCreated(proposalId, scope, targetZone, newProposal.startBlock, newProposal.endBlock);
        
        return proposalId;
    }
    
    // ============ Voting ============
    
    /**
     * @notice Cast anonymous vote with ZK proof
     * @param proposalId Proposal to vote on
     * @param identityCommitment Voter's identity commitment
     * @param vote Vote choice (1: YES, 2: NO, 3: ABSTAIN)
     * @param nullifier Unique nullifier for this vote
     * @param proof ZK proof of eligibility
     * @param merkleProof Merkle proof if required
     */
    function castVote(
        uint256 proposalId,
        bytes32 identityCommitment,
        uint8 vote,
        bytes32 nullifier,
        bytes calldata proof,
        bytes32[] calldata merkleProof
    ) external 
        nonReentrant 
        whenNotPaused
        proposalExists(proposalId)
        votingActive(proposalId)
        onlyRegistered(identityCommitment)
    {
        require(vote >= VOTE_YES && vote <= VOTE_ABSTAIN, "Invalid vote");
        
        Proposal storage proposal = proposals[proposalId];
        Identity storage identity = identities[identityCommitment];
        
        // Verify hasn't voted (one person = one vote)
        require(!proposal.hasVoted[nullifier], "Already voted");
        
        // Verify eligibility based on proposal scope
        require(_isEligible(identity, proposal), "Not eligible for this proposal");
        
        // Verify merkle proof if required
        if (proposal.merkleRoot != bytes32(0)) {
            require(
                MerkleProof.verify(merkleProof, proposal.merkleRoot, identityCommitment),
                "Not in eligible voters list"
            );
        }
        
        // Verify ZK proof of valid vote
        require(_verifyVoteProof(proposalId, identityCommitment, vote, nullifier, proof), "Invalid vote proof");
        
        // Record vote
        proposal.hasVoted[nullifier] = true;
        
        // Update vote counts
        if (vote == VOTE_YES) {
            proposal.totalVotes.yes++;
        } else if (vote == VOTE_NO) {
            proposal.totalVotes.no++;
        } else {
            proposal.totalVotes.abstain++;
        }
        proposal.totalVotes.total++;
        
        // Update zone statistics
        uint256 voterZone = _getVoterZone(identity, proposal.proposalType.scope);
        _updateZoneStats(proposalId, voterZone, vote);
        
        // Store vote commitment for verification
        bytes32 voteCommitment = keccak256(abi.encodePacked(proposalId, vote, nullifier));
        voteCommitments[proposalId][nullifier] = voteCommitment;
        
        // Update reputation
        identity.reputation++;
        
        emit VoteCommitted(proposalId, voteCommitment, voterZone);
    }
    
    // ============ Results & Auditing ============
    
    /**
     * @notice Get proposal results
     * @param proposalId Proposal ID
     * @return yesVotes Total YES votes
     * @return noVotes Total NO votes
     * @return abstainVotes Total ABSTAIN votes
     * @return totalVotes Total votes cast
     * @return participationRate Participation rate in basis points
     * @return isActive Whether voting is still active
     */
    function getResults(uint256 proposalId) 
        external 
        view 
        proposalExists(proposalId)
        returns (
            uint256 yesVotes,
            uint256 noVotes,
            uint256 abstainVotes,
            uint256 totalVotes,
            uint256 participationRate,
            bool isActive
        )
    {
        Proposal storage proposal = proposals[proposalId];
        
        yesVotes = proposal.totalVotes.yes;
        noVotes = proposal.totalVotes.no;
        abstainVotes = proposal.totalVotes.abstain;
        totalVotes = proposal.totalVotes.total;
        
        // Calculate participation rate (simplified)
        uint256 eligibleVoters = _getEligibleVotersCount(proposalId);
        participationRate = eligibleVoters > 0 ? (totalVotes * 10000) / eligibleVoters : 0; // Basis points
        
        isActive = block.number <= proposal.endBlock && !proposal.finalized;
    }
    
    /**
     * @notice Get zone-based statistics for auditing
     * @param proposalId Proposal ID
     * @param zone Zone code (municipality/state)
     * @return yesVotes YES votes in zone
     * @return noVotes NO votes in zone
     * @return abstainVotes ABSTAIN votes in zone
     * @return totalVotes Total votes in zone
     */
    function getZoneResults(uint256 proposalId, uint256 zone)
        external
        view
        proposalExists(proposalId)
        returns (
            uint256 yesVotes,
            uint256 noVotes,
            uint256 abstainVotes,
            uint256 totalVotes,
            uint256 eligibleVoters,
            uint256 actualVoters
        )
    {
        ZoneStats storage stats = zoneStats[proposalId][zone];
        
        yesVotes = stats.votes.yes;
        noVotes = stats.votes.no;
        abstainVotes = stats.votes.abstain;
        totalVotes = stats.votes.total;
        eligibleVoters = stats.totalVoters;
        actualVoters = stats.actualVoters;
    }
    
    /**
     * @notice Finalize proposal after voting ends
     * @param proposalId Proposal to finalize
     */
    function finalizeProposal(uint256 proposalId)
        external
        proposalExists(proposalId)
        onlyRole(MUNICIPALITY_ADMIN_ROLE)
    {
        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.endBlock, "Voting still active");
        require(!proposal.finalized, "Already finalized");
        
        proposal.finalized = true;
        
        emit ProposalFinalized(
            proposalId,
            proposal.totalVotes.yes,
            proposal.totalVotes.no,
            proposal.totalVotes.abstain
        );
    }
    
    /**
     * @notice Audit function to verify vote integrity
     * @param proposalId Proposal ID
     * @param nullifier Vote nullifier
     * @param voteCommitment Commitment to verify
     */
    function verifyVote(
        uint256 proposalId,
        bytes32 nullifier,
        bytes32 voteCommitment
    ) external view onlyRole(AUDITOR_ROLE) returns (bool) {
        return voteCommitments[proposalId][nullifier] == voteCommitment;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get active proposals for a municipality
     * @param municipalityCode Municipality code
     * @return Array of active proposal IDs
     */
    function getActiveProposals(uint256 municipalityCode) 
        external 
        view 
        returns (uint256[] memory)
    {
        uint256[] memory municipalProposals = municipalityProposals[municipalityCode];
        uint256 activeCount = 0;
        
        // Count active proposals
        for (uint256 i = 0; i < municipalProposals.length; i++) {
            if (_isProposalActive(municipalProposals[i])) {
                activeCount++;
            }
        }
        
        // Build array of active proposals
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < municipalProposals.length; i++) {
            if (_isProposalActive(municipalProposals[i])) {
                activeProposals[index] = municipalProposals[i];
                index++;
            }
        }
        
        return activeProposals;
    }
    
    /**
     * @notice Check if identity can vote on proposal
     * @param identityCommitment Identity to check
     * @param proposalId Proposal ID
     * @return eligible Whether identity can vote
     */
    function canVote(bytes32 identityCommitment, uint256 proposalId)
        external
        view
        returns (bool eligible)
    {
        if (!identities[identityCommitment].registered) return false;
        if (!_isProposalActive(proposalId)) return false;
        
        Identity storage identity = identities[identityCommitment];
        Proposal storage proposal = proposals[proposalId];
        
        return _isEligible(identity, proposal);
    }
    
    // ============ Internal Functions ============
    
    function _isEligible(Identity storage identity, Proposal storage proposal) 
        private 
        view 
        returns (bool)
    {
        uint8 scope = proposal.proposalType.scope;
        uint256 targetZone = proposal.targetZone;
        
        if (scope == 0) { // Municipal
            return identity.municipalityCode == targetZone;
        } else if (scope == 1) { // State
            return identity.stateCode == targetZone;
        } else { // Federal
            return true; // All registered users can vote
        }
    }
    
    function _getVoterZone(Identity storage identity, uint8 scope) 
        private 
        view 
        returns (uint256)
    {
        if (scope == 0) return identity.municipalityCode;
        if (scope == 1) return identity.stateCode;
        return 0; // Federal level
    }
    
    function _updateZoneStats(uint256 proposalId, uint256 zone, uint8 vote)
        private
    {
        ZoneStats storage stats = zoneStats[proposalId][zone];
        
        stats.actualVoters++;
        stats.votes.total++;
        
        if (vote == VOTE_YES) {
            stats.votes.yes++;
        } else if (vote == VOTE_NO) {
            stats.votes.no++;
        } else {
            stats.votes.abstain++;
        }
        
        emit ZoneStatsUpdated(proposalId, zone, stats.actualVoters);
    }
    
    function _isProposalActive(uint256 proposalId) private view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return block.number <= proposal.endBlock && !proposal.finalized;
    }
    
    function _getEligibleVotersCount(uint256 proposalId) private view returns (uint256) {
        // In production, this would query the actual count from registry
        // For now, return a placeholder
        return 10000;
    }
    
    function _verifyIdentityProof(
        bytes32 nullifier,
        bytes32 identityCommitment,
        uint256 municipalityCode,
        bytes calldata proof
    ) private pure returns (bool) {
        // In production, integrate with ZK verifier contract
        // Verify the proof validates:
        // 1. User owns the identity
        // 2. Identity is unique (nullifier)
        // 3. Municipality is correct
        return proof.length > 0;
    }
    
    function _verifyVoteProof(
        uint256 proposalId,
        bytes32 identityCommitment,
        uint8 vote,
        bytes32 nullifier,
        bytes calldata proof
    ) private pure returns (bool) {
        // In production, integrate with ZK verifier contract
        // Verify the proof validates:
        // 1. User owns the identity
        // 2. Vote is valid
        // 3. Nullifier prevents double voting
        return proof.length > 0;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update zone voter count for statistics
     * @param proposalId Proposal ID
     * @param zone Zone code
     * @param voterCount Total eligible voters in zone
     */
    function updateZoneVoterCount(
        uint256 proposalId,
        uint256 zone,
        uint256 voterCount
    ) external onlyRole(VALIDATOR_ROLE) {
        zoneStats[proposalId][zone].totalVoters = voterCount;
    }
    
    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}