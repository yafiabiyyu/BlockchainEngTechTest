// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interface/IVote.sol";
import "./Votings.sol";

contract VotingFactory is Ownable {

    mapping(address => bool) private _contractStatus;

    event NewVoting(address indexed votingAddress, string name, uint256 startTime, uint256 endTime, address owner);

    function createVoting(string memory name_, uint256 startTime_, uint256 endTime_) external payable {
        require(startTime_ > 0 && endTime_ > 0, "VotingFactory: Voting time must be greater than 0");
        require(endTime_ > startTime_, "VotingFactory: Invalid voting time");
        require(msg.value >= 0.1 ether, "VotingFactory: Insufficient funds");

        bytes32 salt = keccak256(abi.encodePacked(name_));
        require(!_checkAddress(salt), "VotingFactory: Voting name already exist");
        Votings vote = (new Votings){value: msg.value, salt: salt}();
        IVote(address(vote)).initialize(
            name_,
            startTime_,
            endTime_,
            msg.sender
        );
        _contractStatus[address(vote)] = true;
        emit NewVoting(address(vote), name_, startTime_, endTime_, msg.sender);
    }

    function _checkAddress(bytes32 _salt) private view returns(bool) {
        address predictAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            _salt,
                            keccak256(
                                abi.encodePacked(
                                    type(Votings).creationCode
                                )
                            )
                        )
                    )
                )
            )
        );
        return _contractStatus[predictAddress];
    }
}