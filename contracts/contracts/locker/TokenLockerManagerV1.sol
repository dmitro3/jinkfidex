// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { ITokenLockerManagerV1 } from "./ITokenLockerManagerV1.sol";
import { Ownable } from "./Ownable.sol";
import { IERC20 } from "./library/IERC20.sol";
import { IUniswapV2Pair } from "./library/Dex.sol";
import { TokenLockerV1 } from "./TokenLockerV1.sol";
import { Util } from "./Util.sol";

contract TokenLockerManagerV1 is ITokenLockerManagerV1, Ownable {
  event TokenLockerCreated(
    uint40 id,
    address indexed token,
    address createdBy,
    uint256 balance,
    uint40 unlockTime
  );

  event LpLockerCreated(
    uint40 id,
    address indexed token,
    address indexed token0,
    address indexed token1,
    address createdBy,
    uint256 balance,
    uint40 unlockTime
  );

  constructor() Ownable(_msgSender()) {
    _creationEnabled = true;
    feeWallet = msg.sender;
  }

  bool private _creationEnabled;

  uint40 private _tokenLockerCount;
  uint40 private _lpLockerCount;

  uint256 public TokenLockerFee = 0.01 ether;
  uint256 public LpLockerFee = 0.01 ether;
  address public feeWallet;

  mapping(uint40 => TokenLockerV1) private _tokenLockers;
  mapping(uint40 => TokenLockerV1) private _lpLockers;

  mapping(address => uint40[]) private _tokenLockersForAddress;
  mapping(address => uint40[]) private _lpLockersForAddress;

  modifier allowCreation() {
    require(_creationEnabled, "Locker creation is disabled");
    _;
  }

  function tokenLockerCount() external view override returns (uint40) {
    return _tokenLockerCount;
  }

  function lpLockerCount() external view override returns (uint40) {
    return _lpLockerCount;
  }

  function creationEnabled() external view override returns (bool) {
    return _creationEnabled;
  }

  function setCreationEnabled(bool value_) external override onlyOwner {
    _creationEnabled = value_;
  }

  function createTokenLocker(
    address tokenAddress_,
    uint256 amount_,
    uint40 unlockTime_
  ) external payable override allowCreation {
    require(msg.value >= TokenLockerFee, "Insufficient Fee");

    bool isLp = Util.isLpToken(tokenAddress_);
    require(!isLp, "This is not token address.");

    uint40 id = _tokenLockerCount++;
    _tokenLockers[id] = new TokenLockerV1(address(this), id, _msgSender(), tokenAddress_, unlockTime_ + uint40(block.timestamp));
    address lockerAddress = address(_tokenLockers[id]);

    IERC20 token = IERC20(tokenAddress_);
    token.transferFrom(_msgSender(), lockerAddress, amount_);

    _tokenLockersForAddress[_msgSender()].push(id);
    _tokenLockersForAddress[tokenAddress_].push(id);
    _tokenLockersForAddress[lockerAddress].push(id);

    if (msg.value > TokenLockerFee) {
      uint256 remain = msg.value - TokenLockerFee;
      payable(msg.sender).transfer(remain);
      payable(feeWallet).transfer(TokenLockerFee);
    } else {
      payable(feeWallet).transfer(msg.value);
    }

    emit TokenLockerCreated(
      id,
      tokenAddress_,
      _msgSender(),
      token.balanceOf(lockerAddress),
      unlockTime_ + uint40(block.timestamp)
    );
  }

  function createLpLocker(
    address lpAddress_,
    uint256 amount_,
    uint40 unlockTime_
  ) external payable override allowCreation {
    require(msg.value >= LpLockerFee, "Insufficient Fee");

    bool isLp = Util.isLpToken(lpAddress_);
    require(isLp, "This is not lp address.");

    uint40 id = _lpLockerCount++;
    _lpLockers[id] = new TokenLockerV1(address(this), id, _msgSender(), lpAddress_, unlockTime_ + uint40(block.timestamp));
    address lockerAddress = address(_lpLockers[id]);

    IUniswapV2Pair token = IUniswapV2Pair(lpAddress_);
    token.transferFrom(_msgSender(), lockerAddress, amount_);

    _lpLockersForAddress[_msgSender()].push(id);
    _lpLockersForAddress[lpAddress_].push(id);
    _lpLockersForAddress[lockerAddress].push(id);

    (bool hasLpData,, address token0Address, address token1Address,,,,) = _lpLockers[id].getLpData();
    require(hasLpData, "Invalid Liquidity Token Address.");

    _lpLockersForAddress[token0Address].push(id);
    _lpLockersForAddress[token1Address].push(id);

    if (msg.value > LpLockerFee) {
      uint256 remain = msg.value - LpLockerFee;
      payable(msg.sender).transfer(remain);
      payable(feeWallet).transfer(LpLockerFee);
    } else {
      payable(feeWallet).transfer(msg.value);
    }

    emit LpLockerCreated(
      id,
      lpAddress_,
      token0Address,
      token1Address,
      _msgSender(),
      token.balanceOf(lockerAddress),
      unlockTime_ + uint40(block.timestamp)
    );
  }

  function getTokenLockAddress(uint40 id_) external view override returns (address) {
    return address(_tokenLockers[id_]);
  }

  function getLpLockAddress(uint40 id_) external view override returns (address) {
    return address(_lpLockers[id_]);
  }

  function getTokenLockData(uint40 id_) external view override returns (
    bool isLpToken,
    uint40 id,
    address contractAddress,
    address lockOwner,
    address token,
    address createdBy,
    uint40 createdAt,
    uint40 blockTime,
    uint40 unlockTime,
    uint256 balance,
    uint256 totalSupply
  ){
    return _tokenLockers[id_].getLockData();
  }

  function getLpLockData(uint40 id_) external view override returns (
    bool isLpToken,
    uint40 id,
    address contractAddress,
    address lockOwner,
    address token,
    address createdBy,
    uint40 createdAt,
    uint40 blockTime,
    uint40 unlockTime,
    uint256 balance,
    uint256 totalSupply
  ){
    return _lpLockers[id_].getLockData();
  }

  function getLpData(uint40 id_) external view override returns (
    bool hasLpData,
    uint40 id,
    address token0,
    address token1,
    uint256 balance0,
    uint256 balance1,
    uint256 price0,
    uint256 price1
  ) {
    return _lpLockers[id_].getLpData();
  }

  function getTokenLockersForAddress(address address_) external view override returns (uint40[] memory) {
    return _tokenLockersForAddress[address_];
  }

  function getLpLockersForAddress(address address_) external view override returns (uint40[] memory) {
    return _lpLockersForAddress[address_];
  }

  function notifyTokenLockerOwnerChange(uint40 id_, address newOwner_, address previousOwner_, address createdBy_) external override {
    require(
      _msgSender() == address(_tokenLockers[id_]),
      "Only the locker contract can call this function"
    );

    if (previousOwner_ != createdBy_) {
      for (uint256 i = 0; i < _tokenLockersForAddress[previousOwner_].length; i++) {
        if (_tokenLockersForAddress[previousOwner_][i] != id_) continue;
        _tokenLockersForAddress[previousOwner_][i] = _tokenLockersForAddress[
          previousOwner_][_tokenLockersForAddress[previousOwner_].length - 1
        ];
        _tokenLockersForAddress[previousOwner_].pop();
        break;
      }
    }

    bool hasId = false;
    for (uint256 i = 0; i < _tokenLockersForAddress[newOwner_].length; i++) {
      if (_tokenLockersForAddress[newOwner_][i] == id_) {
        hasId = true;
        break;
      }
    }
    if (!hasId) {
      _tokenLockersForAddress[newOwner_].push(id_);
    }
  }

  function notifyLpLockerOwnerChange(uint40 id_, address newOwner_, address previousOwner_, address createdBy_) external override {
    require(
      _msgSender() == address(_lpLockers[id_]),
      "Only the locker contract can call this function"
    );

    if (previousOwner_ != createdBy_) {
      for (uint256 i = 0; i < _lpLockersForAddress[previousOwner_].length; i++) {
        if (_lpLockersForAddress[previousOwner_][i] != id_) continue;
        _lpLockersForAddress[previousOwner_][i] = _lpLockersForAddress[
          previousOwner_][_lpLockersForAddress[previousOwner_].length - 1
        ];
        _lpLockersForAddress[previousOwner_].pop();
        break;
      }
    }

    bool hasId = false;
    for (uint256 i = 0; i < _lpLockersForAddress[newOwner_].length; i++) {
      if (_lpLockersForAddress[newOwner_][i] == id_) {
        hasId = true;
        break;
      }
    }
    if (!hasId) {
      _lpLockersForAddress[newOwner_].push(id_);
    }
  }

  function setLpLockerFee(uint256 _amount) external onlyOwner {
    LpLockerFee = _amount;
  }

  function setTokenLockerFee(uint256 _amount) external onlyOwner {
    TokenLockerFee = _amount;
  }

  function setFeeWallet(address _newWallet) external onlyOwner {
    feeWallet = _newWallet;
  }

  receive() external payable {}
}
