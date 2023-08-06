import { Goerli } from "@usedapp/core";

export const ROUTER_ADDRESS = "0x0a3f2D2f37666dAED449585eD39E7a6d90eDAEfD"; 

export const DAPP_CONFIG = {
  readOnlyChainId: Goerli.chainId,
  readOnlyUrls: {
    [Goerli.chainId]: "https://eth-goerli.g.alchemy.com/v2/sa3czutF0RJxD3_s50V171cGTY9436yk",
  },
};