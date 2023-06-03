// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface IVote {
    function initialize(string calldata votingName, address owner) external;
}