// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDT is ERC20("USDT", "USDT"), Ownable(msg.sender){
    function mint(address _to, uint _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}