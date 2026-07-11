// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * MortgageStaking — MRT and MRT+USDT lock staking with full owner control.
 *
 * - Pool 0: MRT only
 * - Pool 1: MRT + USDT (both amounts required)
 * - Every stake is recorded onchain (amounts, timestamps, unlock time).
 * - Owner can tune pools, release positions early back to the user,
 *   and rescue any token/ETH held by the contract.
 *
 * TESTNET BUILD — deliberately owner-centric per project requirements.
 * Communicate this custody model clearly to users before mainnet.
 * Self-contained (no external imports) so it deploys from Remix as-is.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MortgageStaking {
    /* ---------------------------- access control ---------------------------- */

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    /* ------------------------------ reentrancy ------------------------------ */

    uint256 private _locked = 1;

    modifier nonReentrant() {
        require(_locked == 1, "reentrancy");
        _locked = 2;
        _;
        _locked = 1;
    }

    /* --------------------------------- state -------------------------------- */

    IERC20 public immutable mrt;
    IERC20 public immutable usdt;

    struct Pool {
        uint16 aprBps;      // informational APR in basis points (1850 = 18.50%)
        uint32 lockDays;
        uint128 minMrt;     // minimum MRT per stake (MRT has 18 decimals)
        bool requiresUsdt;  // pool 1: USDT must accompany MRT
        bool active;
        uint256 totalMrt;
        uint256 totalUsdt;
    }

    struct Position {
        uint8 poolId;
        uint128 mrtAmount;
        uint128 usdtAmount;
        uint64 startTime;
        uint64 unlockTime;
        bool withdrawn;
    }

    Pool[] public pools;
    mapping(address => Position[]) private _positions;
    address[] public stakers;
    mapping(address => bool) private _knownStaker;

    /* --------------------------------- events -------------------------------- */

    event Staked(address indexed user, uint8 indexed poolId, uint256 index, uint256 mrtAmount, uint256 usdtAmount, uint64 unlockTime);
    event Unstaked(address indexed user, uint256 index, uint256 mrtAmount, uint256 usdtAmount);
    event OwnerReleased(address indexed user, uint256 index);
    event PoolUpdated(uint8 indexed poolId, uint16 aprBps, uint32 lockDays, uint128 minMrt, bool active);
    event Rescued(address indexed token, address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /* ------------------------------ construction ----------------------------- */

    constructor(address mrtToken, address usdtToken) {
        require(mrtToken != address(0) && usdtToken != address(0), "zero addr");
        owner = msg.sender;
        mrt = IERC20(mrtToken);
        usdt = IERC20(usdtToken);

        // Pool 0 — MRT only: 18.5% APR (informational), 30-day lock, min 1,000 MRT
        pools.push(Pool(1850, 30, 1_000e18, false, true, 0, 0));
        // Pool 1 — MRT + USDT: 32% APR (informational), 60-day lock, min 500 MRT
        pools.push(Pool(3200, 60, 500e18, true, true, 0, 0));
    }

    /* --------------------------------- user API ------------------------------ */

    /// Stake into a pool. For pool 1, usdtAmount must be > 0 (USDT has 6 decimals).
    function stake(uint8 poolId, uint128 mrtAmount, uint128 usdtAmount) external nonReentrant {
        require(poolId < pools.length, "bad pool");
        Pool storage pool = pools[poolId];
        require(pool.active, "pool inactive");
        require(mrtAmount >= pool.minMrt, "below minimum");
        if (pool.requiresUsdt) {
            require(usdtAmount > 0, "usdt required");
        } else {
            require(usdtAmount == 0, "usdt not accepted");
        }

        require(mrt.transferFrom(msg.sender, address(this), mrtAmount), "mrt transfer failed");
        if (usdtAmount > 0) {
            require(usdt.transferFrom(msg.sender, address(this), usdtAmount), "usdt transfer failed");
        }

        uint64 unlockTime = uint64(block.timestamp + uint256(pool.lockDays) * 1 days);
        _positions[msg.sender].push(
            Position(poolId, mrtAmount, usdtAmount, uint64(block.timestamp), unlockTime, false)
        );
        pool.totalMrt += mrtAmount;
        pool.totalUsdt += usdtAmount;

        if (!_knownStaker[msg.sender]) {
            _knownStaker[msg.sender] = true;
            stakers.push(msg.sender);
        }

        emit Staked(msg.sender, poolId, _positions[msg.sender].length - 1, mrtAmount, usdtAmount, unlockTime);
    }

    /// Withdraw a matured position back to the caller.
    function unstake(uint256 index) external nonReentrant {
        Position storage p = _positions[msg.sender][index];
        require(!p.withdrawn, "already withdrawn");
        require(block.timestamp >= p.unlockTime, "still locked");
        _payout(msg.sender, p);
        emit Unstaked(msg.sender, index, p.mrtAmount, p.usdtAmount);
    }

    /* --------------------------------- views --------------------------------- */

    function poolCount() external view returns (uint256) { return pools.length; }

    function positionCount(address user) external view returns (uint256) { return _positions[user].length; }

    function positionsOf(address user) external view returns (Position[] memory) { return _positions[user]; }

    function stakerCount() external view returns (uint256) { return stakers.length; }

    /// Paginated staker list for the admin panel.
    function stakerSlice(uint256 start, uint256 count) external view returns (address[] memory out) {
        uint256 end = start + count;
        if (end > stakers.length) end = stakers.length;
        out = new address[](end - start);
        for (uint256 i = start; i < end; i++) out[i - start] = stakers[i];
    }

    /* ------------------------------- owner API -------------------------------- */

    function setPool(uint8 poolId, uint16 aprBps, uint32 lockDays, uint128 minMrt, bool active) external onlyOwner {
        require(poolId < pools.length, "bad pool");
        Pool storage pool = pools[poolId];
        pool.aprBps = aprBps;
        pool.lockDays = lockDays;
        pool.minMrt = minMrt;
        pool.active = active;
        emit PoolUpdated(poolId, aprBps, lockDays, minMrt, active);
    }

    /// Release a position back to its user before the lock expires.
    function ownerRelease(address user, uint256 index) external onlyOwner nonReentrant {
        Position storage p = _positions[user][index];
        require(!p.withdrawn, "already withdrawn");
        _payout(user, p);
        emit OwnerReleased(user, index);
    }

    /// Rescue any ERC20 (including staked MRT/USDT) held by the contract.
    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero addr");
        require(IERC20(token).transfer(to, amount), "transfer failed");
        emit Rescued(token, to, amount);
    }

    /// Rescue native ETH sent to the contract by mistake.
    function rescueETH(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero addr");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "eth transfer failed");
        emit Rescued(address(0), to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /* -------------------------------- internal -------------------------------- */

    function _payout(address user, Position storage p) private {
        p.withdrawn = true;
        Pool storage pool = pools[p.poolId];
        pool.totalMrt -= p.mrtAmount;
        pool.totalUsdt -= p.usdtAmount;
        require(mrt.transfer(user, p.mrtAmount), "mrt transfer failed");
        if (p.usdtAmount > 0) {
            require(usdt.transfer(user, p.usdtAmount), "usdt transfer failed");
        }
    }

    receive() external payable {}
}
