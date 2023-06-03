require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({path:".env"})

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers:[
      {
        version: "0.8.15"
      },
      {
        version: "0.4.24"
      }
    ]
  },
  networks:{
    goerli: {
      url: process.env.RPC,
      chainId: 5,
      accounts:{
        mnemonic: process.env.MNEMONIC,
        path: "m/44'/60'/0'/0",
      }
    }
  }
};
