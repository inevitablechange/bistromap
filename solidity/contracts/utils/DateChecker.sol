// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DateChecker {

    uint constant DAY_IN_SECONDS = 86400; // Number of seconds in a day

    function isToday(uint timestamp) public view returns (bool) {
        // Get the current block timestamp
        uint currentTimestamp = block.timestamp;

        // Calculate the start of today (midnight)
        uint startOfToday = currentTimestamp - (currentTimestamp % DAY_IN_SECONDS);

        // Check if the given timestamp is within today's range
        return (timestamp >= startOfToday && timestamp < startOfToday + DAY_IN_SECONDS);
    }

    function isYesterday(uint timestamp) public view returns (bool) {
        // Get the current block timestamp
        uint currentTimestamp = block.timestamp;

        // Calculate the start of today (midnight)
        uint startOfToday = currentTimestamp - (currentTimestamp % DAY_IN_SECONDS);

        // Calculate the start of yesterday (midnight)
        uint startOfYesterday = startOfToday - DAY_IN_SECONDS;

        // Check if the given timestamp is within yesterday's range
        return (timestamp >= startOfYesterday && timestamp < startOfToday);
    }
}