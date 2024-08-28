import { ethers } from "hardhat";
import { expect } from "chai";

import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("보상 지급 컨트랙트", function () {
  async function deployContractsFixture() {
    const [
      deployer,
      otherAccount1,
      otherAccount2,
      otherAccount3,
      otherAccount4,
      otherAccount5,
      otherAccount6,
    ] = await ethers.getSigners();

    const BSM = await ethers.getContractFactory("BSM");
    const bsm = await BSM.deploy(await time.latest());

    const DateChecker = await ethers.getContractFactory("DateChecker");
    const dateChecker = await DateChecker.deploy();

    const StakingContract = await ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContract.deploy(bsm.target);

    const RewardContract = await ethers.getContractFactory("Reward");
    const rewardContract = await RewardContract.deploy(
      bsm.target,
      stakingContract.target,
      dateChecker.target
    );

    // Mint some BSM tokens to users for voting
    await bsm.mint(otherAccount1.address, ethers.parseEther("10000"));
    await bsm.mint(otherAccount2.address, ethers.parseEther("10000"));
    await bsm.mint(otherAccount3.address, ethers.parseEther("10000"));
    await bsm.mint(otherAccount4.address, ethers.parseEther("10000"));
    await bsm.mint(otherAccount5.address, ethers.parseEther("10000"));
    await bsm.mint(otherAccount6.address, ethers.parseEther("10000"));

    return {
      deployer,
      otherAccount1,
      otherAccount2,
      otherAccount3,
      otherAccount4,
      otherAccount5,
      otherAccount6,
      bsm,
      dateChecker,
      stakingContract,
      rewardContract,
    };
  }

  describe("배포", function () {
    it("컨트랙트 배포 및 주소 확인", async function () {
      const { bsm, dateChecker, stakingContract, rewardContract } =
        await loadFixture(deployContractsFixture);

      console.log("Contract BSM Address: ", bsm.target);
      console.log("Contract DateChecker Address: ", dateChecker.target);
      console.log(
        "Contract Staking Contract Address: ",
        stakingContract.target
      );
      console.log("Contract Reward Contract Address: ", rewardContract.target);
    });
  });

  describe("리뷰 작성 기능 확인", function () {
    it("Should allow users to publish reviews", async function () {
      const { rewardContract, otherAccount1, otherAccount2 } =
        await loadFixture(deployContractsFixture);

      await rewardContract
        .connect(otherAccount1)
        .publish("Title1", "Restaurant1", "Content1", 1234, 5678);

      await rewardContract
        .connect(otherAccount2)
        .publish("Title2", "Restaurant2", "Content2", 4321, 8765);

      const review1 = await rewardContract.getReview(1);
      expect(review1.title).to.equal("Title1");
      expect(review1.writer).to.equal(otherAccount1.address);

      const review2 = await rewardContract.getReview(2);
      expect(review2.title).to.equal("Title2");
      expect(review2.writer).to.equal(otherAccount2.address);
    });
  });

  describe("스테이킹 후 투표 가능 여부 확인", function () {
    it("스테이킹 후 다른 사람이 쓴 글에 투표 가능 여부 확인", async function () {
      const {
        bsm,
        stakingContract,
        rewardContract,
        otherAccount1,
        otherAccount2,
      } = await loadFixture(deployContractsFixture);

      await rewardContract
        .connect(otherAccount1)
        .publish("Title1", "Restaurant1", "Content1", 1234, 5678);

      await rewardContract
        .connect(otherAccount2)
        .publish("Title2", "Restaurant2", "Content2", 4321, 8765);

      await bsm
        .connect(otherAccount1)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      //Vote를 위한 최소 조건 : 1000 BSM staking
      await stakingContract.connect(otherAccount1).stake(BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount1)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await rewardContract.connect(otherAccount1).vote(2); // User1 votes for User2's review

      const review1 = await rewardContract.reviews(2);
      expect(review1.votes).to.equal(1);

      const userBalance = await bsm.balanceOf(otherAccount1);
      const contractBalance = await bsm.balanceOf(rewardContract.target);

      expect(userBalance).to.equal(ethers.parseEther("8997")); // 3 BSM deducted
      expect(contractBalance).to.equal(BigInt(3 * 1e18));
    });

    it("본인 글에는 투표 못하게 하는 기능 잘 동작하는지 확인", async function () {
      const { bsm, stakingContract, rewardContract, otherAccount1 } =
        await loadFixture(deployContractsFixture);

      await rewardContract
        .connect(otherAccount1)
        .publish("Title1", "Restaurant1", "Content1", 1234, 5678);

      await bsm
        .connect(otherAccount1)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      //Vote를 위한 최소 조건 : 1000 BSM staking
      await stakingContract.connect(otherAccount1).stake(BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount1)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await expect(rewardContract.connect(otherAccount1).vote(1)).to.be
        .reverted;
    });
  });

  describe("보상 지급", function () {
    it("상위 5개 리뷰 구하는 Sort 함수 정상 작동 확인", async function () {
      const {
        bsm,
        stakingContract,
        rewardContract,
        otherAccount1,
        otherAccount2,
        otherAccount3,
        otherAccount4,
        otherAccount5,
        otherAccount6,
      } = await loadFixture(deployContractsFixture);

      //총 6개 리뷰 작성
      await rewardContract
        .connect(otherAccount1)
        .publish("Title1", "Restaurant1", "Content1", 1234, 5678);

      await rewardContract
        .connect(otherAccount2)
        .publish("Title2", "Restaurant2", "Content2", 4321, 8765);

      await rewardContract
        .connect(otherAccount3)
        .publish("Title3", "Restaurant3", "Content3", 4321, 8765);

      await rewardContract
        .connect(otherAccount4)
        .publish("Title4", "Restaurant4", "Content4", 4321, 8765);

      await rewardContract
        .connect(otherAccount5)
        .publish("Title5", "Restaurant5", "Content5", 4321, 8765);

      await rewardContract
        .connect(otherAccount6)
        .publish("Title6", "Restaurant6", "Content6", 4321, 8765);

      //스테이킹 위해 1000 BSM Approve 해주기
      await bsm
        .connect(otherAccount1)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount2)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount3)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount4)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount5)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      //Vote를 위한 최소 조건 : 1000 BSM staking
      await stakingContract.connect(otherAccount1).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount2).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount3).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount4).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount5).stake(BigInt(1000 * 1e18));

      //Vote를 위해 3BSM approve
      await bsm
        .connect(otherAccount1)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount2)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount3)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount4)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount5)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      // 5개의 리뷰에 1표씩 주기
      await rewardContract.connect(otherAccount1).vote(2);
      await rewardContract.connect(otherAccount2).vote(3);
      await rewardContract.connect(otherAccount3).vote(4);
      await rewardContract.connect(otherAccount4).vote(5);
      await rewardContract.connect(otherAccount5).vote(6);

      const sortReview = await rewardContract.sort([
        {
          writer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          title: "Title1",
          content: "Content1",
          serialNumber: 1n,
          votes: 0n,
          votedBy: [],
          publishedAt: 1724746735n,
          restaurant: "Restaurant1",
          longitude: 1234n,
          latitude: 5678n,
          elected: false,
        },
        {
          writer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          title: "Title2",
          content: "Content2",
          serialNumber: 2n,
          votes: 1n,
          votedBy: [],
          publishedAt: 1724746736n,
          restaurant: "Restaurant2",
          longitude: 4321n,
          latitude: 8765n,
          elected: false,
        },
        {
          writer: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          title: "Title3",
          content: "Content3",
          serialNumber: 3n,
          votes: 1n,
          votedBy: [],
          publishedAt: 1724746737n,
          restaurant: "Restaurant3",
          longitude: 4321n,
          latitude: 8765n,
          elected: false,
        },
        {
          writer: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
          title: "Title4",
          content: "Content4",
          serialNumber: 4n,
          votes: 1n,
          votedBy: [],
          publishedAt: 1724746738n,
          restaurant: "Restaurant4",
          longitude: 4321n,
          latitude: 8765n,
          elected: false,
        },
        {
          writer: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
          title: "Title5",
          content: "Content5",
          serialNumber: 5n,
          votes: 1n,
          votedBy: [],
          publishedAt: 1724746739n,
          restaurant: "Restaurant5",
          longitude: 4321n,
          latitude: 8765n,
          elected: false,
        },
        {
          writer: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
          title: "Title6",
          content: "Content6",
          serialNumber: 6n,
          votes: 1n,
          votedBy: [],
          publishedAt: 1724746740n,
          restaurant: "Restaurant6",
          longitude: 4321n,
          latitude: 8765n,
          elected: false,
        },
      ]);

      expect(sortReview.length).to.equal(5);
    });

    it("리뷰 작성자들에게 지급할 BSM 토큰를 Mint할 함수 정상 작동 확인", async function () {
      const { bsm, rewardContract } = await loadFixture(deployContractsFixture);

      await bsm.addMinter(rewardContract);

      await rewardContract.mintReward();

      const contractBalance = await bsm.balanceOf(rewardContract.target);
      expect(contractBalance).to.equal(ethers.parseEther("30000"));
    });

    it("4주마다 리뷰 선정 후 보상 지급", async function () {
      const {
        bsm,
        stakingContract,
        rewardContract,
        otherAccount1,
        otherAccount2,
        otherAccount3,
        otherAccount4,
        otherAccount5,
        otherAccount6,
      } = await loadFixture(deployContractsFixture);

      //총 6개 리뷰 작성
      await rewardContract
        .connect(otherAccount1)
        .publish("Title1", "Restaurant1", "Content1", 1234, 5678);

      await rewardContract
        .connect(otherAccount2)
        .publish("Title2", "Restaurant2", "Content2", 4321, 8765);

      await rewardContract
        .connect(otherAccount3)
        .publish("Title3", "Restaurant3", "Content3", 4321, 8765);

      await rewardContract
        .connect(otherAccount4)
        .publish("Title4", "Restaurant4", "Content4", 4321, 8765);

      await rewardContract
        .connect(otherAccount5)
        .publish("Title5", "Restaurant5", "Content5", 4321, 8765);

      await rewardContract
        .connect(otherAccount6)
        .publish("Title6", "Restaurant6", "Content6", 4321, 8765);

      //스테이킹 위해 1000 BSM Approve 해주기
      await bsm
        .connect(otherAccount1)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount2)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount3)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount4)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      await bsm
        .connect(otherAccount5)
        .approve(stakingContract.target, BigInt(1000 * 1e18));

      //Vote를 위한 최소 조건 : 1000 BSM staking
      await stakingContract.connect(otherAccount1).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount2).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount3).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount4).stake(BigInt(1000 * 1e18));
      await stakingContract.connect(otherAccount5).stake(BigInt(1000 * 1e18));

      //Vote를 위해 3BSM approve
      await bsm
        .connect(otherAccount1)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount2)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount3)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount4)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount5)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      // 5개의 리뷰에 1표씩 주기
      await rewardContract.connect(otherAccount1).vote(2);
      await rewardContract.connect(otherAccount2).vote(3);
      await rewardContract.connect(otherAccount3).vote(4);
      await rewardContract.connect(otherAccount4).vote(5);
      await rewardContract.connect(otherAccount5).vote(6);

      await bsm.addMinter(rewardContract);

      await rewardContract.mintReward();

      await rewardContract.reward();

      // Reviewers haven't claimed their rewards yet, so nothing should be transferred
      const user1Balance = await bsm.balanceOf(otherAccount1);
      const user2Balance = await bsm.balanceOf(otherAccount2);
      const user3Balance = await bsm.balanceOf(otherAccount3);
      const user4Balance = await bsm.balanceOf(otherAccount4);
      const user5Balance = await bsm.balanceOf(otherAccount5);
      const user6Balance = await bsm.balanceOf(otherAccount6);
      const contractBalance = await bsm.balanceOf(rewardContract.target);

      expect(user1Balance).to.equal(ethers.parseEther("9000")); // 10000 - 1000(staking) - 3(vote) + 3(reward for voting Review2)
      expect(user2Balance).to.equal(ethers.parseEther("15000")); // 10000 - 1000(staking) - 3(vote) + 3(reward for voting Review3) + 6000(reward for writer)
      expect(user3Balance).to.equal(ethers.parseEther("15000")); // 10000 - 1000(staking) - 3(vote) + 3(reward for voting Review4) + 6000(reward for writer)
      expect(user4Balance).to.equal(ethers.parseEther("15000")); // 10000 - 1000(staking) - 3(vote) + 3(reward for voting Review5) + 6000(reward for writer)
      expect(user5Balance).to.equal(ethers.parseEther("15000")); // 10000 - 1000(staking) - 3(vote) + 3(reward for voting Review6) + 6000(reward for writer)
      expect(user6Balance).to.equal(ethers.parseEther("16000")); // 10000 + 6000(reward for writer)
      expect(contractBalance).to.equal(0);

      // 4주 후로 시간 변경
      await time.increase(60 * 60 * 24 * 7 * 4);

      //총 6개 리뷰 작성
      await rewardContract
        .connect(otherAccount1)
        .publish("Title7", "Restaurant7", "Content7", 1234, 5678);

      await rewardContract
        .connect(otherAccount2)
        .publish("Title8", "Restaurant8", "Content8", 4321, 8765);

      await rewardContract
        .connect(otherAccount3)
        .publish("Title9", "Restaurant9", "Content9", 4321, 8765);

      await rewardContract
        .connect(otherAccount4)
        .publish("Title10", "Restaurant10", "Content10", 4321, 8765);

      await rewardContract
        .connect(otherAccount5)
        .publish("Title11", "Restaurant11", "Content11", 4321, 8765);

      await rewardContract
        .connect(otherAccount6)
        .publish("Title12", "Restaurant12", "Content12", 4321, 8765);

      //Vote를 위해 3BSM approve
      await bsm
        .connect(otherAccount1)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount2)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount3)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount4)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      await bsm
        .connect(otherAccount5)
        .approve(rewardContract.target, BigInt(3 * 1e18));

      // 5개의 리뷰에 1표씩 주기
      await rewardContract.connect(otherAccount1).vote(8);
      await rewardContract.connect(otherAccount2).vote(9);
      await rewardContract.connect(otherAccount3).vote(10);
      await rewardContract.connect(otherAccount4).vote(11);
      await rewardContract.connect(otherAccount5).vote(12);

      await bsm.addMinter(rewardContract);

      await rewardContract.mintReward();

      await rewardContract.reward();
    });
  });
});
