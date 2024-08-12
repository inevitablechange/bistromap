// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        _setupDecimals(decimals);
    }

    function _setupDecimals(uint8 decimals_) internal virtual {
        uint8 _decimals = decimals_;
    }
}