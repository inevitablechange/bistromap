// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.2 < 0.9.0;
import "./ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/DateChecker.sol";

contract Reward {
    BSM public bistroToken;   
    DateChecker dateChecker;
    struct Attendance { // 출석체크
        uint[] dates; // timestamp 의 어레이
        uint consecutive; // 연속 출석한 날짜. 연속 실패시 0으로 리셋
    }
    struct Review {
        address writer; // 글쓴이
        uint serialNumber; // 일련번호(ID)
        uint votes; // 받은 투표 수
        address[] votedBy; // 투표한 계정 목록
        uint publishedAt; // publish 날짜
        string restaurant; // 레스토랑 이름
        uint longitude; // 경도
        uint latitude; // 위도
        bool expired; // 집계가 끝났는지 여부
    }

    mapping(uint => Review) public reviews; // ID로 리뷰 검색
    mapping(address => Attendance) public  userAttendance; // address로 유저의 출석 검색
    mapping(address => uint[]) userVotedFor;
    uint public constant BSM_DECIMALS = 10 ** 18; // 18 decimals for BSM
    uint public constant VOTE_COST = 3 * BSM_DECIMALS; // 투표 시 지급해야할 3 BSM
    uint public constant REWARDS_FOR = 5; // 상위 5개 리뷰를 작성한 리뷰어에게 보상 지급
    uint public lastReviewNumbers;
    uint public reviewNumbers;
    uint public lastRewardAt;

    event Published(address indexed user, uint256 reviewNumber);

    constructor(address _bistroTokenAddress) {
        bistroToken = BSM(_bistroTokenAddress);
        lastRewardAt = block.timestamp; // 초기화
    }

    fallback() external {}
    receive() external payable {}

    // 내림차순 정렬 및 상위 5개 중 투표 10개 이상 받은 리뷰만 반환.
    function sort(Review[] memory arr) public view returns(Review[] memory){
        uint minimumVotes = 10;
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
            // find index;]
            uint leng;
            for (uint i = 0; i < arr.length; i++) {
                if (arr[i].votes >= minimumVotes) {
                    leng++;
                } else {
                    break;
                }
            }
            Review[] memory topReviews = new Review[](leng);
            for (uint i = 0; i < leng; i++) {
                topReviews[i] = arr[i];
            }
        return topReviews;
        }
    }

    function reward() public {
        require(block.timestamp >= lastRewardAt + 4 weeks); // 마지막 집계 이후 4주가 지나야함
        uint newReviewCount = reviewNumbers - lastReviewNumbers;
        Review[] memory collectedReviews = new Review[](newReviewCount);
        for (uint i = 0; i < newReviewCount; i++) {
            reviews[lastReviewNumbers + i].expired = true;
            collectedReviews[i] = reviews[lastReviewNumbers + i];
        }
        Review[] memory topReviews = sort(collectedReviews);
        require(topReviews.length > 0, "No reviews");

        uint votersToReward; // 보상을 받을 투표자의 수
        
        for (uint i = 0; i < topReviews.length; i++) {
            // bistroToken.mint(topReviews[i].writer, BSM_DECIMALS * 6000);
            votersToReward += topReviews[i].votedBy.length;
        }
        uint rewardPerVoter = address(this).balance / votersToReward; // total / votersToReward 
        
        for (uint i = 0; i < topReviews.length; i++) { 
            for (uint j = 0; j < topReviews[i].votedBy.length; j++) {
                payable(topReviews[i].votedBy[j]).transfer(rewardPerVoter);
            }
        }

        lastRewardAt = block.timestamp;
        lastReviewNumbers = reviewNumbers;
    }

    function publish(string memory restaurant, uint longitude, uint latitude) public {
        // 1000자 이상, 사진은 추후 추가.
        uint serialNumber = reviewNumbers + 1;
        Review memory review;
        review.writer = msg.sender;
        review.serialNumber = serialNumber;
        review.votes = 0;
        review.publishedAt = block.timestamp;
        review.restaurant = restaurant;
        review.longitude = longitude;
        review.latitude = latitude;

        reviews[serialNumber] = review; // mapping

        emit Published(msg.sender, reviewNumbers);
    }
    
    event Voted(address indexed user, uint256 reviewNumber);

    function vote(uint serialNumber) public { // staking 1000 bsm require 조건 필요
        Review storage rv = reviews[serialNumber];
        require(rv.writer != msg.sender, "Voter can't vote for the her or his review.");
        require(bistroToken.transferFrom(msg.sender, address(this), VOTE_COST), "Transfer of BSM failed");
        rv.votes = rv.votes + 1;
        reviews[serialNumber].votedBy.push(msg.sender);

        emit Voted(msg.sender, serialNumber);

        userVotedFor[msg.sender].push(serialNumber);
    }

    event AttendanceMarked(address indexed user, uint256 timestamp);

    function markAttendance() public { // 고쳐야함.
        uint[] storage calendar = userAttendance[msg.sender].dates;
        require(dateChecker.isToday(block.timestamp) == false, "Today's attendance checked");
        userAttendance[msg.sender].dates.push(block.timestamp);
        if (calendar.length == 0) {
            calendar.push(block.timestamp);
        } else if (dateChecker.isYesterday(calendar[calendar.length - 1]) == true) { // 마지막 날짜가 오늘이면 안되고 반드시 어제어야 함
            userAttendance[msg.sender].consecutive++;
        } else {
            userAttendance[msg.sender].consecutive = 0;
        }
        uint attendanceReward = BSM_DECIMALS / 10;
        if (userAttendance[msg.sender].consecutive == 28) {
            attendanceReward += BSM_DECIMALS;
            userAttendance[msg.sender].consecutive = 0;
        } else if (userAttendance[msg.sender].consecutive == 7 || userAttendance[msg.sender].consecutive == 14 || userAttendance[msg.sender].consecutive == 21) {
            attendanceReward += BSM_DECIMALS * 3 / 10 ;
        }

        bistroToken.mint(msg.sender, attendanceReward);
        emit AttendanceMarked(msg.sender, block.timestamp);
    }
}