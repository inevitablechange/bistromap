// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.2 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BSM is ERC20, Ownable(msg.sender) {
    IERC20 public usdtToken; // USDT token contract
    
    uint256 private constant _initialSupply = 2100000 * 10 ** 18; // 2.1 million tokens with 18 decimals
    uint256 public constant PRICE_PER_TOKEN = 5 * 10 ** 4; // 0.05 USDT per BSM token
    uint256 public privateSaleAmount;
    uint256 public constant TWENTY_FOUR_WEEKS = 24 weeks;
    uint256 public constant FORTY_EIGHT_WEEKS = 48 weeks;
    uint256 public constant NINETY_SIX_WEEKS = 96 weeks;
    
    uint public constant privateSalesLimitPerBeneficiary = 100000;
    uint public privateSalesStart;
    uint public privateSalesDuring = 2 weeks;
    uint public privateSalesRelease;
    mapping(address => uint256) private privateSaleBalances;
    mapping(address => uint256) private _released;
    address[] beneficiaries;
    
    constructor(uint _privateSalesStart) ERC20("Bistro", "BSM") {
        _mint(address(this), _initialSupply); // Mint initial supply to the contract itself
        privateSaleAmount = _initialSupply; // All tokens are allocated for private sale initially
        privateSalesStart = _privateSalesStart;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
    
    function buyPrivateSale(address beneficiary, uint256 amount) external {
        require(privateSaleAmount >= amount, "Not enough tokens for private sale");
        require(privateSaleBalances[beneficiary] + amount <= privateSalesLimitPerBeneficiary, "Private Sales Token amount cannot exceed 100000");
        
        uint256 cost = (amount * PRICE_PER_TOKEN) / 10 ** 6; // Calculate the cost in USDT
        require(usdtToken.transferFrom(msg.sender, address(this), cost), "USDT transfer failed");
        privateSaleBalances[beneficiary] += amount;
        privateSaleAmount -= amount;
    }
    
    function release() external {
        // 20 % -> 6개월 후, 30 % => 12개월 후 50% => 24개월 후
        uint256 elapsedTime = block.timestamp - (privateSalesStart + privateSalesDuring);
        require(elapsedTime >= 24 weeks, "Released after 6 months of private sales");
        for (uint i = 0; i < beneficiaries.length; i++) {
            address beneficiary = beneficiaries[i];
            if (elapsedTime < FORTY_EIGHT_WEEKS) {
                payable(beneficiary).transfer(privateSaleBalances[beneficiary] / 5); // 8 
                privateSaleBalances[beneficiary] -= privateSaleBalances[beneficiary] / 5;
            } else if (elapsedTime < NINETY_SIX_WEEKS) {
                payable(beneficiary).transfer(privateSaleBalances[beneficiary] / 2); // 6 * 5 
                privateSaleBalances[beneficiary] -= privateSaleBalances[beneficiary] / 5;
            } else {
                payable(beneficiary).transfer(privateSaleBalances[beneficiary]);
            }
        }
    }
}