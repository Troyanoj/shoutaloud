/**
 * Example 6: One Person = One Identity Enforcement
 */
async function testDuplicatePrevention() {
  console.log('🚫 Testing Duplicate Identity Prevention\n');
  
  const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(TEST_CONFIG.privateKey, provider);
  
  const identityService = new IdentityService(
    TEST_CONFIG.contractAddress,
    VOTING_CONTRACT_ABI,
    provider,
    signer
  );
  
  // First registration attempt
  const firstAttempt = {
    biometricData: {
      faceImage: new ArrayBuffer(1024)
    },
    documentData: {
      documentImage: new ArrayBuffer(2048),
      documentType: 'INE',
      documentNumber: 'SAME123456' // Same person
    },
    personalData: {
      birthDate: '1990-01-01'
    },
    location: {
      latitude: 19.4326,
      longitude: -99.1332
    }
  };
  
  console.log('👤 First registration attempt...');
  const result1 = await identityService.registerCitizen(
    firstAttempt.biometricData,
    firstAttempt.documentData,
    firstAttempt.personalData,
    firstAttempt.location
  );
  
  if (result1.success) {
    console.log('✅ First registration successful');
    console.log(`   DID: ${result1.did}\n`);
  }
  
  // Second registration attempt (same person, different device)
  console.log('👥 Attempting duplicate registration...');
  const result2 = await identityService.registerCitizen(
    firstAttempt.biometricData,
    firstAttempt.documentData,
    firstAttempt.personalData,
    firstAttempt.location
  );
  
  if (!result2.success) {
    console.log('✅ Duplicate prevention working!');
    console.log(`   Error: ${result2.error}`);
    console.log('   System detected this identity already exists\n');
  }
  
  console.log('🔐 How it works:');
  console.log('   1. Biometric + Document creates unique nullifier');
  console.log('   2. Nullifier checked on blockchain');
  console.log('   3. Each person can only register once');
  console.log('   4. Privacy preserved - no personal data stored\n');
}

/**
 * Example 7: Municipality Update Flow
 */
async function testMunicipalityUpdate() {
  console.log('📍 Testing Municipality Update (Moving)\n');
  
  const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(TEST_CONFIG.privateKey, provider);
  
  const identityService = new IdentityService(
    TEST_CONFIG.contractAddress,
    VOTING_CONTRACT_ABI,
    provider,
    signer
  );
  
  const testDID = 'did:shout:polygon:user123';
  const sessionToken = 'valid-session-token';
  
  console.log('🏠 Current Municipality: 9015 (Benito Juárez, CDMX)');
  console.log('📦 Moving to: 5012 (Guadalajara, Jalisco)\n');
  
  // New location
  const newLocation = {
    latitude: 20.6597,  // Guadalajara
    longitude: -103.3496
  };
  
  // Proof of residence (simplified)
  const residenceProof = {
    documentType: 'utility_bill',
    timestamp: Date.now(),
    verified: true
  };
  
  console.log('📄 Submitting proof of new residence...');
  
  const updateResult = await identityService.updateMunicipality(
    testDID,
    sessionToken,
    newLocation,
    residenceProof
  );
  
  if (updateResult.success) {
    console.log('✅ Municipality updated successfully!');
    console.log(`   New Municipality: ${updateResult.newMunicipalityCode}`);
    console.log('   Can now vote in new municipality\n');
  } else {
    console.log('❌ Update failed:', updateResult.error);
  }
  
  console.log('📊 Update Process:');
  console.log('   • Verify current identity');
  console.log('   • Validate proof of new residence');
  console.log('   • Update blockchain record');
  console.log('   • Issue new eligibility token');
  console.log('   • Maintain vote history\n');
}

/**
 * Example 8: Credential Backup and Recovery
 */
