// Solana DAO NFT Contract IDL
// This is a placeholder IDL that matches the contract structure we defined

export const IDL = {
  "version": "0.1.0",
  "name": "solana_dao_nft_contract",
  "instructions": [
    {
      "name": "createNft",
      "accounts": [
        {
          "name": "nft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionalNft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionalMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionalVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collectionName",
          "type": "string"
        },
        {
          "name": "nftName",
          "type": "string"
        },
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "isCustodial",
          "type": "bool"
        },
        {
          "name": "buyPriceUsdt",
          "type": "u64"
        },
        {
          "name": "rarity",
          "type": "string"
        },
        {
          "name": "mintQuantity",
          "type": "u64"
        },
        {
          "name": "isUpgradeable",
          "type": "bool"
        },
        {
          "name": "isEvolvable",
          "type": "bool"
        },
        {
          "name": "isFractionalEligible",
          "type": "bool"
        },
        {
          "name": "autoStakingDuration",
          "type": "string"
        },
        {
          "name": "earnOnSpendRatio",
          "type": "u64"
        },
        {
          "name": "upgradeBonusRatio",
          "type": "u64"
        },
        {
          "name": "evolutionMinInvestment",
          "type": "u64"
        },
        {
          "name": "evolutionEarningsRatio",
          "type": "u64"
        },
        {
          "name": "passiveIncomeRate",
          "type": "u64"
        },
        {
          "name": "custodialIncomeRate",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "fractionalSupply",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "updateNft",
      "accounts": [
        {
          "name": "nft",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "collectionName",
          "type": "string"
        },
        {
          "name": "nftName",
          "type": "string"
        },
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "buyPriceUsdt",
          "type": "u64"
        },
        {
          "name": "rarity",
          "type": "string"
        },
        {
          "name": "mintQuantity",
          "type": "u64"
        },
        {
          "name": "isUpgradeable",
          "type": "bool"
        },
        {
          "name": "isEvolvable",
          "type": "bool"
        },
        {
          "name": "isFractionalEligible",
          "type": "bool"
        },
        {
          "name": "autoStakingDuration",
          "type": "string"
        },
        {
          "name": "earnOnSpendRatio",
          "type": "u64"
        },
        {
          "name": "upgradeBonusRatio",
          "type": "u64"
        },
        {
          "name": "evolutionMinInvestment",
          "type": "u64"
        },
        {
          "name": "evolutionEarningsRatio",
          "type": "u64"
        },
        {
          "name": "passiveIncomeRate",
          "type": "u64"
        },
        {
          "name": "custodialIncomeRate",
          "type": {
            "option": "u64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "nftAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "collectionName",
            "type": "string"
          },
          {
            "name": "nftName",
            "type": "string"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "custodyType",
            "type": "u8"
          },
          {
            "name": "buyPriceUsdt",
            "type": "u64"
          },
          {
            "name": "rarity",
            "type": "string"
          },
          {
            "name": "mintQuantity",
            "type": "u64"
          },
          {
            "name": "isUpgradeable",
            "type": "bool"
          },
          {
            "name": "isEvolvable",
            "type": "bool"
          },
          {
            "name": "isFractionalEligible",
            "type": "bool"
          },
          {
            "name": "autoStakingDuration",
            "type": "string"
          },
          {
            "name": "earnOnSpendRatio",
            "type": "u64"
          },
          {
            "name": "upgradeBonusRatio",
            "type": "u64"
          },
          {
            "name": "evolutionMinInvestment",
            "type": "u64"
          },
          {
            "name": "evolutionEarningsRatio",
            "type": "u64"
          },
          {
            "name": "passiveIncomeRate",
            "type": "u64"
          },
          {
            "name": "custodialIncomeRate",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "lastDistributionTimestamp",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CustodyType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NonCustodial"
          },
          {
            "name": "Custodial"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "AccountShouldNotBeUsed",
      "msg": "This account should not be used for this NFT type."
    },
    {
      "code": 6001,
      "name": "InvalidCustodyType",
      "msg": "The NFT is not a custodial type."
    },
    {
      "code": 6002,
      "name": "InvalidNonCustodyType",
      "msg": "The NFT is not a non-custodial type."
    },
    {
      "code": 6003,
      "name": "SupplyCapReached",
      "msg": "The fractional supply cap has been reached for this NFT."
    },
    {
      "code": 6004,
      "name": "MissingFractionalSupply",
      "msg": "Fractional supply must be provided for a non-custodial NFT."
    },
    {
      "code": 6005,
      "name": "InsufficientBalanceForVote",
      "msg": "You do not have enough tokens to vote."
    },
    {
      "code": 6006,
      "name": "MissingRequiredAccountsForNonCustodial",
      "msg": "Required accounts for non-custodial NFT were not provided."
    },
    {
      "code": 6007,
      "name": "UnauthorizedAdmin",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6008,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6009,
      "name": "ZeroInvestmentAmount",
      "msg": "Investment amount must be greater than zero."
    },
    {
      "code": 6010,
      "name": "InvalidProposalId",
      "msg": "Invalid proposal ID."
    },
    {
      "code": 6011,
      "name": "InvalidProposalType",
      "msg": "Invalid proposal type."
    }
  ]
};

export type SolanaDaoNftContract = {
  "address": "81y1B91W78o5zLz6Lg8P96Y7JvW4Y9q6D8W2o7Jz8K9",
  "metadata": {
    "name": "solana_dao_nft_contract",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": typeof IDL.instructions,
  "accounts": typeof IDL.accounts,
  "types": typeof IDL.types,
  "errors": typeof IDL.errors
};







