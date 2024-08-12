import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UniswapRouter", (m) => {
  const uniswapV2Router = m.contract("UniswapV2Router");
  return { uniswapV2Router };
});
