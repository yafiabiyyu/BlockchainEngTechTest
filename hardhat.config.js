require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config({ path: ".env" });
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.15",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 2000,
                    },
                },
            },
            {
                version: "0.4.24",
            },
        ],
    },
    networks: {
        goerli: {
            url: process.env.RPC,
            chainId: 5,
            accounts: {
                mnemonic: process.env.MNEMONIC,
                path: "m/44'/60'/0'/0",
            },
        },
    },
    gasReporter: {
        token: "CELO",
        currency: "USD",
        gasPrice: 21,
        enabled: true,
    },
};
