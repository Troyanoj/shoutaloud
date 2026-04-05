// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ShoutAloudZKVerifier
 * @notice Groth16 verifier for zero-knowledge proofs in ShoutAloud
 * @dev Integrates with ShoutAloudVoting to verify identity and vote proofs
 *
 * In production, this contract is auto-generated from circom circuits
 * using snarkjs. For now, it provides the interface and stub verification
 * that will be replaced with actual Groth16 verification logic.
 */
contract ShoutAloudZKVerifier {
    // ============ State ============

    // Verifying key for identity proofs
    VerifyingKey internal identityVK;
    // Verifying key for vote proofs
    VerifyingKey internal voteVK;
    // Verifying key for geographic eligibility proofs
    VerifyingKey internal geoEligibilityVK;

    // Nullifier registry to prevent double voting
    mapping(bytes32 => bool) public identityNullifiers;
    mapping(bytes32 => bool) public voteNullifiers;

    // Events
    event IdentityProofVerified(bytes32 indexed nullifier, bool success);
    event VoteProofVerified(bytes32 indexed nullifier, uint256 indexed proposalId, bool success);
    event GeoEligibilityVerified(bytes32 indexed identityCommitment, uint256 zone, bool success);
    event VerifyingKeyUpdated(string proofType);

    // ============ Structs ============

    struct VerifyingKey {
        uint256[2] alpha1;
        uint256[2][2] beta2;
        uint256[2] gamma2;
        uint256[2] delta2;
        uint256[2] ic;
    }

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    // ============ Ownable ============

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;

        identityVK = VerifyingKey({
            alpha1: [uint256(0), uint256(0)],
            beta2: [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
            gamma2: [uint256(0), uint256(0)],
            delta2: [uint256(0), uint256(0)],
            ic: [uint256(0), uint256(0)]
        });
        voteVK = identityVK;
        geoEligibilityVK = identityVK;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ============ Identity Verification ============

    /**
     * @notice Verify a zero-knowledge proof of identity
     * @param nullifier Unique nullifier to prevent duplicate registration
     * @param identityCommitment Hash commitment of the user's identity
     * @param municipalityCode User's municipality code (public input)
     * @param proof Groth16 proof points [a, b, c]
     * @return success Whether the proof is valid
     */
    function verifyIdentityProof(
        bytes32 nullifier,
        bytes32 identityCommitment,
        uint256 municipalityCode,
        uint256[8] calldata proof
    ) external returns (bool success) {
        require(!identityNullifiers[nullifier], "Identity nullifier already used");

        // In production, this calls the Groth16 verifier:
        // success = _verifyProof(proof, identityVK, [nullifier, identityCommitment, municipalityCode]);

        // Stub: accept any non-empty proof for development
        success = proof[0] != 0 || proof[1] != 0;

        if (success) {
            identityNullifiers[nullifier] = true;
            emit IdentityProofVerified(nullifier, true);
        }
    }

    // ============ Vote Verification ============

    /**
     * @notice Verify a zero-knowledge proof of valid vote
     * @param proposalId The proposal being voted on
     * @param identityCommitment Voter's identity commitment
     * @param voteChoice Vote value (1=YES, 2=NO, 3=ABSTAIN)
     * @param nullifier Unique nullifier for this vote
     * @param proof Groth16 proof points [a, b, c]
     * @return success Whether the vote proof is valid
     */
    function verifyVoteProof(
        uint256 proposalId,
        bytes32 identityCommitment,
        uint8 voteChoice,
        bytes32 nullifier,
        uint256[8] calldata proof
    ) external returns (bool success) {
        require(!voteNullifiers[nullifier], "Vote nullifier already used");
        require(voteChoice >= 1 && voteChoice <= 3, "Invalid vote choice");

        // In production, this calls the Groth16 verifier:
        // success = _verifyProof(proof, voteVK, [proposalId, identityCommitment, voteChoice, nullifier]);

        // Stub: accept any non-empty proof for development
        success = proof[0] != 0 || proof[1] != 0;

        if (success) {
            voteNullifiers[nullifier] = true;
            emit VoteProofVerified(nullifier, proposalId, true);
        }
    }

    // ============ Geographic Eligibility ============

    /**
     * @notice Verify that a user is eligible to vote in a specific zone
     * @param identityCommitment User's identity commitment
     * @param zoneCode The zone they claim eligibility for
     * @param proof Groth16 proof points
     * @return success Whether the eligibility proof is valid
     */
    function verifyGeoEligibility(
        bytes32 identityCommitment,
        uint256 zoneCode,
        uint256[8] calldata proof
    ) external returns (bool success) {
        // In production, this verifies the user's geographic credentials
        // without revealing their actual location
        // success = _verifyProof(proof, geoEligibilityVK, [identityCommitment, zoneCode]);

        // Stub: accept any non-empty proof for development
        success = proof[0] != 0 || proof[1] != 0;

        if (success) {
            emit GeoEligibilityVerified(identityCommitment, zoneCode, true);
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the verifying key for a proof type
     * @param proofType Type of proof: "identity", "vote", or "geo"
     * @param alpha1 Alpha1 point
     * @param beta2 Beta2 point
     * @param gamma2 Gamma2 point
     * @param delta2 Delta2 point
     * @param ic IC point
     */
    function updateVerifyingKey(
        string calldata proofType,
        uint256[2] calldata alpha1,
        uint256[2][2] calldata beta2,
        uint256[2] calldata gamma2,
        uint256[2] calldata delta2,
        uint256[2] calldata ic
    ) external onlyOwner {
        VerifyingKey memory vk = VerifyingKey({
            alpha1: alpha1,
            beta2: beta2,
            gamma2: gamma2,
            delta2: delta2,
            ic: ic
        });

        if (keccak256(bytes(proofType)) == keccak256(bytes("identity"))) {
            identityVK = vk;
        } else if (keccak256(bytes(proofType)) == keccak256(bytes("vote"))) {
            voteVK = vk;
        } else if (keccak256(bytes(proofType)) == keccak256(bytes("geo"))) {
            geoEligibilityVK = vk;
        } else {
            revert("Unknown proof type");
        }

        emit VerifyingKeyUpdated(proofType);
    }

    /**
     * @notice Reset a nullifier (admin emergency function)
     * @param nullifierType "identity" or "vote"
     * @param nullifier The nullifier to reset
     */
    function resetNullifier(string calldata nullifierType, bytes32 nullifier) external onlyOwner {
        if (keccak256(bytes(nullifierType)) == keccak256(bytes("identity"))) {
            identityNullifiers[nullifier] = false;
        } else if (keccak256(bytes(nullifierType)) == keccak256(bytes("vote"))) {
            voteNullifiers[nullifier] = false;
        } else {
            revert("Unknown nullifier type");
        }
    }

    // ============ View Functions ============

    function isIdentityNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return identityNullifiers[nullifier];
    }

    function isVoteNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return voteNullifiers[nullifier];
    }

    // ============ Internal ============

    /**
     * @notice Internal Groth16 verification using pairing check
     * @dev In production, this uses the BN254 curve pairing check
     */
    function _verifyProof(
        uint256[8] calldata proof,
        VerifyingKey memory vk,
        uint256[] memory inputs
    ) internal pure returns (bool) {
        // Production implementation uses:
        // 1. Compute public input linear combination
        // 2. Perform BN254 pairing check: e(A, B) = e(alpha, beta) * e(IC, gamma) * e(C, delta)
        // 3. Return true if pairing check passes

        // This requires the pairing precompile at address 0x08 on BN254
        // For now, return stub
        return proof[0] != 0;
    }
}
