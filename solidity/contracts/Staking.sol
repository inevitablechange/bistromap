// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./BsmToken.sol"; // BSM 컨트랙트를 import합니다.

contract StakingContract {
    BSM public BSMToken;

    uint256 public constant MINIMUM_STAKE_AMOUNT = 1 * 1e18; // 1 BSM
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
    
    function getStakeDetails(address staker) external view returns (Stake memory) {
            return stakes[staker];
    }
    
    function stake(uint256 _amount) external {
        require(_amount >= MINIMUM_STAKE_AMOUNT, "Stake amount too low");

        Stake storage userStake = stakes[msg.sender];
        
        if (userStake.amount == 0) {
            // 새 스테이킹인 경우에만 타임스탬프 설정
            userStake.timestamp = block.timestamp;
        } else {
            // 기존 스테이킹이 있는 경우, 타임스탬프 업데이트
            userStake.lastClaimTimestamp = block.timestamp;
        }

        require(BSMToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        userStake.amount += _amount; // 기존 금액에 새로운 스테이킹 추가
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
        if (reward > 0) {
            BSMToken.mint(msg.sender, reward);
            emit Claimed(msg.sender, reward); // 클레임 이벤트
        }

        require(BSMToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }
    
    function _claim() internal {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");

        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            BSMToken.mint(msg.sender, reward); // 보상을 민트하여 사용자에게 전송합니다.
            emit Claimed(msg.sender, reward); // 보상 청구 이벤트 발생
        }

        // 마지막 클레임 시간을 현재로 업데이트합니다.
        userStake.lastClaimTimestamp = block.timestamp;
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
