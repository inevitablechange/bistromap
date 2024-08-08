const { Web3 } = require("web3");
const { expect } = require("chai");

const web3 = new Web3("http://localhost:8545"); // Ethereum 테스트 네트워크 URL

const BSMTokenArtifact = require("../artifacts/contracts/ERC20.sol/BSM.json");
const StakingContractArtifact = require("../artifacts/contracts/Staking.sol/StakingContract.json");

let bsmToken, stakingContract;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  const [owner, ...users] = accounts;

  // BSMToken 배포
  const BSMToken = new web3.eth.Contract(BSMTokenArtifact.abi);
  bsmToken = await BSMToken.deploy({
    data: BSMTokenArtifact.bytecode,
    arguments: [web3.utils.toWei("2100000", "ether")], // 초기 공급량
  }).send({ from: owner, gas: "5000000" });

  // StakingContract 배포
  const StakingContract = new web3.eth.Contract(StakingContractArtifact.abi);
  stakingContract = await StakingContract.deploy({
    data: StakingContractArtifact.bytecode,
    arguments: [bsmToken.options.address],
  }).send({ from: owner, gas: "5000000" });

  // BSMToken의 소유권을 StakingContract로 이전
  await bsmToken.methods
    .transferOwnership(stakingContract.options.address)
    .send({ from: owner });

  // 각 사용자에게 BSMToken 전송
  const amountToMint = web3.utils.toWei("10000", "ether"); // 각 사용자에게 10000 BSM
  for (const user of users.slice(0, 10)) {
    // 10명의 사용자
    await bsmToken.methods.mint(user, amountToMint).send({ from: owner });
  }
});

it("should allow users to stake random amounts, wait 25 weeks, and then unstake and claim rewards", async () => {
  const users = accounts.slice(1, 11); // 10명의 사용자
  const amountToStake = web3.utils.toWei("1000", "ether");

  // 각 사용자가 BSMToken을 스테이킹
  for (const user of users) {
    await bsmToken.methods
      .approve(stakingContract.options.address, amountToStake)
      .send({ from: user });
    await stakingContract.methods.stake(amountToStake).send({ from: user });
  }

  // 충분한 스테이킹 기간이 지나도록 설정 (예: 25주)
  const weeks = BigInt(25);
  const seconds = weeks * BigInt(7 * 24 * 60 * 60);

  // 시간 증가
  await web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_increaseTime",
    params: [Number(seconds)],
    id: new Date().getTime(),
  });

  // 블록 생성
  await web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_mine",
    params: [],
    id: new Date().getTime(),
  });

  // 스테이킹 후 보상 클레임
  let totalClaimedReward = BigInt(0);
  for (const user of users) {
    try {
      // 보상 상태 확인
      const claimableReward = await stakingContract.methods
        .calculateReward(user)
        .call();

      // undefined 체크
      if (claimableReward === undefined) {
        console.error(`Claimable reward for ${user} is undefined`);
        continue;
      }

      const claimableRewardBigInt = BigInt(claimableReward);
      console.log(
        `Claimable reward for ${user}: ${web3.utils.fromWei(
          claimableRewardBigInt.toString(),
          "ether"
        )}`
      );

      if (claimableRewardBigInt > BigInt(0)) {
        await stakingContract.methods.claim().send({ from: user });
        const userBalance = BigInt(
          await bsmToken.methods.balanceOf(user).call()
        );
        const claimedReward = userBalance - BigInt(amountToStake);
        console.log(
          `Claimed reward for ${user}: ${web3.utils.fromWei(
            claimedReward.toString(),
            "ether"
          )}`
        );
        totalClaimedReward += claimedReward;
      }
    } catch (error) {
      console.error(`Failed to claim reward for ${user}:`, error.message);
    }
  }

  // 총 스테이킹 금액 및 보상 계산
  const totalStakedAmount = BigInt(amountToStake) * BigInt(users.length);
  const expectedAPY = BigInt(12); // 연간 보상 비율 12%
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  const expectedTotalReward =
    (totalStakedAmount * expectedAPY * BigInt(seconds)) /
    (secondsPerYear * BigInt(100));

  console.log(
    "Total Claimed Reward:",
    web3.utils.fromWei(totalClaimedReward.toString(), "ether")
  );
  console.log(
    "Expected Total Reward:",
    web3.utils.fromWei(expectedTotalReward.toString(), "ether")
  );

  // 예상 보상과 실제 보상을 비교 (오차 범위 조정)
  const tolerance = BigInt(web3.utils.toWei("0.1", "ether")); // 0.1 ETH 오차 허용
  const lowerBound = expectedTotalReward - tolerance;
  const upperBound = expectedTotalReward + tolerance;

  // 비교를 위한 변환
  const totalClaimedRewardNumber = Number(totalClaimedReward.toString());
  expect(totalClaimedRewardNumber).to.be.within(
    Number(lowerBound.toString()),
    Number(upperBound.toString())
  );

  // 언스테이킹 및 보상 확인
  for (const user of users) {
    await stakingContract.methods.unstake().send({ from: user });
    const userBalance = BigInt(await bsmToken.methods.balanceOf(user).call());
    console.log(
      `User ${user} balance after unstake: ${web3.utils.fromWei(
        userBalance.toString(),
        "ether"
      )}`
    );
  }
});
