// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

contract Votings {
    string public name;
    uint256 public startTime;
    uint256 public endTime;

    address public owner;
    address[] private _voters;
    address private immutable _factory;

    struct Candidate {
        string name;
        string imageURI;
        uint256 candidatId;
        uint256 voteCount;
        address[] voters;
    }
    Candidate[] private _candidate;

    mapping(address => bool) public votersStatus;

    modifier onlyOwner() {
        require(msg.sender == owner, "Vote: Only owner can call this function");
        _;
    }

    event NewCandidate(uint256 indexed candidatId, string name, string imageURI);
    event Voting(uint256 indexed candidatId, address indexed voter, uint256 voteCount);
    event WinerAndDistributionReward(uint256 indexed candidatId, address indexed voter);

    constructor() payable {
        _factory = msg.sender;
    }

    function initialize(
        string memory name_,
        uint256 startTime_,
        uint256 endTime_,
        address owner_
    ) external {
        require(
            msg.sender == _factory,
            "Vote: Only factory can call this function"
        );
        name = name_;
        startTime = startTime_;
        endTime = endTime_;
        owner = owner_;
    }

    function registerCandidate(uint256 candidatId_, string memory name_, string memory imageURI_) external onlyOwner {
        require(block.timestamp < startTime, "Vote: Voting has started");
        for(uint256 i = 0; i < _candidate.length; i++){
            if(keccak256(bytes(_candidate[i].name)) == keccak256(bytes(name_))){
                revert("Vote: Candidate name already exist");
            }
        }
        _candidate.push(
            Candidate(
                name_,
                imageURI_,
                candidatId_,
                0,
                new address[](0)
            )
        );
        emit NewCandidate(candidatId_, name_, imageURI_);
    }

    function vote(uint256 candidatId_) external {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Vote: Voting is not active");
        require(!votersStatus[msg.sender], "Vote: You have already voted");
        require(_candidate.length > 1, "Vote: Invalid Candidate total");
        require(candidatId_ <= _candidate.length, "Vote: Invalid Candidate Id");

        uint256 candidatIndex = candidatId_ - 1;
        votersStatus[msg.sender] = true;
        Candidate storage candidate = _candidate[candidatIndex];
        candidate.voteCount += 1;
        candidate.voters.push(msg.sender);
        _voters.push(msg.sender);
        emit Voting(candidatId_, msg.sender, _candidate[candidatIndex].voteCount);
    }

    function getWinnerAndDistributionReward() external onlyOwner {
        require(block.timestamp > endTime, "Vote: Voting is still active");
        uint256 winerIndex = _getWinerIndex();
        address votersWiner = _candidate[winerIndex].voters[_getRandomNumber() % _candidate[winerIndex].voters.length];

        // Transfer reward
        (bool success, ) = votersWiner.call{value: address(this).balance}("");
        require(success, "Vote: Transfer failed.");
        emit WinerAndDistributionReward(_candidate[winerIndex].candidatId, votersWiner);
    }

    function getCandidateTotalVote(uint256 candidatId_) external view returns(uint256) {
        uint256 candidatIndex = candidatId_ - 1;
        return _candidate[candidatIndex].voteCount;
    }

    function getLastCandidateIndex() external view returns(uint256) {
        return _candidate.length;
    }

    function _getWinerIndex() private view returns(uint256 index) {
        uint256 totalVote = 0;
        for(uint256 i = 0; i < _candidate.length; i++){
            if(_candidate[i].voteCount > totalVote){
                totalVote = _candidate[i].voteCount;
                index = i;
            }
        }
    }

    function _getRandomNumber() private view returns(uint256) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, _voters)));
    }

}