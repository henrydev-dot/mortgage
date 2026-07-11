// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * MortgageLending — collateralized USDT borrowing with full owner control.
 *
 * - Users deposit approved collateral (native ETH or ERC20s on Base).
 * - Credit limit = Σ collateralValue × LTV (default up to 70%).
 * - Prices are set by the owner (manual oracle — testnet build).
 * - Simple-interest debt accrual at an owner-set APR.
 * - Owner has full control: list/unlist collateral, set prices and LTVs,
 *   adjust any user position, seize collateral, rescue all funds.
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

contract MortgageLending {
    /* ---------------------------- access control ---------------------------- */

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    /* ------------------------------ reentrancy ------------------------------ */

    uint256 private _lockedFlag = 1;

    modifier nonReentrant() {
        require(_lockedFlag == 1, "reentrancy");
        _lockedFlag = 2;
        _;
        _lockedFlag = 1;
    }

    /* --------------------------------- state -------------------------------- */

    /// Borrow asset (USDT, 6 decimals on Base)
    IERC20 public immutable usdt;

    /// address(0) represents native ETH as collateral
    address public constant NATIVE = address(0);

    struct CollateralConfig {
        bool listed;
        bool active;          // deposits allowed
        uint16 ltvBps;        // e.g. 7000 = 70%
        uint8 decimals;       // token decimals (18 for ETH)
        uint256 priceUsdt;    // USDT (6 decimals) per 1 whole token, set by owner
    }

    mapping(address => CollateralConfig) public collateralConfig;
    address[] public collateralList;

    // user => token => amount deposited
    mapping(address => mapping(address => uint256)) public collateralOf;

    // debt bookkeeping (simple interest, accrued into principal on touch)
    mapping(address => uint256) public principalOf;   // USDT units
    mapping(address => uint64) public lastAccrued;
    uint16 public borrowAprBps = 800; // 8.00%

    address[] public borrowers;
    mapping(address => bool) private _knownBorrower;

    bool public paused;

    /* --------------------------------- events -------------------------------- */

    event CollateralListed(address indexed token, uint16 ltvBps, uint8 decimals, uint256 priceUsdt, bool active);
    event PriceUpdated(address indexed token, uint256 priceUsdt);
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event DebtAdjusted(address indexed user, uint256 oldPrincipal, uint256 newPrincipal);
    event Seized(address indexed user, address indexed token, uint256 amount, address to);
    event Rescued(address indexed token, address indexed to, uint256 amount);
    event PausedSet(bool paused);
    event AprSet(uint16 aprBps);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /* ------------------------------ construction ----------------------------- */

    constructor(address usdtToken) {
        require(usdtToken != address(0), "zero addr");
        owner = msg.sender;
        usdt = IERC20(usdtToken);
        // Native ETH listed by default at 70% LTV; owner must set the price.
        collateralConfig[NATIVE] = CollateralConfig(true, true, 7000, 18, 0);
        collateralList.push(NATIVE);
        emit CollateralListed(NATIVE, 7000, 18, 0, true);
    }

    /* --------------------------------- user API ------------------------------ */

    function depositETH() external payable nonReentrant {
        require(!paused, "paused");
        CollateralConfig storage c = collateralConfig[NATIVE];
        require(c.listed && c.active, "collateral inactive");
        require(msg.value > 0, "zero amount");
        _register(msg.sender);
        collateralOf[msg.sender][NATIVE] += msg.value;
        emit Deposited(msg.sender, NATIVE, msg.value);
    }

    function depositToken(address token, uint256 amount) external nonReentrant {
        require(!paused, "paused");
        CollateralConfig storage c = collateralConfig[token];
        require(token != NATIVE && c.listed && c.active, "collateral inactive");
        require(amount > 0, "zero amount");
        _register(msg.sender);
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "transfer failed");
        collateralOf[msg.sender][token] += amount;
        emit Deposited(msg.sender, token, amount);
    }

    /// Borrow USDT against deposited collateral, up to the credit limit.
    function borrow(uint256 amount) external nonReentrant {
        require(!paused, "paused");
        require(amount > 0, "zero amount");
        _accrue(msg.sender);
        require(principalOf[msg.sender] + amount <= creditLimit(msg.sender), "exceeds credit limit");
        principalOf[msg.sender] += amount;
        require(usdt.transfer(msg.sender, amount), "usdt transfer failed");
        emit Borrowed(msg.sender, amount);
    }

    /// Repay USDT debt (approve first). Overpayment is capped to the debt.
    function repay(uint256 amount) external nonReentrant {
        _accrue(msg.sender);
        uint256 debt = principalOf[msg.sender];
        require(debt > 0, "no debt");
        uint256 pay = amount > debt ? debt : amount;
        require(usdt.transferFrom(msg.sender, address(this), pay), "transfer failed");
        principalOf[msg.sender] = debt - pay;
        emit Repaid(msg.sender, pay);
    }

    /// Withdraw collateral as long as the remaining position stays solvent.
    function withdraw(address token, uint256 amount) external nonReentrant {
        _accrue(msg.sender);
        uint256 held = collateralOf[msg.sender][token];
        require(amount > 0 && amount <= held, "bad amount");
        collateralOf[msg.sender][token] = held - amount;
        require(principalOf[msg.sender] <= creditLimit(msg.sender), "would exceed limit");
        _send(token, payable(msg.sender), amount);
        emit Withdrawn(msg.sender, token, amount);
    }

    /* --------------------------------- views --------------------------------- */

    /// Current debt including pending interest.
    function debtOf(address user) public view returns (uint256) {
        uint256 principal = principalOf[user];
        if (principal == 0) return 0;
        uint256 dt = block.timestamp - lastAccrued[user];
        return principal + (principal * borrowAprBps * dt) / (10000 * 365 days);
    }

    /// Max USDT borrowable against the user's collateral.
    function creditLimit(address user) public view returns (uint256 limit) {
        for (uint256 i = 0; i < collateralList.length; i++) {
            address token = collateralList[i];
            uint256 amount = collateralOf[user][token];
            if (amount == 0) continue;
            CollateralConfig storage c = collateralConfig[token];
            uint256 value = (amount * c.priceUsdt) / (10 ** c.decimals);
            limit += (value * c.ltvBps) / 10000;
        }
    }

    function collateralCount() external view returns (uint256) { return collateralList.length; }

    function borrowerCount() external view returns (uint256) { return borrowers.length; }

    function borrowerSlice(uint256 start, uint256 count) external view returns (address[] memory out) {
        uint256 end = start + count;
        if (end > borrowers.length) end = borrowers.length;
        out = new address[](end - start);
        for (uint256 i = start; i < end; i++) out[i - start] = borrowers[i];
    }

    /// Full position snapshot for the admin panel.
    function positionOf(address user)
        external
        view
        returns (address[] memory tokens, uint256[] memory amounts, uint256 debt, uint256 limit)
    {
        tokens = collateralList;
        amounts = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) amounts[i] = collateralOf[user][tokens[i]];
        debt = debtOf(user);
        limit = creditLimit(user);
    }

    /* ------------------------------- owner API -------------------------------- */

    /// List or update a collateral asset. token = address(0) for native ETH.
    function setCollateral(address token, uint16 ltvBps, uint8 decimals_, uint256 priceUsdt, bool active)
        external
        onlyOwner
    {
        require(ltvBps <= 9000, "ltv too high");
        CollateralConfig storage c = collateralConfig[token];
        if (!c.listed) {
            c.listed = true;
            collateralList.push(token);
        }
        c.ltvBps = ltvBps;
        c.decimals = decimals_;
        c.priceUsdt = priceUsdt;
        c.active = active;
        emit CollateralListed(token, ltvBps, decimals_, priceUsdt, active);
    }

    function setPrice(address token, uint256 priceUsdt) external onlyOwner {
        require(collateralConfig[token].listed, "not listed");
        collateralConfig[token].priceUsdt = priceUsdt;
        emit PriceUpdated(token, priceUsdt);
    }

    function setBorrowApr(uint16 aprBps) external onlyOwner {
        require(aprBps <= 5000, "apr too high");
        borrowAprBps = aprBps;
        emit AprSet(aprBps);
    }

    function setPaused(bool value) external onlyOwner {
        paused = value;
        emit PausedSet(value);
    }

    /// Owner adjustment of a user's recorded debt (accrues first).
    function ownerSetDebt(address user, uint256 newPrincipal) external onlyOwner {
        _accrue(user);
        emit DebtAdjusted(user, principalOf[user], newPrincipal);
        principalOf[user] = newPrincipal;
    }

    /// Seize part of a user's collateral (e.g. liquidation) to any address.
    function ownerSeize(address user, address token, uint256 amount, address payable to) external onlyOwner nonReentrant {
        uint256 held = collateralOf[user][token];
        require(amount <= held, "exceeds held");
        collateralOf[user][token] = held - amount;
        _send(token, to, amount);
        emit Seized(user, token, amount, to);
    }

    /// Rescue any ERC20 held by the contract (including USDT liquidity).
    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero addr");
        require(IERC20(token).transfer(to, amount), "transfer failed");
        emit Rescued(token, to, amount);
    }

    /// Rescue native ETH held by the contract.
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

    function _accrue(address user) private {
        uint256 principal = principalOf[user];
        if (principal > 0) {
            uint256 dt = block.timestamp - lastAccrued[user];
            principalOf[user] = principal + (principal * borrowAprBps * dt) / (10000 * 365 days);
        }
        lastAccrued[user] = uint64(block.timestamp);
    }

    function _register(address user) private {
        if (!_knownBorrower[user]) {
            _knownBorrower[user] = true;
            borrowers.push(user);
        }
    }

    function _send(address token, address payable to, uint256 amount) private {
        if (token == NATIVE) {
            (bool ok, ) = to.call{value: amount}("");
            require(ok, "eth transfer failed");
        } else {
            require(IERC20(token).transfer(to, amount), "transfer failed");
        }
    }

    receive() external payable {}
}
