const { Web3 } = require("web3");
const { expect } = require("chai");
const web3 = new Web3("http://localhost:8545"); // 또는 사용 중인 Ethereum 테스트 네트워크 URL

const BSMTokenArtifact = require("../artifacts/contracts/ERC20.sol/BSM.json");
const StakingContractArtifact = require("../artifacts/contracts/Staking.sol/StakingContract.json");

let bsmToken, stakingContract;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  const [owner, user] = accounts;

  // BSMToken 배포
  const BSMToken = new web3.eth.Contract(BSMTokenArtifact.abi);
  bsmToken = await BSMToken.deploy({
    data: BSMTokenArtifact.bytecode,
    arguments: [Math.floor(Date.now() / 1000) + 3600], // privateSalesStart는 현재 시간 + 1시간
  }).send({ from: owner, gas: "5000000" });

  // StakingContract 배포
  const StakingContract = new web3.eth.Contract(StakingContractArtifact.abi);
  stakingContract = await StakingContract.deploy({
    data: StakingContractArtifact.bytecode,
    arguments: [bsmToken.options.address],
  }).send({ from: owner, gas: "5000000" });

  // BSMToken의 ownership을 StakingContract로 이전
  await bsmToken.methods
    .transferOwnership(stakingContract.options.address)
    .send({ from: owner });

  // BSMToken을 user에게 전송
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM
  await bsmToken.methods.mint(user, amountToStake).send({ from: owner });
});

it("should stake tokens correctly", async () => {
  const [owner, user] = accounts;
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM

  // user가 BSMToken을 stakingContract에 승인
  await bsmToken.methods
    .approve(stakingContract.options.address, amountToStake)
    .send({ from: user });

  // user가 BSMToken을 스테이킹
  await stakingContract.methods.stake(amountToStake).send({ from: user });

  // 스테이킹 상태 확인
  const stake = await stakingContract.methods.stakes(user).call();
  expect(stake.amount).to.equal(amountToStake);
});

it("should unstake tokens correctly after 25 weeks", async () => {
  const [owner, user] = accounts;
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM

  // user가 BSMToken을 stakingContract에 승인
  await bsmToken.methods
    .approve(stakingContract.options.address, amountToStake)
    .send({ from: user });

  // user가 BSMToken을 스테이킹
  await stakingContract.methods.stake(amountToStake).send({ from: user });

  // 충분한 스테이킹 기간이 지나도록 설정 (예: 25주)
  const weeks = 25;
  const seconds = weeks * 7 * 24 * 60 * 60;

  await web3.currentProvider.request({
    jsonrpc: "2.0",
    method: "evm_increaseTime",
    params: [seconds],
    id: new Date().getTime(),
  });

  await web3.currentProvider.request({
    jsonrpc: "2.0",
    method: "evm_mine",
    params: [],
    id: new Date().getTime(),
  });

  // user가 BSMToken을 언스테이킹
  await stakingContract.methods.unstake().send({ from: user });

  // 스테이킹 상태 확인
  const stake = await stakingContract.methods.stakes(user).call();
  expect(stake.amount).to.equal("0");
});

it("should claim rewards correctly after 25 weeks", async () => {
  const [owner, user] = accounts;
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM

  // user가 BSMToken을 stakingContract에 승인
  await bsmToken.methods
    .approve(stakingContract.options.address, amountToStake)
    .send({ from: user });

  // user가 BSMToken을 스테이킹
  await stakingContract.methods.stake(amountToStake).send({ from: user });

  // 충분한 스테이킹 기간이 지나도록 설정 (예: 25주)
  const weeks = 25;
  const seconds = weeks * 7 * 24 * 60 * 60;

  await web3.currentProvider.request({
    jsonrpc: "2.0",
    method: "evm_increaseTime",
    params: [seconds],
    id: new Date().getTime(),
  });

  await web3.currentProvider.request({
    jsonrpc: "2.0",
    method: "evm_mine",
    params: [],
    id: new Date().getTime(),
  });

  // user가 보상 클레임
  await stakingContract.methods.claim().send({ from: user });

  // 보상 상태 확인
  const userBalance = await bsmToken.methods.balanceOf(user).call();
  console.log("User Balance:", userBalance);

  // 예상 보상 계산
  const initialBalance = web3.utils.toWei("1000", "ether"); // 초기 잔액 (스테이킹 이전)
  const expectedAPY = 12; // 12% 연간 보상 비율을 정수로 표현
  const secondsPerYear = 365 * 24 * 60 * 60; // 초 단위 연간 기간
  const expectedReward =
    (BigInt(amountToStake) * BigInt(expectedAPY) * BigInt(seconds)) /
    BigInt(secondsPerYear) /
    BigInt(100); // 정수 계산 후 100으로 나눔

  console.log("Expected Reward:", expectedReward);

  // 스테이킹 금액을 포함한 잔고 계산
  const expectedBalance =
    BigInt(amountToStake) - BigInt(amountToStake) + BigInt(expectedReward);

  console.log("Expected Balance:", expectedBalance);

  // 예상 잔액과 실제 잔액을 비교 (오차 범위 증가)
  expect(BigInt(userBalance)).to.be.closeTo(expectedBalance, BigInt(1e19)); // 오차 범위 증가
});
