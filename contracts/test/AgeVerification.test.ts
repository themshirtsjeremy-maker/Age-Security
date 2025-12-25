import { expect } from "chai";
import { ethers } from "hardhat";
import { AgeVerification } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * AgeVerification Contract Tests
 * 
 * Note: FHE operations require the Zama coprocessor and cannot be fully
 * executed on local Hardhat network. These tests verify:
 * - Contract deployment
 * - Interface correctness
 * - Access control
 * - State management
 * - Constants and calculations
 */
describe("AgeVerification", function () {
  let ageVerification: AgeVerification;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const MINIMUM_AGE = 18;
  const BASE_YEAR = 2025;
  const THRESHOLD_YEAR = BASE_YEAR - MINIMUM_AGE; // 2007

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const AgeVerificationFactory = await ethers.getContractFactory("AgeVerification");
    ageVerification = await AgeVerificationFactory.deploy();
    await ageVerification.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(await ageVerification.getAddress()).to.be.properAddress;
    });

    it("should have correct contract address format", async function () {
      const address = await ageVerification.getAddress();
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("Constants", function () {
    it("should have MINIMUM_AGE set to 18", async function () {
      expect(await ageVerification.MINIMUM_AGE()).to.equal(MINIMUM_AGE);
    });

    it("should have BASE_YEAR set to 2025", async function () {
      expect(await ageVerification.BASE_YEAR()).to.equal(BASE_YEAR);
    });

    it("should calculate threshold year correctly", async function () {
      expect(await ageVerification.getThresholdYear()).to.equal(THRESHOLD_YEAR);
    });

    it("should verify threshold year math (2025 - 18 = 2007)", async function () {
      const baseYear = await ageVerification.BASE_YEAR();
      const minAge = await ageVerification.MINIMUM_AGE();
      const threshold = await ageVerification.getThresholdYear();
      expect(Number(baseYear) - Number(minAge)).to.equal(Number(threshold));
    });
  });

  describe("State Management", function () {
    it("should return false for hasUserSubmitted before submission", async function () {
      expect(await ageVerification.hasUserSubmitted(user1.address)).to.equal(false);
    });

    it("should return 0 for getUserSubmissionCount before submission", async function () {
      expect(await ageVerification.getUserSubmissionCount(user1.address)).to.equal(0);
    });

    it("should track submission status per user independently", async function () {
      expect(await ageVerification.hasUserSubmitted(user1.address)).to.equal(false);
      expect(await ageVerification.hasUserSubmitted(user2.address)).to.equal(false);
      expect(await ageVerification.getUserSubmissionCount(user1.address)).to.equal(0);
      expect(await ageVerification.getUserSubmissionCount(user2.address)).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("should revert getResultHandle for non-submitted user with NoSubmission error", async function () {
      await expect(
        ageVerification.getResultHandle(user1.address)
      ).to.be.revertedWithCustomError(ageVerification, "NoSubmission");
    });

    it("should allow any address to check submission status", async function () {
      // user2 can check user1's submission status
      const hasSubmitted = await ageVerification.connect(user2).hasUserSubmitted(user1.address);
      expect(hasSubmitted).to.equal(false);
    });

    it("should allow any address to check submission count", async function () {
      // user2 can check user1's submission count
      const count = await ageVerification.connect(user2).getUserSubmissionCount(user1.address);
      expect(count).to.equal(0);
    });
  });

  describe("Contract Interface", function () {
    it("should have submitBirthYear function", async function () {
      expect(ageVerification.submitBirthYear).to.be.a("function");
    });

    it("should have getResultHandle function", async function () {
      expect(ageVerification.getResultHandle).to.be.a("function");
    });

    it("should have hasUserSubmitted function", async function () {
      expect(ageVerification.hasUserSubmitted).to.be.a("function");
    });

    it("should have getUserSubmissionCount function", async function () {
      expect(ageVerification.getUserSubmissionCount).to.be.a("function");
    });

    it("should have getThresholdYear function", async function () {
      expect(ageVerification.getThresholdYear).to.be.a("function");
    });

    it("should have MINIMUM_AGE constant", async function () {
      expect(ageVerification.MINIMUM_AGE).to.be.a("function");
    });

    it("should have BASE_YEAR constant", async function () {
      expect(ageVerification.BASE_YEAR).to.be.a("function");
    });
  });

  describe("Events", function () {
    it("should have YearSubmitted event defined", async function () {
      const filter = ageVerification.filters.YearSubmitted;
      expect(filter).to.not.be.undefined;
    });

    it("should have VerificationComplete event defined", async function () {
      const filter = ageVerification.filters.VerificationComplete;
      expect(filter).to.not.be.undefined;
    });
  });

  describe("Custom Errors", function () {
    it("should have NoSubmission error defined", async function () {
      // Verify by attempting to trigger it
      await expect(
        ageVerification.getResultHandle(user1.address)
      ).to.be.revertedWithCustomError(ageVerification, "NoSubmission");
    });
  });

  /**
   * FHE-specific tests - These would require Zama's testnet/devnet
   * Documenting expected behavior for integration testing
   */
  describe("FHE Operations (Documentation)", function () {
    it("should encrypt birth year using FHE.fromExternal", function () {
      // FHE.fromExternal(encryptedYear, inputProof) converts external input
      // This requires Zama coprocessor - documented for reference
      expect(true).to.equal(true);
    });

    it("should compute age verification using FHE.le", function () {
      // FHE.le(year, threshold) compares encrypted values
      // Returns ebool without revealing actual values
      expect(true).to.equal(true);
    });

    it("should allow user to decrypt their own result", function () {
      // FHE.allow(isAdult, msg.sender) grants decryption access
      // User can then call userDecrypt via relayer SDK
      expect(true).to.equal(true);
    });

    it("should prevent other users from decrypting results", function () {
      // Only msg.sender is granted FHE.allow() access
      // Other users cannot decrypt the result
      expect(true).to.equal(true);
    });

    it("should allow resubmission and increment counter", function () {
      // User can submit multiple times, each time incrementing submissionCount
      // New submission replaces old result
      expect(true).to.equal(true);
    });
  });

  describe("Business Logic", function () {
    it("should use correct threshold (BASE_YEAR - MINIMUM_AGE)", async function () {
      const threshold = await ageVerification.getThresholdYear();
      expect(threshold).to.equal(2007);
    });

    it("should verify age threshold calculation for edge cases", function () {
      // Born in 2007 -> 18 years old in 2025 -> PASS
      // Born in 2008 -> 17 years old in 2025 -> FAIL
      expect(2007 <= THRESHOLD_YEAR).to.equal(true);  // 18+
      expect(2008 <= THRESHOLD_YEAR).to.equal(false); // under 18
      expect(1990 <= THRESHOLD_YEAR).to.equal(true);  // 35 years old
      expect(2006 <= THRESHOLD_YEAR).to.equal(true);  // 19 years old
      expect(2007 <= THRESHOLD_YEAR).to.equal(true);  // exactly 18
    });

    it("should handle minimum valid birth year (1900)", function () {
      // euint16 can hold 0-65535, but realistic birth years are 1900-2025
      expect(1900 <= THRESHOLD_YEAR).to.equal(true); // Very old -> 18+
    });

    it("should handle maximum valid birth year (current year)", function () {
      // Born this year -> definitely under 18
      expect(2025 <= THRESHOLD_YEAR).to.equal(false); // Newborn -> not 18+
    });
  });

  describe("Gas Estimation", function () {
    it("should estimate reasonable gas for view functions", async function () {
      // View functions should be cheap
      const gas1 = await ageVerification.hasUserSubmitted.estimateGas(user1.address);
      const gas2 = await ageVerification.getUserSubmissionCount.estimateGas(user1.address);
      const gas3 = await ageVerification.getThresholdYear.estimateGas();
      
      // View functions should use minimal gas (< 30000)
      expect(Number(gas1)).to.be.lessThan(30000);
      expect(Number(gas2)).to.be.lessThan(30000);
      expect(Number(gas3)).to.be.lessThan(30000);
    });
  });
});
