require('@nomicfoundation/hardhat-chai-matchers');
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('@nomiclabs/hardhat-truffle5');
require('@typechain/hardhat');
require("dotenv/config");
const intercept = require('intercept-stdout');

const { 
  GOERLI_API_URL, PRIVATE_KEY, ETHERSCAN_API_URL, SEPOLIA_API_KEY, 
  FLARESCAN_API_KEY, FLARE_EXPLORER_API_KEY, FLARE_RPC_API_KEY 
} = process.env;

const USE_FLARESCAN = false;

const { TASK_COMPILE } = require('hardhat/builtin-tasks/task-names');

// Override solc compile task and filter out useless warnings
task(TASK_COMPILE)
  .setAction(async (args, hre, runSuper) => {
    intercept((text) => {
      if (/MockContract.sol/.test(text) && text.match(/Warning: SPDX license identifier not provided in source file/)) return '';
      if (/MockContract.sol/.test(text) &&
        /Warning: This contract has a payable fallback function, but no receive ether function/.test(text)) return '';
      return text;
    });
    await runSuper(args);
  });

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          evmVersion: "london",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    ],
    overrides: {
      "contracts/Imports060.sol": {
        version: "0.6.6",
        settings: {}
      },
      "@gnosis.pm/mock-contract/contracts/MockContract.sol": {
        version: "0.6.6",
        settings: {}
      },
    }
  },
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${GOERLI_API_URL}`,
      accounts: [`${PRIVATE_KEY}`]
    },
    sepolia: {
      url: `https://rpc.ankr.com/eth_sepolia/${SEPOLIA_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`]
    },
    coston: {
      url: "https://coston-api.flare.network/ext/bc/C/rpc" + (FLARE_RPC_API_KEY ? `?x-apikey=${FLARE_RPC_API_KEY}` : ""),
      accounts: [`${PRIVATE_KEY}`],
      chainId: 16
    },
    coston2: {
      url: "https://coston2-api.flare.network/ext/C/rpc" + (FLARE_RPC_API_KEY ? `?x-apikey=${FLARE_RPC_API_KEY}` : ""),
      accounts: [`${PRIVATE_KEY}`],
      chainId: 114
    },
    songbird: {
      url: "https://songbird-api.flare.network/ext/bc/C/rpc" + (FLARE_RPC_API_KEY ? `?x-apikey=${FLARE_RPC_API_KEY}` : ""),
      accounts: [`${PRIVATE_KEY}`],
      chainId: 19
    },
    flare: {
      url: "https://flare-api.flare.network/ext/C/rpc" + (FLARE_RPC_API_KEY ? `?x-apikey=${FLARE_RPC_API_KEY}` : ""),
      accounts: [`${PRIVATE_KEY}`],
      chainId: 14,
    }
  },
  etherscan: {
    apiKey: {
      "goerli": `${ETHERSCAN_API_URL}`,
      "coston": `${FLARESCAN_API_KEY}`,
      "coston2": `${FLARESCAN_API_KEY}`,
      "songbird": `${FLARESCAN_API_KEY}`,
      "flare": `${FLARESCAN_API_KEY}`,
      "sepolia": `${ETHERSCAN_API_URL}`,
    },
    customChains: [
      {
        network: "coston",
        chainId: 16,
        urls: {
          apiURL: "https://coston-explorer.flare.network/api" + (FLARE_EXPLORER_API_KEY ? `?x-apikey=${FLARE_EXPLORER_API_KEY}` : ""), 
          browserURL: "https://coston-explorer.flare.network"
        }
      },
      {
        network: "coston2",
        chainId: 114,
        urls: {
          apiURL: "https://coston2-explorer.flare.network/api" + (FLARE_EXPLORER_API_KEY ? `?x-apikey=${FLARE_EXPLORER_API_KEY}` : ""), 
          browserURL: "https://coston2-explorer.flare.network"
        }
      },
      {
        network: "songbird",
        chainId: 19,
        urls: {
          apiURL: "https://songbird-explorer.flare.network/api" + (FLARE_EXPLORER_API_KEY ? `?x-apikey=${FLARE_EXPLORER_API_KEY}` : ""), 
          browserURL: "https://songbird-explorer.flare.network/"
        }
      },
      {
        network: "flare",
        chainId: 14,
        urls: {
          apiURL: "https://flare-explorer.flare.network/api" + (FLARE_EXPLORER_API_KEY ? `?x-apikey=${FLARE_EXPLORER_API_KEY}` : ""), 
          browserURL: "https://flare-explorer.flare.network/",
        }
      }
    ]
  },
  paths: {
    sources: "./src/contracts/",
    tests: "./src/test/",
    cache: "./src/cache",
    artifacts: "./src/artifacts"
  },
  typechain: {
    target: 'truffle-v5',
  },
};

if (USE_FLARESCAN) {
  const FLARESCAN_DATA = [
    {
      apiURL: "https://api.routescan.io/v2/network/testnet/evm/16/etherscan",
      browserURL: "https://coston.testnet.flarescan.com"
    },
    {
      apiURL: "https://api.routescan.io/v2/network/testnet/evm/114/etherscan",
      browserURL: "https://coston2.testnet.flarescan.com"
    },
    {
      apiURL: "https://api.routescan.io/v2/network/mainnet/evm/19/etherscan",
      browserURL: "https://songbird.flarescan.com"
    },
    {
      apiURL: "https://api.routescan.io/v2/network/mainnet/evm/14/etherscan",
      browserURL: "https://mainnet.flarescan.com"
    }
  ];

  for (let i = 0; i < FLARESCAN_DATA.length; i++) {
    config.etherscan.customChains[i].urls = FLARESCAN_DATA[i];
  }
}

module.exports = config;