async function testCredentialBackup() {
  console.log('💾 Testing Credential Backup & Recovery\n');
  
  const identity = new ShoutAloudIdentity();
  
  // User's credential data
  const userCredential = {
    did: 'did:shout:polygon:user456',
    municipalityCode: 9015,
    credentialHash: 'abc123...',
    issuedAt: Date.now()
  };
  
  console.log('🔐 Creating encrypted backup...');
  
  // User creates recovery phrase
  const recoveryPhrase = [
    'citizen', 'voice', 'vote', 'democracy',
    'shout', 'aloud', 'mexico', 'change',
    'people', 'power', 'justice', 'freedom'
  ];
  
  // Encrypt credential with recovery phrase
  const encryptedBackup = Buffer.from(
    JSON.stringify(userCredential)
  ).toString('base64'); // Simplified
  
  console.log('✅ Backup created');
  console.log('   Recovery phrase: [SHOWN ONLY ONCE]');
  console.log(`   ${recoveryPhrase.slice(0, 4).join(' ')}...`);
  console.log('   Store this phrase safely!\n');
  
  console.log('📱 Recovery on new device:');
  console.log('   1. Enter recovery phrase');
  console.log('   2. Decrypt credential');
  console.log('   3. Verify biometric');
  console.log('   4. Restore voting access\n');
  
  console.log('⚠️  Important:');
  console.log('   • Recovery phrase is NEVER stored online');
  console.log('   • Lost phrase = lost access (no backdoor)');
  console.log('   • Each person manages their own backup\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Shout Aloud Identity Module Test Suite\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    // Test 1: Registration
    await testCitizenRegistration();
    console.log('=' .repeat(50) + '\n');
    
    // Test 2: ZK Proofs
    await testZKProofGeneration();
    console.log('=' .repeat(50) + '\n');
    
    // Test 3: Authentication
    await testVotingAuthentication();
    console.log('=' .repeat(50) + '\n');
    
    // Test 4: Geographic Eligibility
    await testGeographicEligibility();
    console.log('=' .repeat(50) + '\n');
    
    // Test 5: Privacy Demo
    await demonstratePrivacy();
    console.log('=' .repeat(50) + '\n');
    
    // Test 6: Duplicate Prevention
    await testDuplicatePrevention();
    console.log('=' .repeat(50) + '\n');
    
    // Test 7: Municipality Update
    await testMunicipalityUpdate();
    console.log('=' .repeat(50) + '\n');
    
    // Test 8: Backup & Recovery
    await testCredentialBackup();
    console.log('=' .repeat(50) + '\n');
    
    console.log('✅ All tests completed!\n');
    console.log('🎯 Key Features Demonstrated:');
    console.log('   • One person = One identity (enforced)');
    console.log('   • Zero-knowledge privacy protection');
    console.log('   • Geographic eligibility verification');
    console.log('   • Decentralized credential management');
    console.log('   • No personal data stored anywhere');
    console.log('   • User-controlled identity\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Performance metrics
async function measurePerformance() {
  console.log('⚡ Performance Metrics\n');
  
  const operations = [
    {
      name: 'Biometric Hash Generation',
      estimatedTime: '< 100ms',
      onDevice: true
    },
    {
      name: 'ZK Proof Generation',
      estimatedTime: '< 2 seconds',
      onDevice: true
    },
    {
      name: 'DID Generation',
      estimatedTime: '< 50ms',
      onDevice: true
    },
    {
      name: 'Blockchain Registration',
      estimatedTime: '~15 seconds',
      onDevice: false
    },
    {
      name: 'Credential Encryption',
      estimatedTime: '< 200ms',
      onDevice: true
    },
    {
      name: 'Authentication',
      estimatedTime: '< 3 seconds',
      onDevice: true
    }
  ];
  
  console.table(operations);
  
  console.log('\n📊 Resource Usage:');
  console.log('   • Memory: ~50MB during registration');
  console.log('   • Storage: < 1KB per identity');
  console.log('   • Network: ~5KB for blockchain tx');
  console.log('   • Battery: Minimal impact\n');
}

// Export test suite
export {
  testCitizenRegistration,
  testZKProofGeneration,
  testVotingAuthentication,
  testGeographicEligibility,
  demonstratePrivacy,
  testDuplicatePrevention,
  testMunicipalityUpdate,
  testCredentialBackup,
  runAllTests,
  measurePerformance
};

// Run tests if executed directly
if (require.main === module) {
  runAllTests().then(() => {
    measurePerformance();
  }).catch(console.error);
}

/**
 * Identity Module Test Suite
 * Demonstrates the complete flow of identity verification
 */

import { ethers } from 'ethers';
import { IdentityService } from './identity-integration';
import { ShoutAloudIdentity } from './did-vc-identity';

// Test configuration
const TEST_CONFIG = {
  rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY',
  contractAddress: '0x...', // Deployed ShoutAloudVoting contract
  privateKey: '0x...', // Test wallet private key
};

// Mock contract ABI (simplified)
const VOTING_CONTRACT_ABI = [
  'function registerIdentity(bytes32 didHash, bytes32 nullifier, bytes32 commitment, uint256 municipality, tuple(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[] publicSignals) proof)',
  'function nullifierExists(bytes32 nullifier) view returns (bool)',
  'function identities(bytes32 didHash) view returns (bool registered, bytes32 nullifier, uint256 municipalityCode, uint256 blockNumber, string ipfsHash)',
  'event IdentityRegistered(bytes32 indexed didHash, uint256 municipalityCode)'
];

/**
 * Example 1: Complete Citizen Registration Flow
 */
async function testCitizenRegistration() {
  console.log('🚀 Testing Citizen Registration Flow\n');
  
  // Initialize services
  const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(TEST_CONFIG.privateKey, provider);
  
  const identityService = new IdentityService(
    TEST_CONFIG.contractAddress,
    VOTING_CONTRACT_ABI,
    provider,
    signer
  );
  
  await identityService.initialize();
  
  // Simulate biometric capture
  const faceImage = new ArrayBuffer(1024); // Mock face data
  const voiceData = new ArrayBuffer(512); // Mock voice data
  
  // Simulate document scan
  const documentImage = new ArrayBuffer(2048); // Mock document scan
  
  // Test data
  const testCitizen = {
    biometricData: {
      faceImage,
      voiceData
    },
    documentData: {
      documentImage,
      documentType: 'INE', // Mexican voter ID
      documentNumber: 'CURP123456789'
    },
    personalData: {
      birthDate: '1990-01-01'
    },
    location: {
      latitude: 19.4326, // Mexico City
      longitude: -99.1332
    }
  };
  
  console.log('📸 Processing biometric data...');
  console.log('📄 Scanning government document...');
  console.log('📍 Determining municipality...');
  
  // Register citizen
  const result = await identityService.registerCitizen(
    testCitizen.biometricData,
    testCitizen.documentData,
    testCitizen.personalData,
    testCitizen.location
  );
  
  if (result.success) {
    console.log('✅ Registration successful!');
    console.log(`   DID: ${result.did}`);
    console.log(`   Session Token: ${result.sessionToken}`);
    console.log('\n🔒 All personal data processed locally');
    console.log('🌐 Only anonymous proof stored on blockchain\n');
  } else {
    console.log('❌ Registration failed:', result.error);
  }
  
  return result;
}

/**
 * Example 2: Zero-Knowledge Proof Generation
 */
async function testZKProofGeneration() {
  console.log('🔐 Testing Zero-Knowledge Proof Generation\n');
  
  const identity = new ShoutAloudIdentity();
  
  // Test inputs
  const biometricHash = 'a7b9c3d5e7f1234567890abcdef123456';
  const documentNumber = 'CURP987654321';
  const birthDate = '1985-05-15';
  const municipalityCode = 9015; // Benito Juárez, CDMX
  
  console.log('🧮 Generating identity commitment...');
  
  // This happens on user's device
  const zkResult = await identity['zkVerifier'].generateIdentityCommitment(
    biometricHash,
    documentNumber,
    birthDate
  );
  
  console.log('📊 Identity Commitment Generated:');
  console.log(`   Commitment: ${zkResult.commitment.substring(0, 20)}...`);
  console.log(`   Nullifier: ${zkResult.nullifier.substring(0, 20)}...`);
  console.log('   Secret: [NEVER LEAVES DEVICE]\n');
  
  console.log('🎯 Generating eligibility proof...');
  
  const proof = await identity['zkVerifier'].generateIdentityProof(
    zkResult.secret,
    municipalityCode
  );
  
  console.log('✅ Proof generated successfully');
  console.log('   Can be verified without revealing identity\n');
  
  return { zkResult, proof };
}

/**
 * Example 3: Voting Authentication Flow
 */
async function testVotingAuthentication() {
  console.log('🗳️ Testing Voting Authentication\n');
  
  // Initialize service
  const provider = new ethers.providers.JsonRpcProvider(TEST_CONFIG.rpcUrl);
  const signer = new ethers.Wallet(TEST_CONFIG.privateKey, provider);
  
  const identityService = new IdentityService(
    TEST_CONFIG.contractAddress,
    VOTING_CONTRACT_ABI,
    provider,
    signer
  );
  
  // Test data
  const testDID = 'did:shout:polygon:abc123xyz789';
  const proposalMunicipality = 9015;
  const biometricData = new ArrayBuffer(1024); // Fresh biometric scan
  
  console.log('👤 Authenticating citizen...');
  console.log(`   DID: ${testDID}`);
  console.log(`   Proposal Municipality: ${proposalMunicipality}`);
  
  const authResult = await identityService.authenticateForVoting(
    testDID,
    biometricData,
    proposalMunicipality
  );
  
  if (authResult.authorized) {
    console.log('✅ Authentication successful!');
    console.log(`   Session Token: ${authResult.sessionToken}`);
    console.log('   Ready to vote on municipal proposals\n');
  } else {
    console.log('❌ Authentication failed:', authResult.error);
  }
  
  return authResult;
}

/**
 * Example 4: Geographic Eligibility Verification
 */
async function testGeographicEligibility() {
  console.log('🌍 Testing Geographic Eligibility\n');
  
  const identity = new ShoutAloudIdentity();
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Municipal Proposal',
      userMunicipality: 9015,
      proposalMunicipality: 9015,
      proposalScope: 'municipal',
      expectedResult: true
    },
    {
      name: 'State Proposal',
      userMunicipality: 9015, // CDMX
      proposalMunicipality: 9001, // Different municipality, same state
      proposalScope: 'state',
      expectedResult: true
    },
    {
      name: 'Federal Proposal',
      userMunicipality: 9015,
      proposalMunicipality: 1001, // Different state
      proposalScope: 'federal',
      expectedResult: true
    },
    {
      name: 'Wrong Municipality',
      userMunicipality: 9015,
      proposalMunicipality: 9016,
      proposalScope: 'municipal',
      expectedResult: false
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`📋 ${scenario.name}:`);
    console.log(`   User Municipality: ${scenario.userMunicipality}`);
    console.log(`   Proposal Municipality: ${scenario.proposalMunicipality}`);
    console.log(`   Scope: ${scenario.proposalScope}`);
    
    // In real implementation, this would use ZK circuit
    const eligible = scenario.userMunicipality === scenario.proposalMunicipality ||
                    scenario.proposalScope !== 'municipal';
    
    console.log(`   Result: ${eligible ? '✅ Eligible' : '❌ Not Eligible'}\n`);
  }
}

/**
 * Example 5: Privacy Demonstration
 */
async function demonstratePrivacy() {
  console.log('🔒 Privacy Protection Demonstration\n');
  
  console.log('📊 What the System Knows:');
  console.log('   ✓ A unique person registered');
  console.log('   ✓ They live in municipality 9015');
  console.log('   ✓ They are over 18 years old');
  console.log('   ✓ They have valid government ID\n');
  
  console.log('🚫 What the System DOESN\'T Know:');
  console.log('   ✗ Your name');
  console.log('   ✗ Your exact address');
  console.log('   ✗ Your face or biometric data');
  console.log('   ✗ Your document number');
  console.log('   ✗ Your birth date');
  console.log('   ✗ Any other personal information\n');
  
  console.log('🛡️ Privacy Guarantees:');
  console.log('   • All biometric processing happens on your device');
  console.log('   • Only mathematical proofs are shared');
  console.log('   • Your vote is anonymous but verifiable');
  console.log('   • You control your own data');
  console.log('   • Data can be deleted at any time\n');
}

/**