export interface ConfigEnvType {
  BSM_STAKING: string;
  LP_BSM_STAKING: string;
  DATE_CHECKER: string;
  REVIEW_REWARD: string;
  UNISWAP_V2_ROUTER: string;
  UNISWAP_V2_PAIR: string;
  USDT_ADDRESS: string;
  BSM_ADDRESS: string;
  NFT_ADDRESS: string;
  chainLabel: string;
  rpcEndpoint: string;
  chainNativeCurrency: {
    name: string;
    symbol: string;
    decimals: 18;
  };
  chainExplorer: string;
  chainId: number;
}

export const configs: {
  local: ConfigEnvType;
  //   production: ConfigEnvType;
} = {
  local: {
    BSM_ADDRESS: "0xEAdeb8C7D4026E4fE681becEBAE42a19eeC822DC",
    BSM_STAKING: "0xC780bc8d29f4aa847C7e9aE841E00A606f6735e1",
    LP_BSM_STAKING: "0x4Ec996879E040F7eA84440C772A311134497fD87",
    DATE_CHECKER: "0x90d144033f09cf9126166070ff5f27e5c456178c",
    REVIEW_REWARD: "",
    NFT_ADDRESS: "",
    UNISWAP_V2_ROUTER: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
    UNISWAP_V2_PAIR: "0x5fc076E030b029080643a02E76e5Ff788F31BcA1",
    USDT_ADDRESS: "0xB69E30EC2466EE8baA002d9e19D1E39c789Ce523",
    chainLabel: "Sepolia Testnet",
    rpcEndpoint: "https://sepolia.infura.io/v3/",
    chainNativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    chainExplorer: "https://sepolia.etherscan.io",
    chainId: 11155111,
  },
  //   production: {
  //     UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  //     USDT_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  //     BSM_ADDRESS: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  //     chainLabel: "Etherum Mainnet",
  //     rpcEndpoint: "https://mainnet.infura.io/v3/",
  //     chainNativeCurrency: {
  //       name: "Ethereum",
  //       symbol: "ETH",
  //       decimals: 18,
  //     },
  //     chainExplorer: "https://etherscan.io",
  //     chainId: 1,
  //   },
};

export default configs["local"];
