import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UsdtContract", (m) => {
  const usdt = m.contract("USDT");
  return { usdt };
});
