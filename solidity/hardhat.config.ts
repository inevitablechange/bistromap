import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
/** @type import('hardhat/config').HardhatUserConfig */

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 1000,
      },
    },
  },
};

export default config;
