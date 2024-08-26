import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { BSM, Reward, DateChecker, StakingContract } from "../typechain-types";

import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Reward Contract", function () {
  let rewardContract: Reward;
  let bsmToken: BSM;
  let stakingContract: StakingContract;
  let dateChecker: DateChecker;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const BSM_DECIMALS = ethers.parseEther("1");
  const VOTE_COST = BSM_DECIMALS * BigInt(3);

  before(async function () {
    // Deploy contracts and set up test addresses
    [owner, user1, user2, user3] = await ethers.getSigners();

    const BSMToken = await ethers.getContractFactory("BSM");
    bsmToken = await BSMToken.deploy();
    await bsmToken.deployed();

    const DateChecker = await ethers.getContractFactory("DateChecker");
    dateChecker = await DateChecker.deploy();
    await dateChecker.deployed();

    const StakingContract = await ethers.getContractFactory("Staking");
    stakingContract = await StakingContract.deploy();
    await stakingContract.deployed();

    const RewardContract = await ethers.getContractFactory("Reward");
    rewardContract = await RewardContract.deploy(
      bsmToken.address,
      stakingContract.address,
      dateChecker.address
    );
    await rewardContract.deployed();

    // Mint some BSM tokens to users for voting
    await bsmToken.mint(user1.address, ethers.parseEther("10000"));
    await bsmToken.mint(user2.address, ethers.parseEther("10000"));
    await bsmToken.mint(user3.address, ethers.parseEther("10000"));
  });

  describe("Publish Reviews", function () {
    it("Should allow users to publish reviews", async function () {
      await rewardContract
        .connect(user1)
        .publish("Title1", "Restaurant1", "Content1", 1234, 5678);
      await rewardContract
        .connect(user2)
        .publish("Title2", "Restaurant2", "Content2", 4321, 8765);

      const review1 = await rewardContract.getReview(1);
      expect(review1.title).to.equal("Title1");
      expect(review1.writer).to.equal(user1.address);

      const review2 = await rewardContract.getReview(2);
      expect(review2.title).to.equal("Title2");
      expect(review2.writer).to.equal(user2.address);
    });
  });

  describe("Vote for Reviews", function () {
    it("Should allow users to vote for reviews and transfer BSM", async function () {
      await bsmToken.connect(user3).approve(rewardContract.address, VOTE_COST);
      await rewardContract.connect(user3).vote(1); // User3 votes for User1's review

      const review1 = await rewardContract.getReview(1);
      expect(review1.votes).to.equal(1);

      const userBalance = await bsmToken.balanceOf(user3.address);
      const contractBalance = await bsmToken.balanceOf(rewardContract.address);
      expect(userBalance).to.equal(ethers.parseEther("9997")); // 3 BSM deducted
      expect(contractBalance).to.equal(VOTE_COST);
    });

    it("Should not allow the writer to vote for their own review", async function () {
      await expect(rewardContract.connect(user1).vote(1)).to.be.revertedWith(
        "Voter can't vote for her or his review."
      );
    });
  });

  describe("Reward Distribution", function () {
    it("Should distribute rewards after 4 weeks", async function () {
      // Fast forward time to 4 weeks later
      await time.increase(60 * 60 * 24 * 7 * 4); // 4 weeks in seconds

      await rewardContract.reward();

      // Reviewers haven't claimed their rewards yet, so nothing should be transferred
      const user1Balance = await bsmToken.balanceOf(user1.address);
      const contractBalance = await bsmToken.balanceOf(rewardContract.address);

      expect(user1Balance).to.equal(ethers.parseEther("10000")); // No mint yet
      expect(contractBalance).to.equal(VOTE_COST); // Still holds the vote BSM
    });

    it("Should allow reviewers to claim their rewards", async function () {
      // User1 claims the reward for Review 1
      await rewardContract.connect(user1).claimReward(1);
      const user1Balance = await bsmToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(ethers.parseEther("16000")); // 6000 BSM minted

      // User2 has no votes so shouldn't have rewards yet
      await expect(
        rewardContract.connect(user2).claimReward(2)
      ).to.be.revertedWith("Review does not qualify for reward");
    });
  });

  describe("Voter Reward Distribution", function () {
    it("Should allow voters to claim their rewards", async function () {
      const contractEthBalanceBefore = await ethers.provider.getBalance(
        rewardContract.address
      );
      expect(contractEthBalanceBefore).to.equal(0);

      // Send ETH to the contract to simulate accumulated vote funds
      await owner.sendTransaction({
        to: rewardContract.address,
        value: ethers.parseEther("1"), // 1 ETH sent for voter rewards
      });

      // User3 claims the voter reward
      const user3BalanceBefore = await ethers.provider.getBalance(
        user3.address
      );
      await rewardContract.connect(user3).claimVoterReward(1);
      const user3BalanceAfter = await ethers.provider.getBalance(user3.address);

      expect(user3BalanceAfter.sub(user3BalanceBefore)).to.be.gt(
        ethers.parseEther("0.99")
      ); // 1 ETH distributed
    });

    it("Should prevent users who didn’t vote from claiming voter rewards", async function () {
      await expect(
        rewardContract.connect(user2).claimVoterReward(1)
      ).to.be.revertedWith(
        "Only voters of the selected review can claim reward"
      );
    });
  });

  describe("Attendance", function () {
    it("Should allow users to mark attendance", async function () {
      await rewardContract.connect(user1).markAttendance();

      const attendance = await rewardContract.getUserAttendance();
      expect(attendance.dates.length).to.equal(1);
    });

    it("Should give attendance rewards", async function () {
      const user1BalanceBefore = await bsmToken.balanceOf(user1.address);

      // Fast forward time to the next day
      await time.increase(60 * 60 * 24);

      await rewardContract.connect(user1).markAttendance();

      const user1BalanceAfter = await bsmToken.balanceOf(user1.address);
      expect(user1BalanceAfter.sub(user1BalanceBefore)).to.equal(
        ethers.parseEther("0.1")
      ); // 0.1 BSM reward
    });
  });
});
