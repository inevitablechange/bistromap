const { Web3 } = require("web3");
const { expect } = require("chai");
const artifacts = require("../artifacts/contracts/Staking.sol/StakingContract.json");

const web3 = new Web3("http://127.0.0.1:8545/");

let bsmToken, stakingContract;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  // BSMToken 배포
  const BSMTokenArtifact = require("../artifacts/contracts/ERC20.sol/BSM.json");
  const BSMToken = new web3.eth.Contract(BSMTokenArtifact.abi);
  bsmToken = await BSMToken.deploy({
    data: BSMTokenArtifact.bytecode,
    arguments: [Math.floor(Date.now() / 1000) + 3600], // privateSalesStart는 현재 시간 + 1시간
  }).send({ from: accounts[0], gas: "5000000" });

  // StakingContract 배포
  const Staking = new web3.eth.Contract(artifacts.abi);
  stakingContract = await Staking.deploy({
    data: artifacts.bytecode,
    arguments: [bsmToken.options.address],
  }).send({ from: accounts[0], gas: "5000000" });

  // BSMToken을 user에게 전송
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM
  await bsmToken.methods
    .mint(accounts[1], amountToStake)
    .send({ from: accounts[0] });
});

it("should stake tokens correctly", async () => {
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM

  // user가 BSMToken을 stakingContract에 승인
  await bsmToken.methods
    .approve(stakingContract.options.address, amountToStake)
    .send({ from: accounts[1] });

  // user가 BSMToken을 스테이킹
  await stakingContract.methods
    .stake(amountToStake)
    .send({ from: accounts[1] });

  // 스테이킹 상태 확인
  const stake = await stakingContract.methods.stakes(accounts[1]).call();
  expect(stake.amount).to.equal(amountToStake);
});

it("should unstake tokens correctly", async () => {
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM

  // user가 BSMToken을 stakingContract에 승인
  await bsmToken.methods
    .approve(stakingContract.options.address, amountToStake)
    .send({ from: accounts[1] });

  // user가 BSMToken을 스테이킹
  await stakingContract.methods
    .stake(amountToStake)
    .send({ from: accounts[1] });

  // 스테이킹 기간이 지나도록 설정 (예: 1초)
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기

  // user가 BSMToken을 언스테이킹
  await stakingContract.methods.unstake().send({ from: accounts[1] });

  // 스테이킹 상태 확인
  const stake = await stakingContract.methods.stakes(accounts[1]).call();
  expect(stake.amount).to.equal("0");
});

it("should claim rewards correctly", async () => {
  const amountToStake = web3.utils.toWei("1000", "ether"); // 1000 BSM

  // user가 BSMToken을 stakingContract에 승인
  await bsmToken.methods
    .approve(stakingContract.options.address, amountToStake)
    .send({ from: accounts[1] });

  // user가 BSMToken을 스테이킹
  await stakingContract.methods
    .stake(amountToStake)
    .send({ from: accounts[1] });

  // 스테이킹 기간이 지나도록 설정 (예: 1초)
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기

  // user가 보상 클레임
  await stakingContract.methods.claim().send({ from: accounts[1] });

  // 보상 상태 확인
  // 보상 상태는 보상 지급 후 확인해야 할 부분입니다.
});
