// SPDX-License-Identifier: GPL-3.0

pragma solidity >= 0.8.2 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BSM is ERC20, Ownable(msg.sender) {
    // '0xdAC17F958D2ee523a2206206994597C13D831ec7' // 1) usdt 불러오기. 
    IERC20 public usdtToken; // USDT token contract

    uint private constant _initialSupply = 2100000 * 10 ** 18; // 2.1 million tokens with 18 decimals
    uint public constant PRICE_PER_TOKEN = 5 * 10 ** 4; // 0.1 USDT per BSM token 2)presale의 경우 좀 더 저렴하게
    
    uint public constant TWENTY_FOUR_WEEKS = 24 weeks;
    uint public constant FORTY_EIGHT_WEEKS = 48 weeks;
    uint public constant NINETY_SIX_WEEKS = 96 weeks;
    uint public soldAmount;

    uint public constant privateSalesLimitPerBeneficiary = 100000;
    uint public preSaleCap; // 계정당 넣을 수 있는 최대 양
    uint public presalePeriod = 2 weeks;
    uint private presaleOn;
    
    mapping(address => uint) private balances;

    mapping(address => uint) private _released;
    address[] beneficiaries;
    
    constructor(uint _presaleOn) ERC20("Bistro", "BSM") {
        _mint(address(this), _initialSupply);
        preSaleCap = _initialSupply;
        presaleOn = _presaleOn;
    }

    function buyPrivateSale(address beneficiary, uint amount) external {
        require((soldAmount + amount) <= preSaleCap, string(abi.encodePacked("Only ", Strings.toString(preSaleCap - soldAmount), " BSM Available")));
        require(preSaleCap >= amount, "Not enough tokens for private sale");
        require(balances[beneficiary] + amount <= privateSalesLimitPerBeneficiary, "Private Sales Token amount cannot exceed 100000"); 
        uint cost = (amount * PRICE_PER_TOKEN) / 10 ** 6; // Calculate the cost in USDT
        require(usdtToken.transferFrom(msg.sender, address(this), cost), "USDT transfer failed");
        balances[beneficiary] += amount;
        preSaleCap -= amount;
        soldAmount += amount;
        
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function release() external {
            // 20 % -> 6개월 후, 30 % => 12개월 후 50% => 24개월 후
            uint elapsedTime = block.timestamp - (presaleOn + 2 weeks);
            require(elapsedTime >= 24 weeks, "Released after 6 months of private sales");
            for (uint i = 0; i < beneficiaries.length; i++) {
                address beneficiary = beneficiaries[i];
                if (elapsedTime < FORTY_EIGHT_WEEKS) {
                    payable(beneficiary).transfer(balances[beneficiary] / 5);
                    balances[beneficiary] -= balances[beneficiary] / 5;
                } else if (elapsedTime < NINETY_SIX_WEEKS) {
                    payable(beneficiary).transfer(balances[beneficiary] / 2);
                    balances[beneficiary] -= balances[beneficiary] / 2;
                } else {
                    payable(beneficiary).transfer(balances[beneficiary]);
                }
            }
    }
} 