// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import { IERC20 } from "./library/IERC20.sol";
import { IUniswapV2Pair } from "./library/Dex.sol";

library Util {
  function getTokenData(address address_) external view returns (
    string memory name,
    string memory symbol,
    uint8 decimals,
    uint256 totalSupply,
    uint256 balance
  ){
    IERC20 _token = IERC20(address_);
    name = _token.name();
    symbol = _token.symbol();
    decimals = _token.decimals();
    totalSupply = _token.totalSupply();
    balance = _token.balanceOf(msg.sender);
  }

  function isLpToken(address address_) external view returns (bool) {
    IUniswapV2Pair pair = IUniswapV2Pair(address_);
    try pair.token0() returns (address tokenAddress_) {
      return tokenAddress_ != address(0);
    } catch Error(string memory /* reason */) {
      return false;
    } catch (bytes memory /* lowLevelData */) {
      return false;
    }
  }

  function getLpData(address address_) external view returns (
    address token0,
    address token1,
    uint256 balance0,
    uint256 balance1,
    uint256 price0,
    uint256 price1
  ) {
    IUniswapV2Pair _pair = IUniswapV2Pair(address_);
    token0 = _pair.token0();
    token1 = _pair.token1();
    balance0 = IERC20(token0).balanceOf(address(_pair));
    balance1 = IERC20(token1).balanceOf(address(_pair));
    price0 = _pair.price0CumulativeLast();
    price1 = _pair.price1CumulativeLast();
  }
}
