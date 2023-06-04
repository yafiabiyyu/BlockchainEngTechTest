const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
    async function deployVotingFixture() {
        const [deployer, otherAccount] = await ethers.getSigners();

        const Factory = await ethers.getContractFactory("VotingFactory");
        const factory = await Factory.deploy();

        return { factory, deployer, otherAccount };
    }

    describe("VotingFactory", function () {
        it("Owner is deployer", async function () {
            const { factory, deployer } = await loadFixture(
                deployVotingFixture
            );
            await expect(await factory.owner()).to.be.equal(deployer.address);
        });

        it("Owner transfers ownership", async function () {
            const { factory, deployer, otherAccount } = await loadFixture(
                deployVotingFixture
            );
            await factory
                .connect(deployer)
                .transferOwnership(otherAccount.address);
            await expect(await factory.owner()).to.be.equal(
                otherAccount.address
            );
        });

        it("Revert transfer ownership from non-owner", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFixture
            );
            await expect(
                factory
                    .connect(otherAccount)
                    .transferOwnership(otherAccount.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Create voting event", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFixture
            );

            // Preparations
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() + 2);
            let votingName = "Test Vote";

            // Get create2 address
            let salt = ethers.utils.solidityKeccak256(
                ["bytes"],
                [ethers.utils.solidityPack(["string"], [votingName])]
            );
            let initCodeHash = ethers.utils.keccak256(
                (await ethers.getContractFactory("Votings")).bytecode
            );
            let create2address = ethers.utils.getCreate2Address(
                factory.address,
                salt,
                initCodeHash
            );

            const create = await factory
                .connect(otherAccount)
                .createVoting(votingName, startTime, endTime, {value: ethers.utils.parseEther("0.1")});

            await expect(create)
                .to.emit(factory, "NewVoting")
                .withArgs(
                    create2address,
                    votingName,
                    startTime,
                    endTime,
                    otherAccount.address
                );

            const voting = await ethers.getContractAt(
                "Votings",
                create2address
            );
            await expect(await voting.name()).to.be.equal(votingName);
            await expect(await voting.startTime()).to.be.equal(startTime);
            await expect(await voting.endTime()).to.be.equal(endTime);
            await expect(await voting.owner()).to.be.equal(
                otherAccount.address
            );
        });

        it("Revert create voting event with invalid time", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFixture
            );
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() - 3);
            let votingName = "Test Vote";

            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, endTime, {value: ethers.utils.parseEther("0.1")})
            ).to.be.revertedWith("VotingFactory: Invalid voting time");
            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, 0, {value: ethers.utils.parseEther("0.1")})
            ).to.be.revertedWith(
                "VotingFactory: Voting time must be greater than 0"
            );
        });

        it("Revert create voting event with name already exists", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFixture
            );
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() + 2);
            let votingName = "Test Vote";
            await factory
                .connect(otherAccount)
                .createVoting(votingName, startTime, endTime,{value: ethers.utils.parseEther("0.1")});

            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, endTime, {value: ethers.utils.parseEther("0.1")})
            ).to.be.revertedWith("VotingFactory: Voting name already exist");
        });

        it("Revert create voting event with value less than 0.1 ether", async function(){
            const { factory, otherAccount } = await loadFixture(
                deployVotingFixture
            );
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() + 2);
            let votingName = "Test Vote";

            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, endTime, {value: ethers.utils.parseEther("0")})
            ).to.be.revertedWith("VotingFactory: Insufficient funds");
        })
    });
});
