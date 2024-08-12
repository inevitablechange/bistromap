import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PoolRewards", (m) => {
  const poolRewards = m.contract("PoolRewards", []);

  return { poolRewards };
});
