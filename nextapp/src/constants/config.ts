export interface ConfigEnvType {
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
    UNISWAP_V2_ROUTER: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
    UNISWAP_V2_PAIR: "0x404a2Ab304FC9317B0f1Ac38299035cb7b85373B",
    USDT_ADDRESS: "0xE1fC1ae9816A03e5CDf36D74E63b62f96BC7467b", // Sepolia USDT address
    BSM_ADDRESS: "0x1E769D810D18B4f86d415E6b6e804EfD1d15188f",
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
