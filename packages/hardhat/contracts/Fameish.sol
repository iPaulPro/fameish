// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Account} from "lens-modules/contracts/extensions/account/Account.sol";
import {Graph} from "lens-modules/contracts/core/primitives/graph/Graph.sol";
import {FameishRandom} from "./FameishRandom.sol";
import {RuleChange, RuleProcessingParams, KeyValue} from "lens-modules/contracts/core/types/Types.sol";

contract Fameish is AccessControl {
    event RandomIndexSelected(
        uint256 indexed randomIndex,
        string followerListURI,
        uint256 followerCount
    );
    event WinnerSet(address indexed winner);

    error InvalidConstructorParams();
    error InvalidAccountParams();

    bytes32 public constant ACCOUNT_MANAGER = keccak256("ACCOUNT_MANAGER");

    Graph public lensGraph;
    FameishRandom public fameishRandom;

    address public winner;
    uint256 public followerIndex;
    uint256 public followerCount;
    string public followerListURI;
    uint256 public winnerSetTimestamp;

    mapping(address account => uint256 totalFollows) public totalFollows;
    mapping(address account => uint256 totalUnfollows) public totalUnfollows;

    constructor(
        address _accountManager,
        address _lensGraph,
        address _fameishRandomAddress
    ) {
        if (
            _accountManager == address(0) ||
            _lensGraph == address(0) ||
            _fameishRandomAddress == address(0)
        ) {
            revert InvalidConstructorParams();
        }

        lensGraph = Graph(_lensGraph);
        fameishRandom = FameishRandom(_fameishRandomAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ACCOUNT_MANAGER, _accountManager);
    }

    function selectRandom(
        uint256 _followerCount,
        string calldata _followerListURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        followerIndex = fameishRandom.randomInRange(0, _followerCount - 1);
        followerCount = _followerCount;
        followerListURI = _followerListURI;
        emit RandomIndexSelected(
            followerIndex,
            _followerListURI,
            _followerCount
        );
        return followerIndex;
    }

    function setWinner(address _winner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_winner == address(0)) {
            revert InvalidAccountParams();
        }
        winner = _winner;
        totalFollows[_winner] = 0;
        totalUnfollows[_winner] = 0;
        winnerSetTimestamp = block.timestamp;
        emit WinnerSet(_winner);
    }

    function bulkFollow(
        address payable[] calldata _followers
    ) external onlyRole(ACCOUNT_MANAGER) {
        for (uint256 i = 0; i < _followers.length; i++) {
            address payable follower = _followers[i];
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

            bytes memory followData = abi.encodeWithSelector(
                lensGraph.follow.selector,
                follower,
                winner,
                customParams,
                graphRulesProcessingParams,
                followRulesProcessingParams,
                extraData
            );

            bytes memory executeData = abi.encodeWithSelector(
                Account.executeTransaction.selector,
                address(lensGraph),
                0,
                followData
            );

            (bool success, ) = follower.delegatecall(executeData);
            if (success) {
                totalFollows[winner]++;
            }
        }
    }

    function bulkUnfollow(
        address payable[] calldata _followers
    ) external onlyRole(ACCOUNT_MANAGER) {
        for (uint256 i = 0; i < _followers.length; i++) {
            address payable follower = _followers[i];
            KeyValue[] memory customParams = new KeyValue[](0);
            RuleProcessingParams[]
                memory graphRulesProcessingParams = new RuleProcessingParams[](
                    0
                );

            bytes memory unfollowData = abi.encodeWithSelector(
                lensGraph.unfollow.selector,
                follower,
                winner,
                customParams,
                graphRulesProcessingParams
            );

            bytes memory executeData = abi.encodeWithSelector(
                Account.executeTransaction.selector,
                address(lensGraph),
                0,
                unfollowData
            );

            (bool success, ) = follower.delegatecall(executeData);
            if (success) {
                totalUnfollows[winner]++;
            }
        }
    }
}
