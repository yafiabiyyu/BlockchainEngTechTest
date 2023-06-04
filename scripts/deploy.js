const { ethers } = require("hardhat");

async function main(){
	console.log("Deploy Factory contract");
	
	const Factory = await ethers.getContractFactory("VotingFactory");
	const factory = await Factory.deploy();

	console.log("Factory deployed to:", factory.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});