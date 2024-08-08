// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // BSM 계약 배포
  const BSM = await ethers.getContractFactory("BSM");
  const usdtTokenMock = "0x0000000000000000000000000000000000000000"; // Mock USDT 주소
  const privateSalesStart = Math.floor(Date.now() / 1000); // 현재 Unix 타임스탬프

  try {
    // 계약 배포
    const bsm = await BSM.deploy(usdtTokenMock, privateSalesStart);
    console.log("Deploying BSM contract...");

    // 배포 완료 후 트랜잭션 확인
    const deploymentReceipt = await bsm.deployTransaction.wait(); // 대기
    console.log("BSM contract deployed to:", bsm.address);

    // StakingContract 계약 배포
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContract.deploy(bsm.address);
    console.log("Deploying StakingContract contract...");

    // 배포 완료 후 트랜잭션 확인
    await stakingContract.deployTransaction.wait(); // 대기
    console.log(
      "StakingContract contract deployed to:",
      stakingContract.address
    );

    // 간단한 상호작용 시뮬레이션
    // 1. BSM 컨트랙트의 민터 설정
    await bsm.setMinter(deployer.address, true);

    // 2. BSM 컨트랙트에서 일부 토큰을 배포자에게 발행
    await bsm.mint(deployer.address, ethers.utils.parseUnits("10000", 18)); // 10,000 BSM

    // 3. 배포자가 BSM을 스테이킹
    await bsm
      .connect(deployer)
      .approve(stakingContract.address, ethers.utils.parseUnits("1000", 18)); // 1000 BSM 승인
    await stakingContract
      .connect(deployer)
      .stake(ethers.utils.parseUnits("1000", 18)); // 1000 BSM 스테이킹

    console.log("Staked 1000 BSM tokens.");

    // 4. 스테이킹 상태 확인
    const stakeInfo = await stakingContract.stakes(deployer.address);
    console.log("Stake Info:", stakeInfo);
  } catch (error) {
    console.error("Deployment or interaction failed:", error);
  }
}

main().catch((error) => {
  console.error("Error in script execution:", error);
  process.exitCode = 1;
});
