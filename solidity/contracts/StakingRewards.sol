// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./BsmToken.sol";

contract StakingContract_TEST {
    BSM public BSMToken;
    
    uint256 public constant MINIMUM_STAKE = 1000 * 1e18; // 1000 BSM
    uint256 public constant MINIMUM_STAKE_PERIOD = 24 weeks;
    uint256 public constant MAX_APY = 12; // 12% ==> 계산 필요

    struct Staker {
        uint256 amount;
        uint256 rewards;
        uint256 lastRewardedBlock;
        uint256 unlockTime;
    }

    using SafeERC20 for BSM;
    using EnumerableSet for EnumerableSet.AddressSet;

    BSM public rewardToken;

    uint256 public rewardPerBlock;
    uint256 public totalStaked;

    uint256 public constant SHARE_PRECISION = 1e12;

    EnumerableSet.AddressSet private _stakerList;
    mapping(address => Staker) private _stakers;
    
    //Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    constructor(
        address _rewardToken,
        uint256 _rewardPerblock
    ) {
        rewardToken = BSM(_rewardToken);
        rewardPerBlock = _rewardPerblock;
    }

    /**
     * @notice must approve stake token first
     * @dev stake tokens
    */
    function deposit(uint256 _amount) public {
        require(_amount > 0, "shoud deposit non-zero value");

        Staker storage staker = _stakers[msg.sender];
        
        // Deposit stake token to this contract
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Update Rewards of all stakers
        _updateRewards();

        // Update staker information
        if(!_stakerList.contains(msg.sender)) {
            _stakerList.add(msg.sender);
            staker.lastRewardedBlock = block.number;
        }
        staker.amount += _amount;
        staker.unlockTime = block.timestamp + 24 weeks;
        totalStaked += _amount;
        emit Deposit(msg.sender, _amount);

    }

    /**
     * @dev withdraw all tokens and claim rewards
     */

    function withdraw() public {
        require(_stakers[msg.sender].unlockTime > block.timestamp, "cannot withdraw yet");
        Staker storage staker = _stakers[msg.sender];
        uint256 withdrawal = staker.amount;
        require(withdrawal > 0, "cannot withdraw zero value");

        // Claim rewards
        claim();

        // Update staker info
        staker.amount -= withdrawal;
        totalStaked -= withdrawal;
        _stakerList.remove(msg.sender);

        // Withdraw
        rewardToken.safeTransfer(msg.sender, withdrawal);
        emit Withdraw(msg.sender, withdrawal);
    }

    /**
     * @dev claim accumulated rewards
     */
    function claim() public {
        require(_stakerList.contains(msg.sender), "staker does not exist");

        Staker storage staker = _stakers[msg.sender];
        require(staker.amount > 0, "should stake more than 0");

        // Update rewards of all stakers
        _updateRewards();

        // Claim rewards
        uint256 claimed = staker.rewards;
        staker.rewards = 0;
        rewardToken.mint(msg.sender, claimed);

        emit Claim(msg.sender, claimed);
    }

    function updateRewards() public {
        _updateRewards();
    }
    
    function calculateAPY() public view returns (uint256) {
        if (totalStaked == 0) return MAX_APY;
        
        uint256 apy = (MAX_APY * MINIMUM_STAKE) / totalStaked;
        return apy > MAX_APY ? MAX_APY : apy;
    }
    
    function canVote(address _user) external view returns (bool) {
        return _stakers[_user].amount >= MINIMUM_STAKE;
    }

    /** 
     * @notice must call updateRewards() first to check current pending rewards
    */
    function getPendingRewards(address _staker) public view returns (uint256) {
        require(_stakerList.contains(_staker), "staker does not exist");
        return _stakers[_staker].rewards;
    }

    function getStakingAmount(address _staker) public view returns (uint256) {
        return _stakers[_staker].amount;
    }

    function getStakingShares(address _staker) public view returns (uint256) {
        require(_stakerList.contains(_staker), "staker does not exist");
        return (_stakers[_staker].amount * SHARE_PRECISION) / totalStaked / SHARE_PRECISION;
    }

    /**
     * @dev loop over all stakers and updatae their rewards according to relative shares and period
     */
    function _updateRewards() private {
        for (uint256 i=0; i<_stakerList.length();i++) {
            Staker storage staker = _stakers[_stakerList.at(i)];
            uint256 stakerShare = (staker.amount * SHARE_PRECISION) / totalStaked;
            uint256 rewardPeriod = block.number - staker.lastRewardedBlock;
            uint256 rewards = (rewardPeriod * rewardPerBlock * stakerShare) / SHARE_PRECISION;

            staker.lastRewardedBlock = block.number;
            staker.rewards += rewards;
        }
    }
}
