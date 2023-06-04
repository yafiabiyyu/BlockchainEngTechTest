// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface IVote {
    function initialize(
        string memory name_,
        uint256 startTime_,
        uint256 endTime_,
        address owner_
    ) external;
}
