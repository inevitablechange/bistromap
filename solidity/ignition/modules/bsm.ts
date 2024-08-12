import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BsmContract", (m) => {
  const bsm = m.contract("BSM");
  return { bsm };
});
