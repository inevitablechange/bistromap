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

it("should allow users to stake, wait 25 weeks, unstake, and check final stake info", async () => {
  const users = accounts.slice(1, 11); // 10명의 사용자
  const stakeAmount = web3.utils.toWei("1000", "ether"); // 최소 스테이킹 금액

  // 각 사용자가 BSMToken을 스테이킹
  for (const user of users) {
    await bsmToken.methods
      .approve(stakingContract.options.address, stakeAmount)
      .send({ from: user });
    const stakeTx = await stakingContract.methods
      .stake(stakeAmount)
      .send({ from: user });

    console.log(
      `User ${user} staked amount: ${web3.utils.fromWei(
        stakeAmount,
        "ether"
      )} BSM`
    );

    // Staked 이벤트 확인
    const stakedEvent = stakeTx.events.Staked;
    if (stakedEvent) {
      console.log(
        `Staked event amount: ${web3.utils.fromWei(
          stakedEvent.returnValues.amount,
          "ether"
        )} BSM`
      );
    }
  }

  // 25주 시간 경과
  const weeks = 25;
  const seconds = weeks * 7 * 24 * 60 * 60;

  // 시간 증가
  await web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_increaseTime",
    params: [seconds],
    id: new Date().getTime(),
  });

  // 블록 생성
  await web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_mine",
    params: [],
    id: new Date().getTime(),
  });

  // 각 사용자가 언스테이크 및 보상 확인
  let totalClaimedReward = BigInt(0);
  for (const user of users) {
    const initialBalance = BigInt(
      await bsmToken.methods.balanceOf(user).call()
    );

    // Unstake
    const unstakeTx = await stakingContract.methods
      .unstake()
      .send({ from: user });
    console.log(`User ${user} unstaked successfully`);

    // 언스테이크 트랜잭션 로그 확인
    const unstakedEvent = unstakeTx.events.Unstaked;
    const claimedEvent = unstakeTx.events.Claimed;

    if (unstakedEvent) {
      console.log(
        `Unstaked amount: ${web3.utils.fromWei(
          unstakedEvent.returnValues.amount,
          "ether"
        )} BSM`
      );
    }
    if (claimedEvent) {
      console.log(
        `Claimed reward: ${web3.utils.fromWei(
          claimedEvent.returnValues.amount,
          "ether"
        )} BSM`
      );
    }

    const finalBalance = BigInt(await bsmToken.methods.balanceOf(user).call());
    const claimedReward = finalBalance - initialBalance - BigInt(stakeAmount);

    console.log(
      `Total balance change for ${user}: ${web3.utils.fromWei(
        claimedReward.toString(),
        "ether"
      )} BSM`
    );
    totalClaimedReward += claimedReward;

    // 스테이킹 정보 확인
    const userStake = await stakingContract.methods.stakes(user).call();
    expect(userStake.amount).to.equal("0");
    expect(userStake.timestamp).to.equal("0");
    console.log(
      `User ${user} stake info after unstake: amount = ${userStake.amount}, timestamp = ${userStake.timestamp}`
    );
  }

  console.log(
    "Total Claimed Reward:",
    web3.utils.fromWei(totalClaimedReward.toString(), "ether")
  );

  // 예상 보상 계산
  const expectedAPR = 12; // 12%
  const stakingPeriodInSeconds = BigInt(25 * 7 * 24 * 60 * 60); // 25주를 초로 변환
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  const expectedRewardPerUser =
    (BigInt(stakeAmount) * BigInt(expectedAPR) * stakingPeriodInSeconds) /
    (secondsPerYear * BigInt(100));
  const expectedTotalReward = expectedRewardPerUser * BigInt(users.length);

  console.log(
    "Expected Total Reward:",
    web3.utils.fromWei(expectedTotalReward.toString(), "ether")
  );

  // 비교 (1% 오차 허용)
  const tolerance = expectedTotalReward / BigInt(100);
  expect(totalClaimedReward).to.be.within(
    expectedTotalReward - tolerance,
    expectedTotalReward + tolerance
  );
});
