import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UniswapPair", (m) => {
  const uniswapV2Pair = m.contract("UniswapV2Pair");
  return { uniswapV2Pair };
});
