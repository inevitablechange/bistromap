// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./utils/Counters.sol";
import "./BsmToken.sol"; // BSM token contract

contract BannerNFT is ERC721, Ownable(msg.sender) {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    BSM public BSMToken;
    uint256 public constant NFT_PRICE = 2000 * 1e18; // 2000 BSM
    uint256 public constant NFT_EXPIRATION_PERIOD = 2 weeks;
    uint256 public constant MAX_SUPPLY = 10;

    struct NFTDetails {
        uint256 mintedAt;
        bool isActive;
    }

    mapping(uint256 => NFTDetails) public nftDetails;

    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event NFTDeactivated(uint256 indexed tokenId);

    constructor(address _BSMToken) ERC721("BannerNFT", "BNFT") {
        BSMToken = BSM(_BSMToken);
    }

    function mintNFT() external {
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Maximum NFT supply reached");

        // Create a new NFT if no expired NFT is available
        require(BSMToken.transferFrom(msg.sender, address(this), NFT_PRICE), "BSM transfer failed");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        nftDetails[tokenId] = NFTDetails({
            mintedAt: block.timestamp,
            isActive: true
        });
        emit NFTMinted(msg.sender, tokenId);
    }

    function transferNFT(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        require(owner == _msgSender() || getApproved(tokenId) == _msgSender(),
                "ERC721: transfer caller is not owner nor approved");

        // Automatically deactivate the NFT if expired before transferring
        if (block.timestamp >= nftDetails[tokenId].mintedAt + NFT_EXPIRATION_PERIOD) {
            nftDetails[tokenId].isActive = false;
            emit NFTDeactivated(tokenId);
        }

        require(nftDetails[tokenId].isActive, "NFT has expired or is inactive");
        _safeTransfer(owner, to, tokenId, "");
    }

    function checkNFTStatus(uint256 tokenId) external view returns (bool) {
        if (nftDetails[tokenId].mintedAt == 0) return false;
        return block.timestamp < nftDetails[tokenId].mintedAt + NFT_EXPIRATION_PERIOD && nftDetails[tokenId].isActive;
    }

    function deactivateExpiredNFT(uint256 tokenId) external {
        require(nftDetails[tokenId].mintedAt != 0, "NFT does not exist");
        require(block.timestamp >= nftDetails[tokenId].mintedAt + NFT_EXPIRATION_PERIOD, "NFT has not expired yet");
        nftDetails[tokenId].isActive = false;
        emit NFTDeactivated(tokenId);
    }

    function withdrawFunds(address to, uint256 amount) external onlyOwner {
        require(amount <= BSMToken.balanceOf(address(this)), "Insufficient funds");
        require(BSMToken.transfer(to, amount), "BSM transfer failed");
        emit FundsWithdrawn(to, amount);
    }
}