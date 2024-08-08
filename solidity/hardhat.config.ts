import "@nomicfoundation/hardhat-toolbox";

module.exports = {
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
