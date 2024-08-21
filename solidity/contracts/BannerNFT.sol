// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./BsmToken.sol"; // BSM token contract

contract BannerNFT is ERC721URIStorage, Ownable(msg.sender) {

    
    BSM public BSMToken;
    uint256 public NFT_PRICE = 2000 * 1e18; // 2000 BSM
    uint256 public NFT_EXPIRATION_PERIOD = 2 weeks;
    uint256 public MAX_SUPPLY = 20; // Initial maximum supply
    uint256 public supplies = 0;

    struct NFTDetails {
        uint256 mintedAt;
        bool isActive;
    }

    mapping(uint256 => NFTDetails) public nftDetails;

    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    constructor(address _BSMToken) ERC721("BannerNFT", "BNFT") {
        BSMToken = BSM(_BSMToken);
    }

    function mintNFT(string memory metadataURI) external {
        require(supplies < MAX_SUPPLY, "Maximum NFT supply reached");

        // Transfer BSM tokens from the user to this contract
        require(BSMToken.transferFrom(msg.sender, address(this), NFT_PRICE), "BSM transfer failed");

        uint256 tokenId = supplies;
        supplies = supplies + 1;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);  // Set metadata URI

        nftDetails[tokenId] = NFTDetails({
            mintedAt: block.timestamp,
            isActive: true
        });

        emit NFTMinted(msg.sender, tokenId);
    }

    function transferNFT(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        require(owner == _msgSender() || getApproved(tokenId) == _msgSender(), "ERC721: transfer caller is not owner nor approved");
        require(nftDetails[tokenId].isActive, "NFT has expired or is inactive");

        if (block.timestamp >= nftDetails[tokenId].mintedAt + NFT_EXPIRATION_PERIOD) {
            nftDetails[tokenId].isActive = false;
        }

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
    }

    function withdrawFunds(address to, uint256 amount) external onlyOwner {
        require(amount <= BSMToken.balanceOf(address(this)), "Insufficient funds");
        require(BSMToken.transfer(to, amount), "BSM transfer failed");
        emit FundsWithdrawn(to, amount);
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    function totalSupply() external view returns (uint256) {
        return supplies;
    }

    // Directly check existence of token
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _exists(tokenId);
    }

    // Override tokenURI to use ERC721URIStorage's implementation
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        // Check if token exists
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        // Return the token URI
        return super.tokenURI(tokenId);
    }
}