// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.2 < 0.9.0;

import "./BsmToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/DateChecker.sol";
import "./Staking.sol"; // 스테이킹 컨트랙트 import
import "hardhat/console.sol";


interface IStakingContract {
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lastClaimTimestamp;
    }
    function getStakeDetails(address staker) external view returns (Stake memory);
}

contract Reward {
    BSM public bistroToken;
    DateChecker public dateChecker;
    IStakingContract public stakingContract; // 스테이킹 컨트랙트 인터페이스

    struct Attendance { // 출석체크
        uint[] dates;
        uint8 consecutive;
    }
    struct Review {
        address writer; // 글쓴이
        string title; // 제목
        string content; // 내용 
        uint serialNumber; // 일련번호(ID)
        uint votes; // 받은 투표 수
        address[] votedBy; // 투표한 계정 목록
        uint publishedAt; // publish 날짜
        string restaurant; // 레스토랑 이름
        int32 longitude; // 경도
        int32 latitude; // 위도
        bool elected; // top review로 선정되었는지 여부 
    }

   mapping(uint => Review) public reviews;
    mapping(address => Attendance) public userAttendance;
    mapping(address => uint[]) public userVotedFor;

    mapping(address => Review[]) public reviewsPerAccount; // account가 작성한 리뷰 검색
    uint public constant BSM_DECIMALS = 10 ** 18; // 18 decimals for BSM
    uint public constant VOTE_COST = 3 * BSM_DECIMALS; // 투표 시 지급해야할 3 BSM
    uint public constant REWARDS_FOR = 5; // 상위 5개 리뷰를 작성한 리뷰어에게 보상 지급
    uint public lastReviewNumbers;
    uint public reviewNumbers;
    uint public lastRewardAt;
    address owner;

    event Published(address indexed user, uint256 reviewNumber);
    event Voted(address indexed user, uint256 reviewNumber, uint votes);
    event AttendanceMarked(address indexed user, uint256 timestamp);

    constructor(address _bistroTokenAddress, address _stakingContractAddress, address _dateCheckerContractAddress) {
        bistroToken = BSM(_bistroTokenAddress);
        stakingContract = IStakingContract(_stakingContractAddress);
        dateChecker = DateChecker(_dateCheckerContractAddress);
        owner = msg.sender;
    }

    fallback() external {}
    receive() external payable {}

    // 내림차순 정렬 및 상위 5개 중 투표 10개 이상 받은 리뷰만 반환.
    function sort(Review[] memory arr) public view returns(Review[] memory){
        // uint minimumVotes = 10;
        if (arr.length == 0) {
           return arr;
        } else {
            for (uint i = lastReviewNumbers; i < reviewNumbers; i++) {
                for (uint j = i + 1; j < arr.length; j++) {
                    if (arr[i].votes < arr[j].votes) {
                        (arr[i], arr[j]) = (arr[j], arr[i]);
                    }
                }
            }

            Review[] memory topReviews = new Review[](REWARDS_FOR);
            for (uint i = 0; i < REWARDS_FOR; i++) {
                topReviews[i] = arr[i];
                topReviews[i].elected = true;
            }
        return topReviews;
        }
    }

    function mintReward() public {
        require(msg.sender == owner, "Only the owner can mint rewards");
        require(block.timestamp >= lastRewardAt + 4 weeks, "Minting can only occur every 4 weeks");

        // Mint 30,000 BSM tokens for rewards (6,000BSM for each writer)
        bistroToken.mint(address(this), 30000 * BSM_DECIMALS);
    }

    function reward() public {
        require(block.timestamp >= lastRewardAt + 4 weeks, "can be done in 4 weeks from last reward"); // 마지막 집계 이후 4주가 지나야함
        uint newReviewCount = reviewNumbers - lastReviewNumbers;
        
        uint votesTotal = 0;
        Review[] memory collectedReviews = new Review[](newReviewCount);
        // Collect Reviews that have been written for the past 4 weeks
        for (uint i = 0; i < newReviewCount; i++) {
            collectedReviews[i] = reviews[lastReviewNumbers + i + 1];
            votesTotal += reviews[lastReviewNumbers + i + 1].votes;
        }

        // Get top 5 reviews that has more than 10 votes
        Review[] memory topReviews = sort(collectedReviews);
        require(topReviews.length > 0, "No reviews");

        // Iterate through the top reviews and get number of voters to give rewards
        uint votersToReward = 0;
        for (uint i = 0; i < topReviews.length; i++) {            
            votersToReward += topReviews[i].votedBy.length;
        }

        // Split the rewards among voters of all selected reviews
        uint rewardPerVoter = votesTotal * 3 * BSM_DECIMALS / votersToReward;

        for (uint i = 0; i < topReviews.length; i++) {
            // Transfer rewards to top review writers - 리뷰당 6,000 BSM
            address writer = topReviews[i].writer;
            bistroToken.transfer(writer, 6000 * BSM_DECIMALS);

            // Transfer rewards to each voter - votes로 쌓인 보상 나눠갖기
            for (uint j = 0; j < topReviews[i].votedBy.length; j++) {
                address voter = topReviews[i].votedBy[j];

                bistroToken.transfer(voter, rewardPerVoter);
            }
        }
        // Update the last reward date
        lastRewardAt = block.timestamp;
        lastReviewNumbers = reviewNumbers;
    }

    function publish(string memory title, string memory restaurant, string memory content, int32 longitude, int32 latitude) public {
        // 500자 이상,
        uint serialNumber = reviewNumbers + 1;
        reviewNumbers += 1;
        Review memory review;
        review.writer = msg.sender;
        review.serialNumber = serialNumber;
        review.title = title;
        review.content = content;
        review.votes = 0;
        review.publishedAt = block.timestamp;
        review.restaurant = restaurant;
        review.longitude = longitude;
        review.latitude = latitude;

        reviews[serialNumber] = review; // mapping
        reviewsPerAccount[msg.sender].push(review);

        emit Published(msg.sender, serialNumber);
    }

    function getReviewsWrittenBySender() public view returns(Review[] memory) {
        return reviewsPerAccount[msg.sender];
    } 
    function getReview(uint serialNumber) public view returns (
        address writer,
        string memory title,
        string memory content,
        uint votes,
        address[] memory votedBy,
        uint publishedAt,
        string memory restaurant,
        int32 longitude,
        int32 latitude
    ) {
        Review storage review = reviews[serialNumber];
        return (
            review.writer,
            review.title,
            review.content,
            review.votes,
            review.votedBy,
            review.publishedAt,
            review.restaurant,
            review.longitude,
            review.latitude
        );
    }

    function getUserAttendance() public view returns(Attendance memory) {
        return userAttendance[msg.sender];
    }

    function markAttendance() public {
        Attendance storage attendance = userAttendance[msg.sender];
        uint[] storage calendar = attendance.dates;

        
        if (calendar.length >= 1 ) {
            require(dateChecker.isToday(calendar[calendar.length - 1]) == false, "Today's attendance checked");
        }


        // 스테이킹 여부 확인
        require(stakingContract.getStakeDetails(msg.sender).amount >= 1000 * BSM_DECIMALS, "Minimum staking amount not met");

        calendar.push(block.timestamp);
        
        if (dateChecker.isYesterday(userAttendance[msg.sender].dates[userAttendance[msg.sender].dates.length - 1]) == true) {
            userAttendance[msg.sender].consecutive += 1;
        } else {
            userAttendance[msg.sender].consecutive = 1;
        }

        uint attendanceReward = BSM_DECIMALS / 10;
        if (userAttendance[msg.sender].consecutive == 28) {
            attendanceReward += BSM_DECIMALS;
            userAttendance[msg.sender].consecutive = 0;
        } else if (userAttendance[msg.sender].consecutive == 7 || userAttendance[msg.sender].consecutive == 14 || userAttendance[msg.sender].consecutive == 21) {
            attendanceReward += BSM_DECIMALS * 3 / 10;
        }

        bistroToken.mint(msg.sender, attendanceReward);
        emit AttendanceMarked(msg.sender, block.timestamp);
    }

    function vote(uint serialNumber) public {
        Review storage rv = reviews[serialNumber];
        require(rv.writer != msg.sender, "Voter can't vote for the her or his review.");

        // 스테이킹 여부 확인
        require(stakingContract.getStakeDetails(msg.sender).amount >= 1000 * BSM_DECIMALS, "Minimum staking amount not met");
        // bistroToken.approve(address(this), VOTE_COST); // 이거 한거 아닌가 ? 
        require(bistroToken.transferFrom(msg.sender, address(this), VOTE_COST), "Transfer of BSM failed");
        rv.votes = rv.votes + 1;
        reviews[serialNumber].votedBy.push(msg.sender);

        emit Voted(rv.writer, serialNumber, rv.votes);
        userVotedFor[msg.sender].push(serialNumber);
    }
}