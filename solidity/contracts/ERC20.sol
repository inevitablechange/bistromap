// SPDX-License-Identifier: GPL-3.0

pragma solidity >= 0.8.2 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BSM is ERC20, Ownable(msg.sender) {
    // '0xdAC17F958D2ee523a2206206994597C13D831ec7' // 1) usdt 불러오기. 
    IERC20 public usdtToken; // USDT token contract

    uint public constant BISTRO_DECIMALS = 10 ** 18;
    uint private constant _initialSupply = 2100000 * BISTRO_DECIMALS; // 2.1 million tokens with 18 decimals
    uint public constant TWENTY_FOUR_WEEKS = 24 weeks;
    uint public constant FORTY_EIGHT_WEEKS = 48 weeks;
    uint public constant NINETY_SIX_WEEKS = 96 weeks;
    uint public soldAmount;

    uint public constant preSalesLimitPerBeneficiary = 100000 * BISTRO_DECIMALS; // BISTRO_DECIMALS hal = 0.05 usdt( 10 ** 6)
    uint public preSaleCap; // 계정당 넣을 수 있는 최대 양
    uint public constant PRICE_PER_TOKEN_PRESALE = 5  * 10 ** 4; // 100개를 산다고 했을떄, (100 * 5  * 10 ** 4)  Presale의 경우 1/2 저렴하게 판매 (presale price: 0.05 usdt)

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
    function setUSDTToken(address _usdtToken) external onlyOwner {
        usdtToken = IERC20(_usdtToken);
    }
    function buyPrivateSale(uint amount) external {
        require(block.timestamp <= presaleOn + 2 weeks, "presale is over");
        require(preSaleCap >= soldAmount + amount, string(abi.encodePacked("Only ", Strings.toString(preSaleCap - soldAmount), " BSM Available")));
        require(balances[msg.sender] + amount <= preSalesLimitPerBeneficiary, "Pre-Sales Token amount cannot exceed 100000"); 
        uint cost = (amount * PRICE_PER_TOKEN_PRESALE) / BISTRO_DECIMALS ; // Calculate the cost in USDT
        require(usdtToken.balanceOf(msg.sender) >= cost, "need more USDT");

        require(usdtToken.transferFrom(msg.sender, address(this), cost), "failed transfer"); // usdtToken을 msg.sender -> contract로 보냄.
        if(balances[msg.sender] == 0) {
            beneficiaries.push(msg.sender);
        }
        balances[msg.sender] += amount;
        soldAmount += amount;
    }

    function getBalance(address addr) public view returns(uint){
        return balances[addr];
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