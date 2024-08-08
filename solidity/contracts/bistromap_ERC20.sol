// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BSM is ERC20("Bistro", "BSM"), Ownable(msg.sender) {

    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (MasterChef).
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    IERC20 public usdtToken; // USDT token contract

    uint private constant _initialSupply = 2100000 * 10 ** 18; // Presale Amount = 2.1 million tokens with 18 decimals
    uint public constant PRICE_PER_TOKEN_PRESALE = 5 * 10 ** 4; // Presale의 경우 1/2 저렴하게 판매
    
    uint public constant TWENTY_FOUR_WEEKS = 24 weeks;
    uint public constant FORTY_EIGHT_WEEKS = 48 weeks;
    uint public constant NINETY_SIX_WEEKS = 96 weeks;

    uint public constant preSalesLimitPerBeneficiary = 100000;
    uint public presalePeriod = 2 weeks;
    uint public preSaleCap; // 2.1million tokens (배포 시 설정됨)
    uint public soldAmount;
    uint public presaleOn;
    
    address[] beneficiaries; //PreSale 참여자 리스트 
    mapping(address => uint) private balances; 
    uint[3] tokenReleased; //[0,0,0]으로 시작, 시기별로 토큰 release 여부 확인 위함
    
    constructor() {
        _mint(address(this), _initialSupply);
        preSaleCap = _initialSupply;
        presaleOn = block.timestamp;
    }

    //Presale 시즌 토큰 판매
    function buyPrivateSale(uint amount) external {
        require(block.timestamp <= presaleOn + 2 weeks, "presale is over");
        require(preSaleCap >= (soldAmount + amount), string(abi.encodePacked("Only ", Strings.toString(preSaleCap - soldAmount), " BSM Available")));
        require(balances[msg.sender] + amount <= preSalesLimitPerBeneficiary, "Pre-Sales Token amount cannot exceed 100000"); 
        uint cost = (amount * PRICE_PER_TOKEN_PRESALE) / 10 ** 6; // Calculate the cost in USDT
        require(usdtToken.balanceOf(msg.sender) >= cost, "need more USDT");

        usdtToken.transferFrom(msg.sender, address(this), cost);
        if(balances[msg.sender] == 0) {
            beneficiaries.push(msg.sender);
        } 
        balances[msg.sender] += amount;
        soldAmount += amount;
    }

    //Presale 이후 토큰 민팅 (컨트랙트 소유자만 실행 가능)
    function release() external onlyOwner{
        // 20 % -> 24주 후, 30 % => 48주 후 50% => 96주 후
        uint elapsedTime = block.timestamp - (presaleOn + 2 weeks);
        require(elapsedTime >= 24 weeks, "Released after 6 months of private sales");
        for (uint i = 0; i < beneficiaries.length; i++) {
            address beneficiary = beneficiaries[i];
            if (elapsedTime < FORTY_EIGHT_WEEKS && tokenReleased[0] == 0) {
                transfer(beneficiary, balances[beneficiary] * 2 / 10);
                balances[beneficiary] -= balances[beneficiary] * 2 / 10;
                tokenReleased[0] == 1;
            } else if (elapsedTime < NINETY_SIX_WEEKS && tokenReleased[1] == 0) {
                transfer(beneficiary, balances[beneficiary] * 3 / 10);
                balances[beneficiary] -= balances[beneficiary] * 3 / 10;
                tokenReleased[1] == 1;
            } else if (elapsedTime >= NINETY_SIX_WEEKS && tokenReleased[2] == 0) {
                transfer(beneficiary, balances[beneficiary] / 2);
                balances[beneficiary] -= balances[beneficiary] / 2;
                tokenReleased[2] == 1;
            }
        }
    }
} 