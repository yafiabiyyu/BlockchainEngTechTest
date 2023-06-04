# Voting

## Requirements

- [Node.js](https://nodejs.org/en/download/) v14.17.6 LTS or higher
- [Hardhat](https://hardhat.org/getting-started/#overview)

## Installation

1. Clone the repository

```bash
git clone https://github.com/yafiabiyyu/BlockchainEngTechTest.git
```

2. Install dependencies

```bash
cd BlockchainEngTechTest

npm install
```

3. Create a `.env` file and add your Goerli RPC Provider URL and your mnemonic

```
MNEMONIC="YOUR MNEMONIC"
RPC="YOUR GOERLI RPC PROVIDER URL"
```

4. Compile the contracts

```bash
npx hardhat compile
```

5. Run the tests

```bash
npx hardhat test

# or coverage test

npx hardhat coverage
```

6. Deploy the contracts

```bash
npx hardhat run scripts/deploy.js --network goerli
```