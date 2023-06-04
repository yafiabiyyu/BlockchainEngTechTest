const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
    async function deployVotingFactoryFixture() {
        const [deployer, otherAccount] = await ethers.getSigners();

        const Factory = await ethers.getContractFactory("VotingFactory");
        const factory = await Factory.deploy();

        return { factory, deployer, otherAccount };
    }

    async function deployVotingFixture() {
        const [, votingOwner, otherAccount] = await ethers.getSigners();
        const { factory } = await loadFixture(deployVotingFactoryFixture);

        let date = new Date();
        let startTime = date.setDate(date.getDate() + 1);
        let endTime = date.setDate(date.getDate() + 2);
        let finishTime = date.setDate(date.getDate() + 3);
        let name = "Test Vote";

        const create = await factory
            .connect(votingOwner)
            .createVoting(name, startTime, endTime, {
                value: ethers.utils.parseEther("0.3"),
            });
        const receipt = await create.wait();
        const votingAddress = receipt.events[0].args[0];

        const voting = await ethers.getContractAt("Votings", votingAddress);

        return { voting, votingOwner, startTime, endTime, finishTime, otherAccount };
    }

    async function deployVotingWithOneCandidate() {
        const { voting, votingOwner } = await loadFixture(deployVotingFixture);

        let candidateName = "Candidate 1";
        let imageURI = "https://www.google.com";
        let candidateId = (await voting.getLastCandidateIndex()).add(1);

        await voting
            .connect(votingOwner)
            .registerCandidate(candidateId, candidateName, imageURI);
    }

    async function deployVotingWithTwoCandidate() {
        const { voting, votingOwner } = await loadFixture(deployVotingFixture);

        let candidate1 = "Candidate 1";
        let imageURI1 = "https://www.google.com";
        let candidateId1 = (await voting.getLastCandidateIndex()).add(1);

        await voting
            .connect(votingOwner)
            .registerCandidate(candidateId1, candidate1, imageURI1);

        let candidate2 = "Candidate 2";
        let imageURI2 = "https://www.google.com";
        let candidateId2 = (await voting.getLastCandidateIndex()).add(1);

        await voting
            .connect(votingOwner)
            .registerCandidate(candidateId2, candidate2, imageURI2);
    }

    describe("VotingFactory", function () {
        it("Owner is deployer", async function () {
            const { factory, deployer } = await loadFixture(
                deployVotingFactoryFixture
            );
            await expect(await factory.owner()).to.be.equal(deployer.address);
        });

        it("Owner transfers ownership", async function () {
            const { factory, deployer, otherAccount } = await loadFixture(
                deployVotingFactoryFixture
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
                deployVotingFactoryFixture
            );
            await expect(
                factory
                    .connect(otherAccount)
                    .transferOwnership(otherAccount.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Create voting event", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFactoryFixture
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
                .createVoting(votingName, startTime, endTime, {
                    value: ethers.utils.parseEther("0.1"),
                });

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
                deployVotingFactoryFixture
            );
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() - 3);
            let votingName = "Test Vote";

            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, endTime, {
                        value: ethers.utils.parseEther("0.1"),
                    })
            ).to.be.revertedWith("VotingFactory: Invalid voting time");
            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, 0, {
                        value: ethers.utils.parseEther("0.1"),
                    })
            ).to.be.revertedWith(
                "VotingFactory: Voting time must be greater than 0"
            );
        });

        it("Revert create voting event with name already exists", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFactoryFixture
            );
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() + 2);
            let votingName = "Test Vote";
            await factory
                .connect(otherAccount)
                .createVoting(votingName, startTime, endTime, {
                    value: ethers.utils.parseEther("0.1"),
                });

            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, endTime, {
                        value: ethers.utils.parseEther("0.1"),
                    })
            ).to.be.revertedWith("VotingFactory: Voting name already exist");
        });

        it("Revert create voting event with value less than 0.1 ether", async function () {
            const { factory, otherAccount } = await loadFixture(
                deployVotingFactoryFixture
            );
            let date = new Date();
            let startTime = date.setDate(date.getDate() + 1);
            let endTime = date.setDate(date.getDate() + 2);
            let votingName = "Test Vote";

            await expect(
                factory
                    .connect(otherAccount)
                    .createVoting(votingName, startTime, endTime, {
                        value: ethers.utils.parseEther("0"),
                    })
            ).to.be.revertedWith("VotingFactory: Insufficient funds");
        });
    });

    describe("Voting", function () {
        it("Register Candidate", async function () {
            const { voting, votingOwner } = await loadFixture(
                deployVotingFixture
            );

            let candidate1 = "Candidate 1";
            let imageURI1 = "https://www.google.com";
            let candidateId1 = (await voting.getLastCandidateIndex()).add(1);

            const register = await voting
                .connect(votingOwner)
                .registerCandidate(candidateId1, candidate1, imageURI1);
            await expect(register)
                .to.emit(voting, "NewCandidate")
                .withArgs(candidateId1, candidate1, imageURI1);

            const totalVote = await voting.getCandidateTotalVote(candidateId1);
            await expect(totalVote).to.be.equal(0);
        });

        it("Revert registration candidates when voting has started", async function () {
            const { voting, votingOwner, startTime } = await loadFixture(
                deployVotingFixture
            );

            let candidate1 = "Candidate 1";
            let imageURI1 = "https://www.google.com";
            let candidateId1 = (await voting.getLastCandidateIndex()).add(1);

            time.increaseTo(startTime);
            await expect(
                voting
                    .connect(votingOwner)
                    .registerCandidate(candidateId1, candidate1, imageURI1)
            ).to.be.revertedWith("Vote: Voting has started");
        });

        it("Revert registration candidatew when name already exists", async function(){
            const { voting, votingOwner } = await loadFixture(
                deployVotingFixture
            );
            await loadFixture(deployVotingWithOneCandidate);

            let candidate1 = "Candidate 1";
            let imageURI1 = "https://www.google.com";
            let candidateId1 = (await voting.getLastCandidateIndex()).add(1);

            await expect(
                voting
                    .connect(votingOwner)
                    .registerCandidate(candidateId1, candidate1, imageURI1)
            ).to.be.revertedWith("Vote: Candidate name already exist");
        });

        it("Vote candidate", async function(){
            const { voting, otherAccount, startTime } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithTwoCandidate);

            time.increaseTo(startTime);
            const vote = await voting.connect(otherAccount).vote(1);
            const totalVote = (await voting.getCandidateTotalVote(1)).toNumber();

            await expect(vote).to.emit(
                voting,
                "Voting"
            ).withArgs(
                1,
                otherAccount.address,
                totalVote
            );
            expect(await voting.votersStatus(otherAccount.address)).to.be.equal(true);
            expect(totalVote).to.be.equal(1);
        });

        it("Revert vote candidate when candidate only one", async function(){
            const { voting, otherAccount, startTime } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithOneCandidate);

            time.increaseTo(startTime);
            await expect(
                voting.connect(otherAccount).vote(1)
            ).to.be.revertedWith("Vote: Invalid Candidate total");
        })

        it("Revert vote candidate when voting has not started", async function(){
            const { voting, otherAccount } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithTwoCandidate);

            await expect(
                voting.connect(otherAccount).vote(1)
            ).to.be.revertedWith("Vote: Voting is not active");
        });

        it("Revert vote candidate when voter has already voted", async function(){
            const { voting, otherAccount, startTime } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithTwoCandidate);

            time.increaseTo(startTime);
            await voting.connect(otherAccount).vote(1);
            await expect(
                voting.connect(otherAccount).vote(1)
            ).to.be.revertedWith("Vote: You have already voted");
        });

        it("Revert vote candidate when candidateId is invalid", async function(){
            const { voting, otherAccount, startTime } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithTwoCandidate);

            time.increaseTo(startTime);
            await expect(
                voting.connect(otherAccount).vote(3)
            ).to.be.revertedWith("Vote: Invalid Candidate Id");
        });

        it("Get winer and distribute reward", async function(){
            const { voting, votingOwner, otherAccount, startTime, finishTime } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithTwoCandidate);

            time.increaseTo(startTime);
            await voting.connect(otherAccount).vote(1);
            await voting.connect(votingOwner).vote(1);
            time.increaseTo(finishTime);

            const winner = await voting.connect(votingOwner).getWinnerAndDistributionReward();
            await expect(winner).to.emit(
                voting,
                "WinerAndDistributionReward"
            ).withArgs(
                1,
                anyValue
            );
            await expect(await ethers.provider.getBalance(voting.address)).to.be.equal(0);
        });

        it("Revert get winer and distribute reward when voting has not finished", async function(){
            const { voting, votingOwner, otherAccount, startTime } = await loadFixture(deployVotingFixture);
            await loadFixture(deployVotingWithTwoCandidate);

            time.increaseTo(startTime);
            await voting.connect(otherAccount).vote(1);
            await voting.connect(votingOwner).vote(1);
            await expect(
                voting.connect(votingOwner).getWinnerAndDistributionReward()
            ).to.be.revertedWith("Vote: Voting is still active");
        })
    });
});
