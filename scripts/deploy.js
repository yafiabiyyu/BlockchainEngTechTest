const { ethers, network } = require("hardhat");
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config");

async function deployMocks() {
	const BASE_FEE = "100000000000000000";
    const GAS_PRICE_LINK = "1000000000"; // 0.000000001 LINK per gas
	
	// Load contract artifacts
	const linkTokenFactory = await ethers.getContractFactory("LinkToken");
	const vrfCoordinatorFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");

	// Deploy contracts
	const linkToken = await linkTokenFactory.deploy();
	const vrfCoordinator = await vrfCoordinatorFactory.deploy(BASE_FEE, GAS_PRICE_LINK);

	return [vrfCoordinator, linkToken];
}

async function setupVotingFactory(LINK, COORDINATOR, SUBSCRIPTION_ID, CHAIN_ID){
	const LINK_AMOUNT = ethers.utils.parseEther("2");
	const KEY_HASH = networkConfig[CHAIN_ID].keyHash;

	// Load contract artifacts
	const votingFactory = await ethers.getContractFactory("VoteFactory");
	const factory = await votingFactory.deploy(
		SUBSCRIPTION_ID,
		COORDINATOR.address,
		KEY_HASH
	);

	// Setup Chainlink VRF Subscription

	// Approve LINK to coordinator
	// await LINK.approve(COORDINATOR.address, LINK_AMOUNT);

	// fund subscription
	await COORDINATOR.fundSubscription(SUBSCRIPTION_ID, LINK_AMOUNT);

	return factory;
}

async function main() {
	let LINK;
	let COORDINATOR;
	let SUBSCRIPTION_ID;
	let VOTING_FACTORY;
	let CHAIN_ID = network.config.chainId;

	if(CHAIN_ID == 31337){
		// Deploy VRF Coordinator
		[COORDINATOR, LINK] = await deployMocks();

		// Create subscription ID
		const transaction = await COORDINATOR.createSubscription();
		const tx_receipt = await transaction.wait(1);
		SUBSCRIPTION_ID = ethers.BigNumber.from(tx_receipt.events[0].topics[1]);
	}else {
		// Load contract
		LINK = await ethers.getContractAt("LinkToken", networkConfig[CHAIN_ID].linkToken);
		COORDINATOR = await ethers.getContractAt("VRFCoordinatorV2Mock", networkConfig[CHAIN_ID].vrfCoordinator);

		// Create subscription ID
		const transaction = await COORDINATOR.createSubscription();
		const tx_receipt = await transaction.wait(1);
		SUBSCRIPTION_ID = ethers.BigNumber.from(tx_receipt.events[0].topics[1]);
	}
	VOTING_FACTORY = await setupVotingFactory(LINK, COORDINATOR, SUBSCRIPTION_ID, CHAIN_ID);
	console.log("Voting Factory deployed to:", VOTING_FACTORY.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});