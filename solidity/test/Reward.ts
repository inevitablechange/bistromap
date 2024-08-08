import dotenv from "dotenv";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BSM, Reward } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

dotenv.config();
describe("BSM and Reward Contracts", async function () {
  let bsmToken: BSM;
  let rewardContract: Reward;
  let usdtToken: any;

  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  before(async function () {
    signers = await ethers.getSigners();
    [owner, addr1, addr2, addr3] = signers;
    // usdtToken = await ethers.getContractAt("IERC20", process.env.USDT_ADDRESS!);
    // // Deploy BSM token
    const BSM = await ethers.getContractFactory("BSM");
    bsmToken = await BSM.deploy(Math.floor(Date.now() / 1000)); // bistro
    // // // Set USDT token address in BSM contract
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdtToken = await MockERC20.deploy(
      // usdt contract 배포
      "Mock USDT",
      "USDT",
      18,
      ethers.parseEther("1000000")
    );

    await bsmToken.setUSDTToken(usdtToken.target);
    // // // Deploy Reward contract
    const Reward = await ethers.getContractFactory("Reward");
    rewardContract = await Reward.deploy(bsmToken.target);
    // // // Mint BSM tokens to owner for testing
    await bsmToken.mint(owner.address, ethers.parseEther("100000"));
  });

  it("Should allow private sale purchases", async function () {
    await usdtToken.transfer(addr1.address, ethers.parseUnits("1000", 6));
    await usdtToken
      .connect(addr1)
      .approve(bsmToken.target, ethers.parseUnits("1000", 6));

    await bsmToken.connect(addr1).buyPrivateSale(BigInt(100 * 10 ** 18));
    const balance = await bsmToken.getBalance(addr1.address);
    console.log({ balance });
    expect(balance).to.equal(BigInt(100 * 10 ** 18));
  });

  it("Should set the right review number increment", async function () {
    const reviewNumbers = await rewardContract.reviewNumbers();
    expect(reviewNumbers).to.equal(0);
  });
  it("Should set the right review number increment", async function () {
    await rewardContract.connect(addr1).publish("Restaurant 1", 123, 456);
    await rewardContract.connect(addr2).publish("Restaurant 2", 789, 1011);

    const reviewNumbers = await rewardContract.reviewNumbers();
    expect(reviewNumbers).to.equal(2);
  });

  it("Reviewer cannot vote for their own review", async function () {
    await rewardContract.connect(addr1).publish("Restaurant 1", 123, 456);
    await expect(rewardContract.connect(addr1).vote(1)).to.be.reverted;
  });

  it("Votes get increased when voted", async function () {
    await rewardContract.connect(addr1).publish("Restaurant 1", 123, 456);
    await bsmToken.transfer(addr3.address, ethers.parseEther("1003"));
    await bsmToken
      .connect(addr3)
      .approve(rewardContract.target, ethers.parseEther("1003"));

    await rewardContract.connect(addr3).vote(1);
    const review = await rewardContract.reviews(1);
    expect(review.votes).to.equal(1);
  });

  // staking 시 (1003 이상) 에만 vote 가능 추가

  it("Top reviews must satisfy their conditions", async function () {
    await bsmToken.transfer(addr3.address, ethers.parseEther("1012"));

    await rewardContract.connect(addr1).publish("Restaurant 1", 123, 456);
    await rewardContract.connect(addr2).publish("Restaurant 2", 789, 1011);
    await rewardContract.connect(addr2).publish("Restaurant 3", 729, 1511);
    await rewardContract.connect(addr2).publish("Restaurant 4", 719, 1311);
    const reviewNumbers = await rewardContract.reviewNumbers();
    console.log({ reviewNumbers });
    expect(reviewNumbers).to.equal(4);
    // await rewardContract.connect(addr3).vote(0);
    // await rewardContract.connect(addr3).vote(1);
    // await rewardContract.connect(addr3).vote(1);
    // await rewardContract.connect(addr3).vote(1);
    // await time.increase(3600 * 24 * 7 * 4);
    // await rewardContract.reward();
    // await expect(rewardContract.reward()).to.be.revertedWith("No reviews");

    // const lastRewardAt = await rewardContract.lastRewardAt();
    // expect(lastRewardAt).to.be.closeTo(Math.floor(Date.now() / 1000), 60);
  });
  it("Reward function should be callable every 4 weeks", async function () {
    await time.increase(3600 * 24 * 7 * 4);
    await rewardContract.reward();
    const lastRewardAt = await rewardContract.lastRewardAt();
    expect(lastRewardAt).to.be.closeTo(Math.floor(Date.now() / 1000), 60);
  });

  // it("Mark attendance function should prevent double marking on the same day", async function () {
  //   await rewardContract.connect(addr1).markAttendance();
  //   console.log("attendance::", rewardContract.userAttendance(addr1.address));
  //   await expect(
  //     rewardContract.connect(addr1).markAttendance()
  //   ).to.be.revertedWith("Today's attendance checked");
  // });
});
