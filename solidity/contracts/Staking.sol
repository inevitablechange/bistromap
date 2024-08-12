// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./ERC20.sol"; // BSM 컨트랙트를 import합니다.

contract StakingContract {
    BSM public BSMToken;
    
    uint256 public constant MINIMUM_STAKE = 1000 * 1e18; // 1000 BSM
    uint256 public constant MINIMUM_STAKE_PERIOD = 24 weeks;
    uint256 public constant FIXED_APR = 12; // 12% 고정 APR
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60; // 1년 초

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

        Stake storage userStake = stakes[msg.sender];
        
        if (userStake.amount > 0) {
            _claim(); // 기존 스테이크가 있으면 클레임합니다.
        }
        
        userStake.amount += _amount;
        userStake.timestamp = block.timestamp;
        userStake.lastClaimTimestamp = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake() external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.timestamp + MINIMUM_STAKE_PERIOD, "Minimum stake period not met");

        uint256 reward = calculateReward(msg.sender);
        uint256 amount = userStake.amount;
        totalStaked -= amount;
        delete stakes[msg.sender];

        // 보상을 민트하고 스테이킹한 금액을 반환합니다.
        BSMToken.mint(msg.sender, reward);
        require(BSMToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
        emit Claimed(msg.sender, reward); // 클레임 이벤트
    }
    
    function _claim() internal {
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
        uint256 apr = FIXED_APR; // 고정 APR 12%

        // APR을 연간 비율로 변환
        uint256 reward = (userStake.amount * apr * stakingDuration) / (SECONDS_PER_YEAR * 100);

        return reward;
    }
}
