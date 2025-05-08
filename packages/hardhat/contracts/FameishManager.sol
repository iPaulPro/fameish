// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Account} from "lens-modules/contracts/extensions/account/Account.sol";
import {Graph} from "lens-modules/contracts/core/primitives/graph/Graph.sol";
import {FameishRandom} from "./FameishRandom.sol";
import {RuleChange, RuleProcessingParams, KeyValue} from "lens-modules/contracts/core/types/Types.sol";

contract FameishManager is Ownable {
    error InvalidConstructorParams();

    Graph public lensGraph;
    FameishRandom public fameishRandom;

    address public fameishAccount;

    mapping(address account => uint256 totalFollows) public totalFollows;
    mapping(address account => uint256 totalUnfollows) public totalUnfollows;

    constructor(address _lensGraph, address _fameishRandomAddress) {
        if (_lensGraph == address(0) || _fameishRandomAddress == address(0)) {
            revert InvalidConstructorParams();
        }

        lensGraph = Graph(_lensGraph);
        fameishRandom = FameishRandom(_fameishRandomAddress);
    }

    function setFameishAccount(address _fameishAccount) external onlyOwner {
        require(_fameishAccount != address(0), "Invalid Fameish account");
        fameishAccount = _fameishAccount;
    }

    function bulkFollow(
        address payable[] calldata _followers
    ) external onlyOwner {
        for (uint256 i = 0; i < _followers.length; i++) {
            address payable followerAccount = _followers[i];
            KeyValue[] memory customParams = new KeyValue[](0);
            RuleProcessingParams[]
                memory graphRulesProcessingParams = new RuleProcessingParams[](
                    0
                );
            RuleProcessingParams[]
                memory followRulesProcessingParams = new RuleProcessingParams[](
                    0
                );
            KeyValue[] memory extraData = new KeyValue[](0);

            bytes memory data = abi.encodeWithSelector(
                lensGraph.follow.selector,
                followerAccount,
                fameishAccount,
                customParams,
                graphRulesProcessingParams,
                followRulesProcessingParams,
                extraData
            );

            Account account = Account(followerAccount);
            try
                account.executeTransaction(address(lensGraph), 0, data)
            returns (bytes memory) {
                totalFollows[fameishAccount]++;
            } catch {
                // Continue execution even if the call fails.
            }
        }
    }

    function bulkUnfollow(
        address payable[] calldata _followers
    ) external onlyOwner {
        for (uint256 i = 0; i < _followers.length; i++) {
            address payable followerAccount = _followers[i];
            KeyValue[] memory customParams = new KeyValue[](0);
            RuleProcessingParams[]
                memory graphRulesProcessingParams = new RuleProcessingParams[](
                    0
                );

            bytes memory data = abi.encodeWithSelector(
                lensGraph.unfollow.selector,
                followerAccount,
                fameishAccount,
                customParams,
                graphRulesProcessingParams
            );

            Account account = Account(followerAccount);
            try
                account.executeTransaction(address(lensGraph), 0, data)
            returns (bytes memory) {
                totalUnfollows[fameishAccount]++;
            } catch {
                // Continue execution even if the call fails.
            }
        }
    }
}
