const hre = require("hardhat");

async function main() {
  const firstTest = await hre.ethers.getContractFactory("BSM");
  const ercContract = await firstTest.deploy();
  const c_addr = await cpmm.attach(ercContract.target);
  console.log("ercContract:: ", ercContract);
  console.log("c_addr:: ", c_addr);
}

main();
