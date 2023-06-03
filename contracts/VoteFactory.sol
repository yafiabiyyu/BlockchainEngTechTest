// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Vote.sol";

contract VoteFactory is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface immutable COORDINATOR;
    LinkTokenInterface immutable LINKTOKEN;

    uint16 constant REQUEST_CONFIRMATIONS = 3;
    uint32 constant CALLBACK_GAS_LIMIT = 100000;
    uint32 constant NUM_WORDS = 2;
    uint64 immutable subscriptionId;
    uint256 requestId;

    bytes32 internal keyHash;

    mapping(uint256 => address) private _requestIdToContract;
    mapping(address => uint256) private _contractToRandomWords;
    mapping(address => bool) private _contractStatus;

    constructor(address _vrfCoordinatorAddress, address _linkToken, bytes32 _keyHash) VRFConsumerBaseV2(_vrfCoordinatorAddress) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinatorAddress);
        LINKTOKEN = LinkTokenInterface(_linkToken);
        keyHash = _keyHash;
        subscriptionId = COORDINATOR.createSubscription();
    }

    function createVote(string calldata _votingName) external {
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
        bytes32 salt = keccak256(abi.encodePacked(_votingName));
        require(!_checkAddress(salt), "VoteFactory: voting name already exists");
        // Lanjutkan di sini untuk implement contract baru
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
                                    type(Vote).creationCode
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