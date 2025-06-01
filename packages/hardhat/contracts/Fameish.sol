// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IAccount} from "lens-modules/contracts/extensions/account/IAccount.sol";
import {IGraph} from "lens-modules/contracts/core/interfaces/IGraph.sol";
import {FameishRandom} from "./helpers/FameishRandom.sol";
import {RuleChange, RuleProcessingParams, KeyValue} from "lens-modules/contracts/core/types/Types.sol";

contract Fameish is Initializable, AccessControlUpgradeable {
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

    uint256[50] private __gap;

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

    error InvalidInitializers();
    error InvalidAccount();
    error InvalidParams();
    error WinnerNotSet();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _accountManager,
        IGraph _lensGraph,
        FameishRandom _fameishRandom
    ) public initializer {
        if (_admin == address(0) || _accountManager == address(0)) {
            revert InvalidInitializers();
        }

        lensGraph = _lensGraph;
        fameishRandom = _fameishRandom;

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
        uint256 oldTotalFollows = totalFollows[oldWinner];
        uint256 oldTotalUnfollows = totalUnfollows[oldWinner];

        winner = _winner;
        totalFollows[winner] = 0;
        totalUnfollows[winner] = 0;
        winnerSetTimestamp = block.timestamp;

        emit WinnerChanged(
            oldWinner,
            oldTotalFollows,
            oldTotalUnfollows,
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

        KeyValue[] memory emptyKeyValue = new KeyValue[](0);
        RuleProcessingParams[]
            memory emptyRulesProcessingParams = new RuleProcessingParams[](0);

        for (uint256 i = 0; i < _followers.length; i++) {
            IAccount follower = _followers[i];

            if (!follower.canExecuteTransactions(address(this))) {
                continue; // Skip accounts that cannot execute transactions
            }

            bytes memory followData = abi.encodeWithSelector(
                lensGraph.follow.selector,
                address(follower),
                winner,
                emptyKeyValue,
                emptyRulesProcessingParams,
                emptyRulesProcessingParams,
                emptyKeyValue
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

        KeyValue[] memory emptyKeyValue = new KeyValue[](0);
        RuleProcessingParams[]
            memory emptyRulesProcessingParams = new RuleProcessingParams[](0);

        for (uint256 i = 0; i < _followers.length; i++) {
            IAccount follower = _followers[i];

            if (!follower.canExecuteTransactions(address(this))) {
                continue; // Skip accounts that cannot execute transactions
            }

            bytes memory unfollowData = abi.encodeWithSelector(
                lensGraph.unfollow.selector,
                address(follower),
                winner,
                emptyKeyValue,
                emptyRulesProcessingParams
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
