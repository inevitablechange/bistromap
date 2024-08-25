export interface ConfigEnvType {
  BSM_STAKING: string;
  LP_BSM_STAKING: string;
  DATE_CHECKER: string;
  REVIEW_REWARD: string;
  UNISWAP_V2_ROUTER: string;
  UNISWAP_V2_PAIR: string;
  USDT_ADDRESS: string;
  BSM_ADDRESS: string;
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
    BSM_STAKING: "0x539c2994A76B1F6e014F2b8fDd83CdC1833817C1",
    LP_BSM_STAKING: "0x770Bca7D3BCf1EcBD1774B2bBFf06Cc7b649E351",
    DATE_CHECKER: "0x90d144033f09cf9126166070ff5f27e5c456178c",
    REVIEW_REWARD: "0x0da933b2c57642139faab5daac9a7ead9c52da2e",
    UNISWAP_V2_ROUTER: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
    UNISWAP_V2_PAIR: "0x00C744cCD0598E5AA7Ba203d028ba0276404f18D",
    USDT_ADDRESS: "0x0C318d73620F944a6a6B9Ebb8582f5EA99513983",
    BSM_ADDRESS: "0x14e8671b28f29B1B7239a448774DfdC1822B5057",
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
