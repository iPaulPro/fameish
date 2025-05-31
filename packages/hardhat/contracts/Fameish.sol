// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IAccount} from "lens-modules/contracts/extensions/account/IAccount.sol";
import {IGraph} from "lens-modules/contracts/core/interfaces/IGraph.sol";
import {FameishRandom} from "./helpers/FameishRandom.sol";
import {RuleChange, RuleProcessingParams, KeyValue} from "lens-modules/contracts/core/types/Types.sol";

contract Fameish is Initializable, AccessControlUpgradeable {
    event RandomIndexSelected(
        uint256 randomIndex,
        string indexed followerListURI,
        uint256 followerCount
    );
    event WinnerChanged(
        address indexed oldWinner,
        uint256 oldWinnerTotalFollows,
        uint256 oldWinnerTotalUnfollows,
        address indexed newWinner,
        string indexed followerListURI
    );

    error InvalidConstructor();
    error InvalidAccount();
    error InvalidParams();
    error WinnerNotSet();

    bytes32 public constant ACCOUNT_MANAGER = keccak256("ACCOUNT_MANAGER");

    IGraph public lensGraph;
    FameishRandom public fameishRandom;

    address public winner;
    uint256 public followerIndex;
    uint256 public followerCount;
    string public followerListURI;
    uint256 public winnerSetTimestamp;

    mapping(address account => uint256 totalFollows) public totalFollows;
    mapping(address account => uint256 totalUnfollows) public totalUnfollows;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _accountManager,
        address _lensGraph,
        address _fameishRandom
    ) public initializer {
        if (
            _accountManager == address(0) ||
            _lensGraph == address(0) ||
            _fameishRandom == address(0)
        ) {
            revert InvalidConstructor();
        }

        lensGraph = IGraph(_lensGraph);
        fameishRandom = FameishRandom(_fameishRandom);

        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ACCOUNT_MANAGER, _accountManager);
    }

    function selectRandom(
        uint256 _followerCount,
        string calldata _followerListURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        if (_followerCount < 3 || bytes(_followerListURI).length == 0) {
            revert InvalidParams();
        }

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
            revert InvalidAccount();
        }
        address oldWinner = winner;
        winner = _winner;
        totalFollows[_winner] = 0;
        totalUnfollows[_winner] = 0;
        winnerSetTimestamp = block.timestamp;
        emit WinnerChanged(
            oldWinner,
            totalFollows[winner],
            totalUnfollows[winner],
            _winner,
            followerListURI
        );
    }

    function bulkFollow(
        IAccount[] calldata _followers
    ) external onlyRole(ACCOUNT_MANAGER) {
        if (winner == address(0)) {
            revert WinnerNotSet();
        }

        for (uint256 i = 0; i < _followers.length; i++) {
            IAccount follower = _followers[i];

            if (!follower.canExecuteTransactions(address(this))) {
                continue; // Skip accounts that cannot execute transactions
            }

            bytes memory followData = abi.encodeWithSelector(
                lensGraph.follow.selector,
                address(follower),
                winner,
                new KeyValue[](0),
                new RuleProcessingParams[](0),
                new RuleProcessingParams[](0),
                new KeyValue[](0)
            );

            try
                follower.executeTransaction(address(lensGraph), 0, followData)
            returns (bytes memory) {
                totalFollows[winner]++;
            } catch {
                // Handle failure silently
            }
        }
    }

    function bulkUnfollow(
        IAccount[] calldata _followers
    ) external onlyRole(ACCOUNT_MANAGER) {
        if (winner == address(0)) {
            revert WinnerNotSet();
        }

        for (uint256 i = 0; i < _followers.length; i++) {
            IAccount follower = _followers[i];

            if (!follower.canExecuteTransactions(address(this))) {
                continue; // Skip accounts that cannot execute transactions
            }

            bytes memory unfollowData = abi.encodeWithSelector(
                lensGraph.unfollow.selector,
                address(follower),
                winner,
                new KeyValue[](0),
                new RuleProcessingParams[](0)
            );

            try
                follower.executeTransaction(address(lensGraph), 0, unfollowData)
            returns (bytes memory) {
                totalUnfollows[winner]++;
            } catch {
                // Handle failure silently
            }
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
