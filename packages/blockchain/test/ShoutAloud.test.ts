import { expect } from "chai";
import { ethers } from "hardhat";

describe("ShoutAloudZKVerifier", function () {
  let zkVerifier: any;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const ZKVerifier = await ethers.getContractFactory("ShoutAloudZKVerifier");
    zkVerifier = await ZKVerifier.deploy();
    await zkVerifier.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await zkVerifier.owner()).to.equal(await owner.getAddress());
    });

    it("Should initialize with empty nullifier registries", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test"));
      expect(await zkVerifier.isIdentityNullifierUsed(nullifier)).to.be.false;
      expect(await zkVerifier.isVoteNullifierUsed(nullifier)).to.be.false;
    });
  });

  describe("Identity Proof Verification", function () {
    it("Should verify a valid identity proof", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("identity-1"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("commitment-1"));
      const proof = [1, 2, 3, 4, 5, 6, 7, 8];

      const tx = await zkVerifier.verifyIdentityProof(
        nullifier, commitment, 1, proof
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (l: any) => l.fragment && l.fragment.name === "IdentityProofVerified"
      );
      expect(event).to.not.be.undefined;
      expect(await zkVerifier.isIdentityNullifierUsed(nullifier)).to.be.true;
    });

    it("Should reject duplicate identity nullifiers", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("identity-2"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("commitment-2"));
      const proof = [1, 2, 3, 4, 5, 6, 7, 8];

      await zkVerifier.verifyIdentityProof(nullifier, commitment, 1, proof);

      await expect(
        zkVerifier.verifyIdentityProof(nullifier, commitment, 1, proof)
      ).to.be.revertedWith("Identity nullifier already used");
    });
  });

  describe("Vote Proof Verification", function () {
    it("Should verify a valid vote proof", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("vote-1"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("voter-1"));
      const proof = [1, 2, 3, 4, 5, 6, 7, 8];

      await zkVerifier.verifyVoteProof(1, commitment, 1, nullifier, proof);
      expect(await zkVerifier.isVoteNullifierUsed(nullifier)).to.be.true;
    });

    it("Should reject invalid vote choices", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("vote-invalid"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("voter-invalid"));
      const proof = [1, 2, 3, 4, 5, 6, 7, 8];

      await expect(
        zkVerifier.verifyVoteProof(1, commitment, 0, nullifier, proof)
      ).to.be.revertedWith("Invalid vote choice");

      await expect(
        zkVerifier.verifyVoteProof(1, commitment, 4, nullifier, proof)
      ).to.be.revertedWith("Invalid vote choice");
    });

    it("Should reject duplicate vote nullifiers", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("vote-dup"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("voter-dup"));
      const proof = [1, 2, 3, 4, 5, 6, 7, 8];

      await zkVerifier.verifyVoteProof(1, commitment, 1, nullifier, proof);

      await expect(
        zkVerifier.verifyVoteProof(1, commitment, 2, nullifier, proof)
      ).to.be.revertedWith("Vote nullifier already used");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to transfer ownership", async function () {
      await zkVerifier.transferOwnership(await user.getAddress());
      expect(await zkVerifier.owner()).to.equal(await user.getAddress());
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        zkVerifier.connect(user).transferOwnership(await user.getAddress())
      ).to.be.revertedWith("Not owner");
    });

    it("Should allow owner to reset nullifiers", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("reset-test"));
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("reset-commit"));
      const proof = [1, 2, 3, 4, 5, 6, 7, 8];

      await zkVerifier.verifyIdentityProof(nullifier, commitment, 1, proof);
      expect(await zkVerifier.isIdentityNullifierUsed(nullifier)).to.be.true;

      await zkVerifier.resetNullifier("identity", nullifier);
      expect(await zkVerifier.isIdentityNullifierUsed(nullifier)).to.be.false;
    });
  });
});

