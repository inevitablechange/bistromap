import { ZeroAddress } from "ethers";

import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("UNISWAP_Test1", function () {
  async function deployContractsFixture() {
    //automine - true 로 변경 후 실행
    await network.provider.send("evm_setAutomine", [true]);

    const [
      deployer,
      otherAccount1,
      otherAccount2,
      otherAccount3,
      otherAccount4,
    ] = await ethers.getSigners();

    const BSM = await ethers.getContractFactory("BSM");
    const bsm = await BSM.deploy();

    const USDT = await ethers.getContractFactory("USDT");
    const usdt = await USDT.deploy();

    const UniswapFactory = await ethers.getContractFactory("UniswapV2Factory");
    const uniswapFactory = await UniswapFactory.deploy(ZeroAddress);

    const UniswapPair = await ethers.getContractFactory("UniswapV2Pair");
    const uniswapPair = await UniswapPair.deploy();

    const UniswapRouter = await ethers.getContractFactory("UniswapV2Router");
    const uniswapRouter = await UniswapRouter.deploy(
      uniswapFactory.target,
      bsm.target
    );

    console.log(
      "Factory Init Code: ",
      await uniswapFactory.INIT_CODE_PAIR_HASH()
    );

    return {
      deployer,
      otherAccount1,
      otherAccount2,
      otherAccount3,
      otherAccount4,
      bsm,
      usdt,
      uniswapFactory,
      uniswapPair,
      uniswapRouter,
    };
  }

  describe("Deployment", function () {
    it("Should set contracts", async function () {
      const { bsm, usdt, uniswapFactory, uniswapPair, uniswapRouter } =
        await loadFixture(deployContractsFixture);

      console.log("Contract BSM Address: ", bsm.target);
      console.log("Contract USDT Address: ", usdt.target);
      console.log("Contract UniswapFactory Address: ", uniswapFactory.target);
      console.log("Contract UniswapPair Address: ", uniswapPair.target);
      console.log("Contract UniswapRouter Address: ", uniswapRouter.target);
    });
  });

  describe("Liquidity Pool (", function () {
    it("Provide Liquidity (BSM - USDT)", async function () {
      const {
        deployer,
        bsm,
        usdt,
        uniswapFactory,
        uniswapPair,
        uniswapRouter,
      } = await loadFixture(deployContractsFixture);

      const bsmAmount: bigint = ethers.parseUnits("420", 18);
      const usdtAmount: bigint = ethers.parseUnits("4200", 18);
      const deadline = (await time.latest()) + 15;

      await bsm.mint(deployer.address, bsmAmount);
      await usdt.mint(deployer.address, usdtAmount);

      await uniswapFactory.createPair(bsm.target, usdt.target);

      await bsm.approve(uniswapRouter.target, bsmAmount);
      await usdt.approve(uniswapRouter.target, usdtAmount);

      await uniswapRouter.addLiquidity(
        bsm.target,
        usdt.target,
        bsmAmount,
        usdtAmount,
        0,
        0,
        deployer,
        deadline
      );

      const pairAddress = await uniswapFactory.getPair(bsm.target, usdt.target);

      //uniswapPair 컨트랙트에 BSM-USDT 풀 주소 연결 후 잔고 확인
      const [reserve0, reserve1, blockTimestampLast] = await uniswapPair
        .attach(pairAddress)
        .getReserves();

      expect([reserve0, reserve1, blockTimestampLast]).to.deep.equal([
        bsmAmount,
        usdtAmount,
        blockTimestampLast,
      ]);
    });
  });
});
