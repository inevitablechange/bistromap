// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.2 < 0.9.0;
import "./ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/DateChecker.sol";

contract Reward {
    IERC20 public bistroToken;   

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

    mapping(uint => Review) reviews; // ID로 리뷰 검색
    mapping(address => Attendance) userAttendance; // address로 유저의 출석 검색
    mapping(address => uint[]) userVotedFor;
    uint public constant BSM_DECIMALS = 10 ** 18; // 18 decimals for BSM
    uint public constant VOTE_COST = 3 * BSM_DECIMALS; // 투표 시 지급해야할 3 BSM
    uint public constant REWARDS_FOR = 5; // 상위 5개 리뷰를 작성한 리뷰어에게 보상 지급
    uint reviewNumbers;
    uint lastRewardAt;
    uint rewardBalance;

    constructor(address _bistroTokenAddress) {
        bistroToken = BSM(_bistroTokenAddress);
        lastRewardAt = block.timestamp; // 초기화
    }

    fallback() external {}
    receive() external payable {}

    // 내림차순 정렬 및 상위 5개 반환.
    function sort(uint[] calldata arr) public pure returns(uint[] memory){
        if (arr.length == 0) {
           return arr;
        } else {
            for (uint i = lastCalculatedSerialNumber; i < reviewNumbers; i++) {
                for (uint j = i + 1; j < arr.length; j++) {
                    if (arr[i].votes < arr[j].votes) {
                        (arr[i], arr[j]) = (arr[j], arr[i]);
                    }
                }
            }
            return arr.slice(0,5);
        }
    }

    function reward() public {
        require(block.timestamp >= lastRewardAt + 4 weeks); // 마지막 집계 이후 4주가 지나야함
        uint newReviewCount = reviewNumbers - lastCalculatedSerialNumber;
        uint[] collectedReviews = uint[](newReviewCount);
        for (uint i = 0; i < newReviewCount; i++) {
            reviews[lastCalculatedSerialNumber + i].expired = true;
            collectedReviews[i] = reviews[lastCalculatedSerialNumber + i];
        }
        Reviews[] topReviews = sort(collectedReviews);

        uint votersToReward; // 보상을 받을 투표자의 수
        
        for (uint i = 0; i < topReviews.length; i++) {
            bistroToken.mint(topReviews[i].writer, BSM_DECIMALS * 6000)
            votersToReward += topReview[i].votedBy.length;
        }
        uint rewardPerVoter = address(this).balance / votersToReward; // total / votersToReward 
        
        for (uint i = 0; i < topReviews.length; i++) { 
            for (uint j = 0; j < topReview[i].votedBy.length; j++) {
                payable(topReview[i].votedBy[j]).transfer(rewardPerVoter);
            }
        }

        lastRewardAt = block.timestamp;
        lastCalculatedSerialNumber = reviewNumbers;
    }

    function publish(string memory restaurant, uint longitude, uint latitude) public {
        // 1000자 이상, 사진은 추후 추가.
        Review review = Review(msg.sender, reviewNumbers + 1, 0, block.timestamp, category, restaurant, longitude, latitude, false);
        uint serialized = reviewNumbers++;
        reviews[serialized] = review; // mapping
    }
    
    event Voted(address indexed user, uint256 reviewNumber);

    function vote(uint serialNumber) public {
        Review rv = reviews[serialNumber];
        require(bistroToken.transferFrom(msg.sender, address(this), VOTE_COST), "Transfer of BSM failed");
        rv.votes++;
        reviews[serialNumber].votedBy.push(msg.sender);

        emit Voted(msg.sender, serialNumber);

        userVotedFor[msg.sender].push(serialNumber);
    }

    event AttendanceMarked(address indexed user, uint256 timestamp);

    function markAttendance() public { // 고쳐야함.
        uint[] calendar = userAttendance[msg.sender].dates;
        require(!DateChecker.isToday(block.timestamp), "Today's attendance checked");
        calendar.push(block.timestamp);
        if (calendar.length == 0) {
            calendar.push(block.timestamp);
        } else if (DateChecker.isYesterday(calendar[calendar.length - 1])) { // 마지막 날짜가 오늘이면 안되고 반드시 어제어야 함
            userAttendance[msg.sender].consecutive++;
        } else {
            userAttendance[msg.sender].consecutive = 0;
        }
        uint attendanceReward = BSM_DECIMALS / 10;
        if (userAttendance[msg.sender].consecutive == 28) {
            attendanceReward += BSM_DECIMALS;
            userAttendance[msg.sender].consecutive = 0
        } else if (userAttendance[msg.sender].consecutive == 7 || userAttendance[msg.sender].consecutive == 14 || userAttendance[msg.sender].consecutive == 21) {
            attendanceReward += BSM_DECIMALS * 3 / 10 ;
        }

        bistroToken.mint(msg.sender, attendanceReward);
        emit AttendanceMarked(user, block.timestamp);
    }
}