describe("ShoutAloudVoting", function () {
  let voting: any;
  let owner: any;
  let validator: any;
  let admin: any;
  let user1: any;
  let user2: any;

  const NULLIFIER1 = ethers.keccak256(ethers.toUtf8Bytes("user1-nullifier"));
  const NULLIFIER2 = ethers.keccak256(ethers.toUtf8Bytes("user2-nullifier"));
  const COMMITMENT1 = ethers.keccak256(ethers.toUtf8Bytes("user1-commitment"));
  const COMMITMENT2 = ethers.keccak256(ethers.toUtf8Bytes("user2-commitment"));

  beforeEach(async () => {
    [owner, validator, admin, user1, user2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("ShoutAloudVoting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();

    // Setup roles
    const VALIDATOR_ROLE = await voting.VALIDATOR_ROLE();
    const MUNICIPALITY_ADMIN_ROLE = await voting.MUNICIPALITY_ADMIN_ROLE();

    await voting.grantRole(VALIDATOR_ROLE, await validator.getAddress());
    await voting.grantRole(MUNICIPALITY_ADMIN_ROLE, await admin.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      const DEFAULT_ADMIN_ROLE = await voting.DEFAULT_ADMIN_ROLE();
      expect(await voting.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())).to.be.true;
    });

    it("Should initialize with zero proposals", async function () {
      // No proposals exist yet, so we can't query results
      // Instead verify the proposal count is zero by checking a proposal that doesn't exist reverts
      await expect(voting.getResults(999)).to.be.revertedWith("Invalid proposal");
    });
  });

  describe("Identity Registration", function () {
    it("Should register a new identity", async function () {
      const proof = ethers.toUtf8Bytes("valid-proof");
      const tx = await voting.registerIdentity(
        NULLIFIER1, COMMITMENT1, 1, 1, proof
      );
      await tx.wait();

      const identity = await voting.identities(COMMITMENT1);
      expect(identity.registered).to.be.true;
      expect(identity.municipalityCode).to.equal(1);
    });

    it("Should reject duplicate identity registration", async function () {
      const proof = ethers.toUtf8Bytes("valid-proof");
      await voting.registerIdentity(NULLIFIER1, COMMITMENT1, 1, 1, proof);

      await expect(
        voting.registerIdentity(NULLIFIER1, COMMITMENT1, 1, 1, proof)
      ).to.be.revertedWith("Identity already exists");
    });
  });

  describe("Proposal Creation", function () {
    beforeEach(async () => {
      const proof = ethers.toUtf8Bytes("valid-proof");
      await voting.connect(validator).registerIdentity(
        NULLIFIER1, COMMITMENT1, 1, 1, proof
      );
    });

    it("Should create a new proposal", async function () {
      const tx = await voting.connect(admin).createProposal(
        "QmTest123",
        0, // Municipal scope
        0, // Law category
        1, // Target zone
        1000, // Voting duration in blocks
        ethers.ZeroHash // No merkle root
      );
      await tx.wait();

      const proposal = await voting.proposals(1);
      expect(proposal.ipfsHash).to.equal("QmTest123");
      expect(proposal.proposalType.scope).to.equal(0);
    });

    it("Should reject proposal creation from non-admin", async function () {
      await expect(
        voting.connect(user1).createProposal(
          "QmTest123", 0, 0, 1, 1000, ethers.ZeroHash
        )
      ).to.be.reverted;
    });
  });

  describe("Voting", function () {
    beforeEach(async () => {
      const proof = ethers.toUtf8Bytes("valid-proof");
      await voting.connect(validator).registerIdentity(
        NULLIFIER1, COMMITMENT1, 1, 1, proof
      );
      await voting.connect(validator).registerIdentity(
        NULLIFIER2, COMMITMENT2, 1, 1, proof
      );

      await voting.connect(admin).createProposal(
        "QmTest123", 0, 0, 1, 10000, ethers.ZeroHash
      );
    });

    it("Should allow registered identity to vote YES", async function () {
      const voteProof = ethers.toUtf8Bytes("vote-proof");
      const tx = await voting.connect(user1).castVote(
        1, COMMITMENT1, 1, NULLIFIER1, voteProof, []
      );
      await tx.wait();

      const results = await voting.getResults(1);
      expect(results.yesVotes).to.equal(1);
      expect(results.totalVotes).to.equal(1);
    });

    it("Should prevent double voting", async function () {
      const voteProof = ethers.toUtf8Bytes("vote-proof");
      await voting.connect(user1).castVote(
        1, COMMITMENT1, 1, NULLIFIER1, voteProof, []
      );

      // Try voting again with same nullifier
      await expect(
        voting.connect(user1).castVote(
          1, COMMITMENT1, 2, NULLIFIER1, voteProof, []
        )
      ).to.be.revertedWith("Already voted");
    });

    it("Should allow different identities to vote", async function () {
      const voteProof = ethers.toUtf8Bytes("vote-proof");

      await voting.connect(user1).castVote(
        1, COMMITMENT1, 1, NULLIFIER1, voteProof, []
      );
      await voting.connect(user2).castVote(
        1, COMMITMENT2, 2, NULLIFIER2, voteProof, []
      );

      const results = await voting.getResults(1);
      expect(results.yesVotes).to.equal(1);
      expect(results.noVotes).to.equal(1);
      expect(results.totalVotes).to.equal(2);
    });
  });

  describe("Results & Finalization", function () {
    beforeEach(async () => {
      const proof = ethers.toUtf8Bytes("valid-proof");
      await voting.connect(validator).registerIdentity(
        NULLIFIER1, COMMITMENT1, 1, 1, proof
      );

      await voting.connect(admin).createProposal(
        "QmTest123", 0, 0, 1, 10, ethers.ZeroHash
      );

      const voteProof = ethers.toUtf8Bytes("vote-proof");
      await voting.connect(user1).castVote(
        1, COMMITMENT1, 1, NULLIFIER1, voteProof, []
      );
    });

    it("Should return correct results", async function () {
      const results = await voting.getResults(1);
      expect(results.yesVotes).to.equal(1);
      expect(results.noVotes).to.equal(0);
      expect(results.abstainVotes).to.equal(0);
      expect(results.totalVotes).to.equal(1);
    });

    it("Should finalize proposal after voting ends", async function () {
      // Mine blocks to end voting
      for (let i = 0; i < 15; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await voting.connect(admin).finalizeProposal(1);

      const results = await voting.getResults(1);
      expect(results.isActive).to.be.false;
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow admin to pause", async function () {
      await voting.pause();
      const proof = ethers.toUtf8Bytes("valid-proof");
      await expect(
        voting.registerIdentity(NULLIFIER1, COMMITMENT1, 1, 1, proof)
      ).to.be.revertedWithCustomError(voting, "EnforcedPause");
    });

    it("Should allow admin to unpause", async function () {
      await voting.pause();
      await voting.unpause();
      const proof = ethers.toUtf8Bytes("valid-proof");
      await voting.registerIdentity(NULLIFIER1, COMMITMENT1, 1, 1, proof);
      const identity = await voting.identities(COMMITMENT1);
      expect(identity.registered).to.be.true;
    });
  });
});
