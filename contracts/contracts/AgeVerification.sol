// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint16, ebool, externalEuint16 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AgeVerification
 * @notice FHE-based age verification: encrypts birth year, checks if user is 18+
 * @dev Uses Zama FHEVM for encrypted computation - birth year never revealed
 */
contract AgeVerification is ZamaEthereumConfig {
    // ============ Constants ============
    uint16 public constant MINIMUM_AGE = 18;
    uint16 public constant BASE_YEAR = 2025; // Current year for threshold calculation
    
    // ============ State ============
    // Encrypted birth years per user
    mapping(address => euint16) private birthYears;
    // Encrypted verification results per user  
    mapping(address => ebool) private results;
    // Track submission count per user
    mapping(address => uint256) public submissionCount;
    
    // ============ Events ============
    event YearSubmitted(address indexed user, uint256 submissionNumber);
    event VerificationComplete(address indexed user);
    
    // ============ Errors ============
    error NoSubmission();
    
    /**
     * @notice Submit encrypted birth year and compute age verification
     * @dev User can resubmit to update their verification (new submission replaces old)
     * @param encryptedYear Encrypted birth year (euint16)
     * @param inputProof Proof for the encrypted input
     */
    function submitBirthYear(
        externalEuint16 encryptedYear,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted input
        euint16 year = FHE.fromExternal(encryptedYear, inputProof);
        FHE.allowThis(year);
        birthYears[msg.sender] = year;
        
        // Age verification: birthYear <= (BASE_YEAR - MINIMUM_AGE)
        // e.g., 2025 - 18 = 2007, so birthYear <= 2007 means 18+
        uint16 thresholdYear = BASE_YEAR - MINIMUM_AGE;
        euint16 threshold = FHE.asEuint16(thresholdYear);
        ebool isAdult = FHE.le(year, threshold);
        
        // Allow contract to use the result
        FHE.allowThis(isAdult);
        // Allow user to decrypt their own result (private decryption)
        FHE.allow(isAdult, msg.sender);
        
        results[msg.sender] = isAdult;
        submissionCount[msg.sender]++;
        
        emit YearSubmitted(msg.sender, submissionCount[msg.sender]);
        emit VerificationComplete(msg.sender);
    }
    
    /**
     * @notice Get the encrypted result handle for user decryption
     * @param user Address to get result for
     * @return bytes32 handle for the encrypted boolean result
     */
    function getResultHandle(address user) external view returns (bytes32) {
        if (submissionCount[user] == 0) revert NoSubmission();
        return FHE.toBytes32(results[user]);
    }
    
    /**
     * @notice Check if user has already submitted
     * @param user Address to check
     * @return bool Whether user has submitted at least once
     */
    function hasUserSubmitted(address user) external view returns (bool) {
        return submissionCount[user] > 0;
    }
    
    /**
     * @notice Get user's submission count
     * @param user Address to check
     * @return uint256 Number of times user has submitted
     */
    function getUserSubmissionCount(address user) external view returns (uint256) {
        return submissionCount[user];
    }
    
    /**
     * @notice Get the current threshold year for age verification
     * @return uint16 The maximum birth year to be considered 18+
     */
    function getThresholdYear() external pure returns (uint16) {
        return BASE_YEAR - MINIMUM_AGE;
    }
}
