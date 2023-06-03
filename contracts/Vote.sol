// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

contract Vote {
    string public votingName;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    address[] public votersCounter;
    address public immutable OWNER;
    address public immutable FACTORY;

    struct Candidate {
        string name;
        string imageURI;
        uint256 candidatId;
        uint256 voteCount;
        address[] voters;
    }
    Candidate private candidate;
    Candidate[] private candidates;

    mapping(address => bool) public votersStatus;

    modifier onlyOwner() {
        require(msg.sender == OWNER, "Vote: only owner can call this function");
        _;
    }

    event NewCandidat(uint256 indexed candidatId, string name, string imageURI, address indexed contractAddress);
    event VotingSetup(uint256 votingStartTime, uint256 votingEndTime, address indexed contractAddress);
    event VoteCasted(uint256 indexed candidatId, uint256 voteCount,address indexed voter, address indexed contractAddress);

    constructor() {
        FACTORY = msg.sender;
    }

    function initialize(string calldata _votingName, address _owner) external {
        require(msg.sender == FACTORY, "Vote: only factory can initialize");
        votingName = _votingName;
        OWNER = _owner;
    }

    function setVoting(uint256 _votingStartTime, uint256 _votingEndTime) external onlyOwner {
        require(_votingStartTime > 0 && _votingEndTime > 0, "Vote: voting time must be greater than 0");
        require(_votingStartTime < _votingEndTime, "Vote: voting start time must be less than voting end time");
        votingStartTime = _votingStartTime;
        votingEndTime = _votingEndTime;
        emit VotingSetup(votingStartTime, votingEndTime, address(this));
    }

    function registerCandidat(string calldata _name, string calldata _imageURI, uint256 _candidatId) external onlyOwner{
        require(candidate.name != _name, "Vote: candidate already registered");
        candidates.push(
            Candidate({
                name: _name,
                imageURI: _imageURI,
                candidatId: _candidatId,
                voteCount: 0,
                voters: new address[](0)
            })
        );
        emit NewCandidat(_candidatId, _name, _imageURI, address(this));
    }

    function vote(uint256 _candidatId) external {
        require(block.timestamp >= votingStartTime && block.timestamp <= votingEndTime, "Vote: voting is not active");
        require(!votersStatus[msg.sender], "Vote: you already voted");
        uint256 _candidatIndex = _candidatId - 1;
        require(_candidatIndex < candidates.length, "Vote: candidat not found");
        candidates[_candidatIndex].voteCount += 1;
        candidates[_candidatIndex].voters.push(msg.sender);
        votersStatus[msg.sender] = true;
        votersCounter.push(msg.sender);
        emit VoteCasted(_candidatId, candidates[_candidatIndex].voteCount, msg.sender, address(this));
    }
}