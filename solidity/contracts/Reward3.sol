// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./BsmToken.sol"; // BSM 컨트랙트를 import합니다.

contract Reward3{
        BSM public bistroToken;
            uint public lastReviewNumbers;
    uint public reviewNumbers;
    uint public lastRewardAt;
    struct Review {
        address writer; // 글쓴이
        string title; // 제목
        string content; // 내용 
        uint serialNumber; // 일련번호(ID)
        uint votes; // 받은 투표 수
        address[] votedBy; // 투표한 계정 목록
        uint publishedAt; // publish 날짜
        string restaurant; // 레스토랑 이름
        uint longitude; // 경도
        uint latitude; // 위도
        bool expired; // 집계가 끝났는지 여부
    }

        event Published(address indexed user, uint256 reviewNumber);
  mapping(uint => Review) public reviews; 
        constructor(address _bistroTokenAddress) {
        bistroToken = BSM(_bistroTokenAddress);
        // lastRewardAt = block.timestamp; // 초기화
    }

        function publish(string memory title, string memory restaurant, string memory content, uint longitude, uint latitude) public {
        // 500자 이상,
        uint serialNumber = reviewNumbers + 1;
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

        emit Published(msg.sender, reviewNumbers);
    }
}