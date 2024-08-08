const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { bigint } = require("hardhat/internal/core/params/argumentTypes");
const { ethers } = require("hardhat");

describe("UNISWAP_Test1", function () {
  async function deployContractsFixture() {
    const [deployer, otherAccount1, otherAccount2, otherAccount3] =
      await ethers.getSigners();

    const TokenA = await ethers.getContractFactory("TokenA");
    const tokenA = await TokenA.deploy();

    const TokenB = await ethers.getContractFactory("TokenB");
    const tokenB = await TokenB.deploy();

    const CPMM = await ethers.getContractFactory("CPMM");
    const cpmm = await CPMM.deploy(tokenA, tokenB);

    return {
      deployer,
      otherAccount1,
      otherAccount2,
      otherAccount3,
      tokenA,
      tokenB,
      cpmm,
    };
  }

  describe("Deployment", function () {
    it("Should set contract CPMM", async function () {
      const { tokenA, tokenB, cpmm } = await loadFixture(
        deployContractsFixture
      );
      console.log("Contract tokenA Address:", tokenA.target);
      console.log("Contract tokenB Address:", tokenB.target);
      console.log("Contract cpmm Address:", cpmm.target);

      expect(cpmm.target).to.not.be.null;
    });
  });

  describe("Scenario1", function () {
    it("Problem Solving", async function () {
      const {
        otherAccount1,
        otherAccount2,
        otherAccount3,
        tokenA,
        tokenB,
        cpmm,
      } = await loadFixture(deployContractsFixture);

      await tokenA.mint(500000);
      await tokenB.mint(2500000);
      await tokenA.connect(otherAccount1).mint(50000);
      await tokenB.connect(otherAccount1).mint(250000);
      await tokenA.connect(otherAccount2).mint(20000);
      await tokenB.connect(otherAccount2).mint(100000);
      await tokenA.connect(otherAccount3).mint(200000);

      await tokenA.approve(cpmm.target, 500000);
      await tokenB.approve(cpmm.target, 2500000);
      await tokenA.connect(otherAccount1).approve(cpmm.target, 50000);
      await tokenB.connect(otherAccount1).approve(cpmm.target, 250000);
      await tokenA.connect(otherAccount2).approve(cpmm.target, 20000);
      await tokenB.connect(otherAccount2).approve(cpmm.target, 100000);
      await tokenA.connect(otherAccount3).approve(cpmm.target, 200000);

      await cpmm.addLiquidity(tokenA.target, 500000);

      // 첫번째 문제
      expect(
        await cpmm
          .connect(otherAccount1)
          .calculateAddLiquidity(tokenA.target, 50000)
      ).to.deep.equal([250000, 50000]);

      await cpmm.connect(otherAccount1).addLiquidity(tokenA.target, 50000);

      // 두번째 문제
      expect(
        await cpmm
          .connect(otherAccount2)
          .calculateAddLiquidity(tokenB.target, 100000)
      ).to.deep.equal([20000, 20000]);

      await cpmm.connect(otherAccount2).addLiquidity(tokenB.target, 100000);

      //세번째 문제
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await cpmm.connect(otherAccount3).swap(tokenA.target, 25000);
      await expect(cpmm.connect(otherAccount3).swap(tokenA.target, 25000)).to.be
        .reverted;
    });
  });
});
