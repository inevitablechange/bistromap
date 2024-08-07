// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./ERC20.sol"; // BSM 컨트랙트를 import합니다.

contract StakingContract {
    BSM public BSMToken;
    
    uint256 public constant MINIMUM_STAKE = 1000 * 1e18; // 1000 BSM
    uint256 public constant MINIMUM_STAKE_PERIOD = 24 weeks;
    uint256 public constant FIXED_APY = 12; // 12% 고정 APY

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lastClaimTimestamp;
    }
    
    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    
    constructor(address _BSMToken) {
        BSMToken = BSM(_BSMToken);
    }
    
    function stake(uint256 _amount) external {
        require(_amount >= MINIMUM_STAKE, "Stake amount too low");
        require(BSMToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        
        if (stakes[msg.sender].amount > 0) {
            claim();
        }
        
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].lastClaimTimestamp = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake() external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.timestamp + MINIMUM_STAKE_PERIOD, "Minimum stake period not met");
        
        claim();
        
        uint256 amount = userStake.amount;
        totalStaked -= amount;
        delete stakes[msg.sender];
        
        require(BSMToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claim() public {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No reward to claim");
        
        userStake.lastClaimTimestamp = block.timestamp;
        
        BSMToken.mint(msg.sender, reward);
        
        emit Claimed(msg.sender, reward);
    }
    
    function calculateReward(address _user) public view returns (uint256) {
        Stake memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.lastClaimTimestamp;
        uint256 apy = calculateAPY(); // 연간 APY 비율, 예: 12%

        // APY를 연간 비율에서 초 단위 비율로 변환
        uint256 annualRewardRate = apy * 1e18; // 1e18을 곱하여 소수점 자릿수 맞춤
        uint256 secondsPerYear = 365 days; // 초 단위 연간 기간

        // 보상 계산
        uint256 reward = (userStake.amount * annualRewardRate * stakingDuration) / (secondsPerYear * 1e18);

        return reward;
    }


    
    function calculateAPY() public view returns (uint256) {
        if (totalStaked == 0) return MAX_APY;
        
        uint256 apy = (MAX_APY * MINIMUM_STAKE) / totalStaked;
        return apy > MAX_APY ? MAX_APY : apy;
    }
    
    function canVote(address _user) external view returns (bool) {
        return stakes[_user].amount >= MINIMUM_STAKE;
    }
}
