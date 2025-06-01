| Slot | Variable Name        | Type                                   | Origin                              |
|------|----------------------|----------------------------------------|-------------------------------------|
| 0    | `_roles`             | `mapping(bytes32 => RoleData)`         | AccessControlUpgradeable            |
| 1    | `__gap[0]`           | `uint256`                              | AccessControlUpgradeable (gap)[0]   |
| 2    | `__gap[1]`           | `uint256`                              | AccessControlUpgradeable (gap)[1]   |
| ⋮    | `···`                | `···`                                  | AccessControlUpgradeable (gap)[…]   |
| 49   | `__gap[48]`          | `uint256`                              | AccessControlUpgradeable (gap)[48]  |
| 50   | `lensGraph`          | `IGraph (interface ⇒ address)`         | Fameish (slot 50)                   |
| 51   | `fameishRandom`      | `FameishRandom (interface ⇒ address)`  | Fameish (slot 51)                   |
| 52   | `winner`             | `address`                              | Fameish (slot 52)                   |
| 53   | `followerIndex`      | `uint256`                              | Fameish (slot 53)                   |
| 54   | `followerCount`      | `uint256`                              | Fameish (slot 54)                   |
| 55   | `followerListURI`    | `string`                               | Fameish (slot 55 – pointer to data) |
| 56   | `winnerSetTimestamp` | `uint256`                              | Fameish (slot 56)                   |
| 57   | `totalFollows`       | `mapping(address => uint256)`          | Fameish (slot 57 – mapping base)    |
| 58   | `totalUnfollows`     | `mapping(address => uint256)`          | Fameish (slot 58 – mapping base)    |
| 59   | `__gap[0]`           | `uint256`                              | Fameish (own gap)[0]                |
| 60   | `__gap[1]`           | `uint256`                              | Fameish (own gap)[1]                |
| ⋮    | `···`                | `···`                                  | Fameish (own gap)[…]                |
| 108  | `__gap[49]`          | `uint256`                              | Fameish (own gap)[49]               |
