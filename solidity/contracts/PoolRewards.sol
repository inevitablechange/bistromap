// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./BsmToken.sol";


contract PoolRewards {
    struct Staker {
        uint256 amount;
        uint256 rewards;
        uint256 lastRewardedBlock;
    }

    using SafeERC20 for IERC20;
    using SafeERC20 for BSM;
    using EnumerableSet for EnumerableSet.AddressSet;

    IERC20 public stakeToken;
    BSM public rewardToken;

    uint256 public rewardPerBlock; // Reward token amount per block (block마다 staker의 수가 달라지므로 day로 계산하기에는 어려움이 있음)
    uint256 public totalStaked; // Total amount of tokens staked
    
    uint256 public constant SHARE_PRECISION = 1e12;

    EnumerableSet.AddressSet private _stakerList;
    mapping(address => Staker) private _stakers;
    

    //Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    constructor(
        address _stakeToken,
        address _rewardToken,
        uint256 _rewardPerblock
    ) {
        stakeToken = IERC20(_stakeToken);
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
        stakeToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Update Rewards of all stakers
        _updateRewards();

        // Update staker information
        if(!_stakerList.contains(msg.sender)) {
            _stakerList.add(msg.sender);
            staker.lastRewardedBlock = block.number;
        }
        staker.amount += _amount;
        totalStaked += _amount;
        emit Deposit(msg.sender, _amount);

    }

    /**
     * @dev withdraw all tokens and claim rewards
     */

    function withdraw() public {
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
        stakeToken.safeTransfer(msg.sender, withdrawal);
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