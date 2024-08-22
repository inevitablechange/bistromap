import { ZeroAddress } from "ethers";

import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

/* 
주의점 1)
유니스왑 Factory 컨트랙트 내 INIT_CODE_PAIR_HASH 트랜잭션에 따라 달라질 수 있다.
변경이 필요할 경우, INIT_CODE_PAIR_HASH값을 참고해서 UniswapV2Library.sol > pairFor함수 내 hex값을 변경해야 한다.

주의점 2)
uniswap router에 토큰 전송 권한을 넘겨줘야 Liquidity를 공급할 수 있다.

주의점 3)
BSM Token의 소유권을 PoolRewards Contract에 넘겨야 Reward를 제공할 때 mint()함수를 사용할 수 있게 된다.
*/

describe("UNISWAP_Test1", function () {
  async function deployContractsFixture() {
    //config.ts에 automine이 false로 설정돼있을 경우 -> automine - true 로 변경 후 실행
    // await ethers.provider.send("evm_setAutomine", [true]);

    const [
      deployer,
      otherAccount1,
      otherAccount2,
      otherAccount3,
      otherAccount4,
    ] = await ethers.getSigners();

    const BSM = await ethers.getContractFactory("BSM");
    const bsm = await BSM.deploy(await time.latest());

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

  describe("Liquidity Pool (BSM - USDT)", function () {
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
      const deadline = (await time.latest()) + 300;

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

      //deploy Liquidity Pool LP Tokens Staking Reward Contract
      const PoolRewards = await ethers.getContractFactory("PoolRewards");
      const poolRewards = await PoolRewards.deploy(
        pairAddress,
        bsm.target,
        BigInt(1000000000000000000)
      );
      await poolRewards.waitForDeployment();
      console.log("LP Tokens Staking Reward Address: ", poolRewards.target);

      //Approve LP tokens to Reward Contract

      await uniswapPair
        .attach(pairAddress)
        .approve(poolRewards.target, bsmAmount);

      //Give ownership of BSM token to Reward Contract (need to use mint function to give rewards)
      await bsm.transferOwnership(poolRewards.target);

      //Check balance of LP Tokens before Staking
      const deployerLpTokens_before = await uniswapPair
        .attach(pairAddress)
        .balanceOf(deployer);
      expect(deployerLpTokens_before).to.equal(1328156617270719318439n);

      //Stake 1/2 LP tokens(210000000000000000000) to Reward Contract
      await poolRewards.deposit(BigInt(210000000000000000000));

      //Check balance of LP Tokens after Staking
      const deployerLpTokens_after = await uniswapPair
        .attach(pairAddress)
        .balanceOf(deployer);
      expect(deployerLpTokens_after).to.equal(1118156617270719318439n);

      // 블록을 30개 생성 (시간 경과를 시뮬레이션)
      for (let i = 0; i < 30; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      //withdraw LP tokens from rewards pool after 30 blocks
      await poolRewards.withdraw();

      const deployerLpTokens = await uniswapPair
        .attach(pairAddress)
        .balanceOf(deployer);
      expect(deployerLpTokens).to.equal(1328156617270719318439n);

      // approve LP tokens to Uniswap Router contract
      await uniswapPair
        .attach(pairAddress)
        .approve(uniswapRouter.target, deployerLpTokens);

      // Withdraw Liquidity(BSM-USDT) from BSM-USDT pool contract
      //Check balance of LP Tokens removing LP tokens from Reward Contract
      const totalLpTokens = await uniswapPair.attach(pairAddress).totalSupply();

      expect(totalLpTokens).to.equal(1328156617270719319439n);

      await uniswapRouter.removeLiquidity(
        bsm.target,
        usdt.target,
        deployerLpTokens,
        0,
        0,
        deployer,
        deadline
      );

      //check the balance of bsm token (블록당 Reward - 1BSM으로 총 10BSM 증가해야 함)
      const bsmTokenAmount = await bsm.balanceOf(deployer);
      expect(bsmTokenAmount).to.equal(450999999999999999683n);
    });
  });
});
