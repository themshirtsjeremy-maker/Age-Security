// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint16, ebool, externalEuint16 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AgeVerification
 * @notice FHE-based age verification: encrypts birth year, checks if user is 18+
 */
contract AgeVerification is ZamaEthereumConfig {
    // Encrypted birth years per user
    mapping(address => euint16) private birthYears;
    // Encrypted verification results per user
    mapping(address => ebool) private results;
    // Track if user has submitted
    mapping(address => bool) public hasSubmitted;
    
    event YearSubmitted(address indexed user);
    event VerificationComplete(address indexed user);
    
    /**
     * @notice Submit encrypted birth year and compute age verification
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
        
        // Age verification: birthYear <= (currentYear - 18)
        // 2025 - 18 = 2007, so birthYear <= 2007 means 18+
        euint16 threshold = FHE.asEuint16(2007);
        ebool isAdult = FHE.le(year, threshold);
        
        // Allow contract to use the result
        FHE.allowThis(isAdult);
        // Allow user to decrypt their own result
        FHE.allow(isAdult, msg.sender);
        
        results[msg.sender] = isAdult;
        hasSubmitted[msg.sender] = true;
        
        emit YearSubmitted(msg.sender);
        emit VerificationComplete(msg.sender);
    }
    
    /**
     * @notice Get the encrypted result handle for user decryption
     * @param user Address to get result for
     * @return bytes32 handle for the encrypted boolean result
     */
    function getResultHandle(address user) external view returns (bytes32) {
        require(hasSubmitted[user], "No submission");
        return FHE.toBytes32(results[user]);
    }
    
    /**
     * @notice Check if user has already submitted
     */
    function hasUserSubmitted(address user) external view returns (bool) {
        return hasSubmitted[user];
    }
}

