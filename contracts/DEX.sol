// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DEX
 * @dev Decentralized Exchange for trading digital assets on the blockchain
 * Supports automated market maker (AMM) model with liquidity pools
 */
contract DEX is ReentrancyGuard, Ownable {
    
    struct LiquidityPool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    struct Order {
        address trader;
        address tokenFrom;
        address tokenTo;
        uint256 amountFrom;
        uint256 amountTo;
        uint256 timestamp;
        bool isActive;
    }
    
    // Mapping from pool ID to LiquidityPool
    mapping(bytes32 => LiquidityPool) public liquidityPools;
    
    // Array of all pool IDs
    bytes32[] public poolIds;
    
    // Mapping from order ID to Order
    mapping(uint256 => Order) public orders;
    uint256 public orderCount;
    
    // Trading fee (0.3% = 30 basis points)
    uint256 public tradingFee = 30;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Events
    event PoolCreated(bytes32 indexed poolId, address tokenA, address tokenB);
    event LiquidityAdded(bytes32 indexed poolId, address provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(bytes32 indexed poolId, address provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event TokenSwapped(address indexed trader, address tokenFrom, address tokenTo, uint256 amountFrom, uint256 amountTo);
    event OrderCreated(uint256 indexed orderId, address trader, address tokenFrom, address tokenTo, uint256 amountFrom, uint256 amountTo);
    event OrderCancelled(uint256 indexed orderId);
    event FeeUpdated(uint256 newFee);
    
    /**
     * @dev Get pool ID for a token pair
     */
    function getPoolId(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }
    
    /**
     * @dev Create a new liquidity pool
     */
    function createPool(address tokenA, address tokenB) external returns (bytes32) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(liquidityPools[poolId].tokenA == address(0), "Pool exists");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        LiquidityPool storage pool = liquidityPools[poolId];
        pool.tokenA = token0;
        pool.tokenB = token1;
        poolIds.push(poolId);
        
        emit PoolCreated(poolId, token0, token1);
        return poolId;
    }
    
    /**
     * @dev Add liquidity to a pool
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        
        bytes32 poolId = getPoolId(tokenA, tokenB);
        LiquidityPool storage pool = liquidityPools[poolId];
        
        // Create pool if it doesn't exist
        if (pool.tokenA == address(0)) {
            this.createPool(tokenA, tokenB);
            pool = liquidityPools[poolId];
        }
        
        // Transfer tokens to contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Calculate liquidity tokens to mint
        if (pool.totalLiquidity == 0) {
            liquidity = sqrt(amountA * amountB);
        } else {
            liquidity = min(
                (amountA * pool.totalLiquidity) / pool.reserveA,
                (amountB * pool.totalLiquidity) / pool.reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity");
        
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        pool.liquidity[msg.sender] += liquidity;
        
        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Remove liquidity from a pool
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        LiquidityPool storage pool = liquidityPools[poolId];
        
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity");
        
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");
        
        pool.liquidity[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        
        IERC20(tokenA).transfer(msg.sender, amountA);
        IERC20(tokenB).transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Swap tokens using AMM
     */
    function swap(
        address tokenFrom,
        address tokenTo,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");
        
        bytes32 poolId = getPoolId(tokenFrom, tokenTo);
        LiquidityPool storage pool = liquidityPools[poolId];
        require(pool.tokenA != address(0), "Pool doesn't exist");
        
        // Calculate output amount with fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - tradingFee);
        
        bool isTokenAToB = tokenFrom == pool.tokenA;
        uint256 reserveIn = isTokenAToB ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenAToB ? pool.reserveB : pool.reserveA;
        
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
        require(amountOut >= minAmountOut, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        // Transfer tokens
        IERC20(tokenFrom).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenTo).transfer(msg.sender, amountOut);
        
        // Update reserves
        if (isTokenAToB) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        emit TokenSwapped(msg.sender, tokenFrom, tokenTo, amountIn, amountOut);
    }
    
    /**
     * @dev Create a limit order
     */
    function createOrder(
        address tokenFrom,
        address tokenTo,
        uint256 amountFrom,
        uint256 amountTo
    ) external returns (uint256) {
        require(amountFrom > 0 && amountTo > 0, "Invalid amounts");
        
        IERC20(tokenFrom).transferFrom(msg.sender, address(this), amountFrom);
        
        orderCount++;
        orders[orderCount] = Order({
            trader: msg.sender,
            tokenFrom: tokenFrom,
            tokenTo: tokenTo,
            amountFrom: amountFrom,
            amountTo: amountTo,
            timestamp: block.timestamp,
            isActive: true
        });
        
        emit OrderCreated(orderCount, msg.sender, tokenFrom, tokenTo, amountFrom, amountTo);
        return orderCount;
    }
    
    /**
     * @dev Cancel an order
     */
    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.isActive, "Order not active");
        
        order.isActive = false;
        IERC20(order.tokenFrom).transfer(msg.sender, order.amountFrom);
        
        emit OrderCancelled(orderId);
    }
    
    /**
     * @dev Get quote for a swap
     */
    function getQuote(
        address tokenFrom,
        address tokenTo,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        bytes32 poolId = getPoolId(tokenFrom, tokenTo);
        LiquidityPool storage pool = liquidityPools[poolId];
        
        require(pool.tokenA != address(0), "Pool doesn't exist");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - tradingFee);
        bool isTokenAToB = tokenFrom == pool.tokenA;
        uint256 reserveIn = isTokenAToB ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenAToB ? pool.reserveB : pool.reserveA;
        
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }
    
    /**
     * @dev Update trading fee (only owner)
     */
    function setTradingFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high"); // Max 1%
        tradingFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Get user's liquidity in a pool
     */
    function getUserLiquidity(bytes32 poolId, address user) external view returns (uint256) {
        return liquidityPools[poolId].liquidity[user];
    }
    
    /**
     * @dev Get pool reserves
     */
    function getReserves(bytes32 poolId) external view returns (uint256 reserveA, uint256 reserveB) {
        LiquidityPool storage pool = liquidityPools[poolId];
        return (pool.reserveA, pool.reserveB);
    }
    
    // Helper functions
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }
}
