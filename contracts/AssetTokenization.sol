// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AssetTokenization
 * @dev Support for tokenizing real-world assets or creating new digital assets
 * Supports both NFTs (ERC721) and Fungible Tokens (ERC1155) for various asset types
 */

/**
 * @dev ERC721 Token for Non-Fungible Assets (Real Estate, Art, etc.)
 */
contract NFTAsset is ERC721, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    struct AssetMetadata {
        string assetType;        // e.g., "Real Estate", "Art", "Vehicle"
        string description;
        string location;
        uint256 valuation;       // Valuation in base currency
        uint256 creationDate;
        bool isVerified;
        string ipfsHash;         // IPFS hash for additional documents
    }
    
    mapping(uint256 => AssetMetadata) public assetMetadata;
    mapping(address => bool) public verifiers;
    
    event AssetTokenized(uint256 indexed tokenId, address owner, string assetType, uint256 valuation);
    event AssetVerified(uint256 indexed tokenId, address verifier);
    event AssetValuationUpdated(uint256 indexed tokenId, uint256 oldValuation, uint256 newValuation);
    event VerifierAdded(address verifier);
    event VerifierRemoved(address verifier);
    
    constructor() ERC721("Universal Asset Token", "UAT") {}
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || owner() == msg.sender, "Not authorized verifier");
        _;
    }
    
    /**
     * @dev Tokenize a real-world asset
     */
    function tokenizeAsset(
        address owner_,
        string memory assetType,
        string memory description,
        string memory location,
        uint256 valuation,
        string memory ipfsHash
    ) external onlyVerifier whenNotPaused returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(owner_, newTokenId);
        
        assetMetadata[newTokenId] = AssetMetadata({
            assetType: assetType,
            description: description,
            location: location,
            valuation: valuation,
            creationDate: block.timestamp,
            isVerified: false,
            ipfsHash: ipfsHash
        });
        
        emit AssetTokenized(newTokenId, owner_, assetType, valuation);
        return newTokenId;
    }
    
    /**
     * @dev Verify an asset
     */
    function verifyAsset(uint256 tokenId) external onlyVerifier {
        require(_exists(tokenId), "Token doesn't exist");
        assetMetadata[tokenId].isVerified = true;
        emit AssetVerified(tokenId, msg.sender);
    }
    
    /**
     * @dev Update asset valuation
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) external onlyVerifier {
        require(_exists(tokenId), "Token doesn't exist");
        uint256 oldValuation = assetMetadata[tokenId].valuation;
        assetMetadata[tokenId].valuation = newValuation;
        emit AssetValuationUpdated(tokenId, oldValuation, newValuation);
    }
    
    /**
     * @dev Add verifier
     */
    function addVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }
    
    /**
     * @dev Remove verifier
     */
    function removeVerifier(address verifier) external onlyOwner {
        verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }
    
    /**
     * @dev Get asset metadata
     */
    function getAssetMetadata(uint256 tokenId) external view returns (AssetMetadata memory) {
        require(_exists(tokenId), "Token doesn't exist");
        return assetMetadata[tokenId];
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _beforeTokenTransfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}

/**
 * @dev ERC1155 Token for Fungible and Semi-Fungible Assets
 */
contract FungibleAsset is ERC1155, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    struct TokenMetadata {
        string name;
        string assetType;
        uint256 totalSupply;
        uint256 pricePerUnit;
        bool isFungible;
        string ipfsHash;
    }
    
    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(address => bool) public minters;
    
    event TokenCreated(uint256 indexed tokenId, string name, string assetType, uint256 totalSupply);
    event TokenMinted(uint256 indexed tokenId, address to, uint256 amount);
    event TokenBurned(uint256 indexed tokenId, address from, uint256 amount);
    event MinterAdded(address minter);
    event MinterRemoved(address minter);
    
    constructor() ERC1155("https://api.universalblockchain.io/token/{id}.json") {}
    
    modifier onlyMinter() {
        require(minters[msg.sender] || owner() == msg.sender, "Not authorized minter");
        _;
    }
    
    /**
     * @dev Create a new token type
     */
    function createToken(
        string memory name,
        string memory assetType,
        uint256 totalSupply,
        uint256 pricePerUnit,
        bool isFungible,
        string memory ipfsHash
    ) external onlyMinter whenNotPaused returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        tokenMetadata[newTokenId] = TokenMetadata({
            name: name,
            assetType: assetType,
            totalSupply: totalSupply,
            pricePerUnit: pricePerUnit,
            isFungible: isFungible,
            ipfsHash: ipfsHash
        });
        
        if (totalSupply > 0) {
            _mint(msg.sender, newTokenId, totalSupply, "");
        }
        
        emit TokenCreated(newTokenId, name, assetType, totalSupply);
        return newTokenId;
    }
    
    /**
     * @dev Mint additional tokens
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyMinter whenNotPaused {
        require(tokenMetadata[tokenId].totalSupply > 0, "Token doesn't exist");
        
        _mint(to, tokenId, amount, "");
        tokenMetadata[tokenId].totalSupply += amount;
        
        emit TokenMinted(tokenId, to, amount);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "Not authorized");
        
        _burn(from, tokenId, amount);
        tokenMetadata[tokenId].totalSupply -= amount;
        
        emit TokenBurned(tokenId, from, amount);
    }
    
    /**
     * @dev Add minter
     */
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Get token metadata
     */
    function getTokenMetadata(uint256 tokenId) external view returns (TokenMetadata memory) {
        require(tokenMetadata[tokenId].totalSupply > 0, "Token doesn't exist");
        return tokenMetadata[tokenId];
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _beforeTokenTransfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
