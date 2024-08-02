// SPDX-License-Identifier: GPL-3.0

pragma solidity >= 0.8.2 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract BSM is ERC20, Ownable {
    uint256 private constant _initialSupply = 2100000 * 10 ** 18; // 2.1 million tokens with 18 decimals
    uint256 public privateSaleAmount;
    uint256 public constant TGE = 6 * 30 days; // 6 months after TGE
    uint256 public constant TWELVE_MONTHS = 12 * 30 days; // 12 months
    uint256 public constant TWENTY_FOUR_MONTHS = 24 * 30 days; // 24 months
    
    mapping(address => uint256) private _privateSaleBalances;
    mapping(address => uint256) private _released;
    
    constructor() ERC20("Bistro", "BSM") {
        _mint(address(this), _initialSupply); // Mint initial supply to the contract itself
        privateSaleAmount = _initialSupply; // All tokens are allocated for private sale initially
    }
    function buyPrivateSale(address beneficiary, uint256 amount) external onlyOwner {
        require(privateSaleAmount >= amount, "Not enough tokens for private sale");
        _privateSaleBalances[beneficiary] += amount;
        privateSaleAmount -= amount;
    }
    
    function release() external {
        uint256 unreleased = releasableAmount(msg.sender);
        require(unreleased > 0, "No tokens are due for release");
        _released[msg.sender] += unreleased;
        _transfer(address(this), msg.sender, unreleased);
    }
    
    function releasableAmount(address beneficiary) public view returns (uint256) {
        return vestedAmount(beneficiary) - _released[beneficiary];
    }
    
    function vestedAmount(address beneficiary) public view returns (uint256) {
        uint256 totalBalance = _privateSaleBalances[beneficiary];
        uint256 elapsedTime = block.timestamp - TGE;
        if (elapsedTime >= TWENTY_FOUR_MONTHS) {
            return totalBalance; // All tokens are vested
        } else if (elapsedTime >= TWELVE_MONTHS) {
            return (totalBalance * 80) / 100; // 50% + 30%
        } else if (elapsedTime >= TGE) {
            return (totalBalance * 20) / 100; // 20%
        } else {
            return 0; // No tokens are vested
        }
    }
} 