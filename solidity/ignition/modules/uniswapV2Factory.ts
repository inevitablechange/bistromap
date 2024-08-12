import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ZeroAddress } from "ethers";

export default buildModule("UniswapFactory", (m) => {
  const uniswapV2Factory = m.contract("UniswapV2Factory", [ZeroAddress]);
  return { uniswapV2Factory };
});
