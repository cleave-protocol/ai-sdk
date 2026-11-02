export const ALLOWLIST = {
	"version": "2026-11-02.5",
	"nativeSentinel": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
	"acrossHandler": "0x0F7Ae28dE1C8532170AD4ee566B5801485c13a0E",
	"referral": {
		"sameChainBps": 0,
		"crossChainBps": 1,
		"stablecoinBps": 0
	},
	"gas": {
		"factory": "0x129f934211510b8C0Ac0ef07366f5dba92477c36",
		"feeRecipient": "0x94a58bf17B32521259F5Ce5A9aa27Ee4a056323B",
		"swap": {
			"template": "0x122d0a1e55d6Cd966c906AB27C4C74e7a3B9eD79",
			"versionTag": "0x9744c579ec32e4534ef3d6f2e0b49f87a1a014cc10f07a491df0e2ad2272dcc4",
			"initCodeHash": "0xc76e4cbffcdff814308300ace2e74aca62fff95bb80571c64768e66352297672"
		},
		"cross_chain": {
			"template": "0x9484F3f4930C0eF1b573a7062BAfF37E451f9035",
			"versionTag": "0x3ecb2a726296395d5f34da76ea67f3d19c3d2970e1d33a394f758a7fcc87a008",
			"initCodeHash": "0x3a228bdeea8677d726e9ef8c8cf180f15bbfd119e3bd09caf2ce894668e12ede"
		}
	},
	"chains": {
		"1": {
			"name": "Ethereum",
			"usdc": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			"usdcDecimals": 6,
			"wrappedNative": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
			"nativeSymbol": "ETH",
			"wrappedSymbol": "WETH",
			"composer": "0x436Ac858fD25706a8380b8AFb38Bc7538B852409",
			"houseReferrer": "0x69d3661ac6935a33D59b8A6964f0523182A5ae7d",
			"stablecoins": [
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				"0xdAC17F958D2ee523a2206206994597C13D831ec7"
			],
			"stargateRailId": "0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404",
			"gasDeliveryShell": "0xed10296A4B2F4E51674E4dEdCA1f53Dd9e0259f4",
			"gasPay": {
				"routerV3": "0x30809f82f8Df91e976B02F09dc64E0da8eFB1e92",
				"acrossUsdcAdapter": "0xdf88ef691b8eD60F61660fB5Ae937c405aB6415A",
				"railId": "0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916"
			},
			"targets": {
				"0x016750b998AaB0b4b07AA6a2276335053A798758": {
					"role": "swap_shell",
					"selectors": {
						"0xab33b1ec": "swapWithBlob"
					}
				},
				"0x5AfF91027390f731058AcC15E0A3F927b250c9FE": {
					"role": "measured_shell",
					"selectors": {
						"0xe0b7822f": "swapMeasuredWithBlobV1"
					}
				},
				"0x30809f82f8Df91e976B02F09dc64E0da8eFB1e92": {
					"role": "router_v3",
					"selectors": {
						"0x84022178": "crossChainSwap",
						"0xf79eec2e": "crossChainSwapNative",
						"0x9edd28ad": "bridgeToken"
					}
				},
				"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
					"role": "wrapped_native",
					"selectors": {
						"0xd0e30db0": "deposit",
						"0x2e1a7d4d": "withdraw"
					}
				},
				"0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5": {
					"role": "across_spoke_pool",
					"selectors": {
						"0xad5425c6": "deposit"
					}
				},
				"0x97CCDBea4632140639aD5eA9b944aa034eb15fD4": {
					"role": "across_periphery_native_only",
					"selectors": {
						"0x609ea081": "depositNative"
					}
				}
			},
			"lanes": {
				"10": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 10,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 10,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 10,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 10,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30111,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 2
				},
				"56": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 56,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 56,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 56,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30102
				},
				"137": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 137,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 137,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 137,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 137,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30109,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 7
				},
				"8453": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 8453,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 8453,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 8453,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30184,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 6
				},
				"42161": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 42161,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 42161,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 42161,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 42161,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30110,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 3
				}
			}
		},
		"10": {
			"name": "Optimism",
			"usdc": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
			"usdcDecimals": 6,
			"wrappedNative": "0x4200000000000000000000000000000000000006",
			"nativeSymbol": "ETH",
			"wrappedSymbol": "WETH",
			"composer": "0xAB708AEd94a07B9da06D92b4796988ee6eD0D32c",
			"houseReferrer": "0x69d3661ac6935a33D59b8A6964f0523182A5ae7d",
			"stablecoins": [
				"0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
				"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"
			],
			"stargateRailId": "0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404",
			"gasDeliveryShell": "0xe46A542F395eB64d482BCf504c529cdb05D70878",
			"gasPay": {
				"routerV3": "0x34FCCA283211224877F89F814eeA0a3a912fd354",
				"acrossUsdcAdapter": "0x28A4501fBb3d8A72Dc7A49Fbf262910d391659eE",
				"railId": "0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916"
			},
			"targets": {
				"0xb08F28a3575805ee1E3729fc19Ab7E869CBAF563": {
					"role": "swap_shell",
					"selectors": {
						"0xab33b1ec": "swapWithBlob"
					}
				},
				"0x003d4C95756608Ed4C11C5d0Ad9ca4c4076cAF20": {
					"role": "measured_shell",
					"selectors": {
						"0xe0b7822f": "swapMeasuredWithBlobV1"
					}
				},
				"0x34FCCA283211224877F89F814eeA0a3a912fd354": {
					"role": "router_v3",
					"selectors": {
						"0x84022178": "crossChainSwap",
						"0xf79eec2e": "crossChainSwapNative",
						"0x9edd28ad": "bridgeToken"
					}
				},
				"0x4200000000000000000000000000000000000006": {
					"role": "wrapped_native",
					"selectors": {
						"0xd0e30db0": "deposit",
						"0x2e1a7d4d": "withdraw"
					}
				},
				"0x6f26Bf09B1C792e3228e5467807a900A503c0281": {
					"role": "across_spoke_pool",
					"selectors": {
						"0xad5425c6": "deposit"
					}
				},
				"0x97CCDBea4632140639aD5eA9b944aa034eb15fD4": {
					"role": "across_periphery_native_only",
					"selectors": {
						"0x609ea081": "depositNative"
					}
				}
			},
			"lanes": {
				"1": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 1,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 1,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 1,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 1,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30101,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 0
				},
				"56": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 56,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 56,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 56,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30102
				},
				"137": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 137,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 137,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 137,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 137,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30109,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 7
				},
				"8453": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 8453,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 8453,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 8453,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30184,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 6
				},
				"42161": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 42161,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 42161,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 42161,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 42161,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30110,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 3
				}
			}
		},
		"56": {
			"name": "BNB Chain",
			"usdc": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
			"usdcDecimals": 18,
			"wrappedNative": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
			"nativeSymbol": "BNB",
			"wrappedSymbol": "WBNB",
			"composer": "0xE242F3DeB6B8d9e76e93b0bf5e461B12a722e86E",
			"houseReferrer": "0x69d3661ac6935a33D59b8A6964f0523182A5ae7d",
			"stablecoins": [
				"0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
				"0x55d398326f99059fF775485246999027B3197955"
			],
			"stargateRailId": "0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404",
			"gasDeliveryShell": "0xe648D17e146C736A7296BA72260fB2ed5bb58c99",
			"gasPay": null,
			"targets": {
				"0x48dD089939C9a29211e7De9417e91A141D37F697": {
					"role": "swap_shell",
					"selectors": {
						"0xab33b1ec": "swapWithBlob"
					}
				},
				"0xC269a4F4dEbD4036597ee830349d824D5bA9ca7E": {
					"role": "measured_shell",
					"selectors": {
						"0xe0b7822f": "swapMeasuredWithBlobV1"
					}
				},
				"0x02ED7CD8D60768797328B098ce0df2fa99db6f23": {
					"role": "router_v3",
					"selectors": {
						"0x84022178": "crossChainSwap",
						"0xf79eec2e": "crossChainSwapNative",
						"0x9edd28ad": "bridgeToken"
					}
				},
				"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c": {
					"role": "wrapped_native",
					"selectors": {
						"0xd0e30db0": "deposit",
						"0x2e1a7d4d": "withdraw"
					}
				},
				"0x4e8E101924eDE233C13e2D8622DC8aED2872d505": {
					"role": "across_spoke_pool",
					"selectors": {
						"0xad5425c6": "deposit"
					}
				},
				"0x97CCDBea4632140639aD5eA9b944aa034eb15fD4": {
					"role": "across_periphery_native_only",
					"selectors": {
						"0x609ea081": "depositNative"
					}
				}
			},
			"lanes": {
				"1": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 1,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 1,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 1,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30101
				},
				"10": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 10,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 10,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 10,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30111
				},
				"137": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 137,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 137,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 137,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30109
				},
				"8453": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 8453,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 8453,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 8453,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30184
				},
				"42161": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 42161,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 42161,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 42161,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30110
				}
			}
		},
		"137": {
			"name": "Polygon",
			"usdc": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
			"usdcDecimals": 6,
			"wrappedNative": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
			"nativeSymbol": "POL",
			"wrappedSymbol": "WPOL",
			"composer": "0x6Cbc5c7AA249EDD719001786b6e0a07D44027693",
			"houseReferrer": "0x69d3661ac6935a33D59b8A6964f0523182A5ae7d",
			"stablecoins": [
				"0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
				"0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
			],
			"stargateRailId": "0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404",
			"gasDeliveryShell": "0x02ED7CD8D60768797328B098ce0df2fa99db6f23",
			"gasPay": {
				"routerV3": "0xEa0E8caE2dba07D3BC828f42fd6219fF93ddCe97",
				"acrossUsdcAdapter": "0x25b14009e495D781D2180d3E3B3a86050967dd2A",
				"railId": "0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916"
			},
			"targets": {
				"0x5b4a223D8489a3b97d4EBe8fE93C6A7aC3Ec1AD6": {
					"role": "swap_shell",
					"selectors": {
						"0xab33b1ec": "swapWithBlob"
					}
				},
				"0xA06eE4d57A2E6ea9213Ab4Bce2C055fD09BB43A1": {
					"role": "measured_shell",
					"selectors": {
						"0xe0b7822f": "swapMeasuredWithBlobV1"
					}
				},
				"0xEa0E8caE2dba07D3BC828f42fd6219fF93ddCe97": {
					"role": "router_v3",
					"selectors": {
						"0x84022178": "crossChainSwap",
						"0xf79eec2e": "crossChainSwapNative",
						"0x9edd28ad": "bridgeToken"
					}
				},
				"0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": {
					"role": "wrapped_native",
					"selectors": {
						"0xd0e30db0": "deposit",
						"0x2e1a7d4d": "withdraw"
					}
				},
				"0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096": {
					"role": "across_spoke_pool",
					"selectors": {
						"0xad5425c6": "deposit"
					}
				},
				"0x97CCDBea4632140639aD5eA9b944aa034eb15fD4": {
					"role": "across_periphery_native_only",
					"selectors": {
						"0x609ea081": "depositNative"
					}
				}
			},
			"lanes": {
				"1": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 1,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 1,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 1,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 1,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30101,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 0
				},
				"10": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 10,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 10,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 10,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 10,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30111,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 2
				},
				"56": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 56,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 56,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 56,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30102
				},
				"8453": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 8453,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 8453,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 8453,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30184,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 6
				},
				"42161": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 42161,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 42161,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 42161,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 42161,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30110,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 3
				}
			}
		},
		"8453": {
			"name": "Base",
			"usdc": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
			"usdcDecimals": 6,
			"wrappedNative": "0x4200000000000000000000000000000000000006",
			"nativeSymbol": "ETH",
			"wrappedSymbol": "WETH",
			"composer": "0x58b73b40b5ED797833955397dF989AA2DEdD50A4",
			"houseReferrer": "0x69d3661ac6935a33D59b8A6964f0523182A5ae7d",
			"stablecoins": [
				"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
				"0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"
			],
			"stargateRailId": "0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404",
			"gasDeliveryShell": "0x3A4569133c21013bbBc99a733FB891A7fffafD9a",
			"gasPay": {
				"routerV3": "0x545fef65c37ECEE32309d879ABafaa959E9F114C",
				"acrossUsdcAdapter": "0x1000517094c532f0e4fF0E61fC6cD33daea2E64f",
				"railId": "0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916"
			},
			"targets": {
				"0xb08F28a3575805ee1E3729fc19Ab7E869CBAF563": {
					"role": "swap_shell",
					"selectors": {
						"0xab33b1ec": "swapWithBlob"
					}
				},
				"0x003d4C95756608Ed4C11C5d0Ad9ca4c4076cAF20": {
					"role": "measured_shell",
					"selectors": {
						"0xe0b7822f": "swapMeasuredWithBlobV1"
					}
				},
				"0x545fef65c37ECEE32309d879ABafaa959E9F114C": {
					"role": "router_v3",
					"selectors": {
						"0x84022178": "crossChainSwap",
						"0xf79eec2e": "crossChainSwapNative",
						"0x9edd28ad": "bridgeToken"
					}
				},
				"0x4200000000000000000000000000000000000006": {
					"role": "wrapped_native",
					"selectors": {
						"0xd0e30db0": "deposit",
						"0x2e1a7d4d": "withdraw"
					}
				},
				"0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64": {
					"role": "across_spoke_pool",
					"selectors": {
						"0xad5425c6": "deposit"
					}
				},
				"0x97CCDBea4632140639aD5eA9b944aa034eb15fD4": {
					"role": "across_periphery_native_only",
					"selectors": {
						"0x609ea081": "depositNative"
					}
				}
			},
			"lanes": {
				"1": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 1,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 1,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 1,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30101,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 0
				},
				"10": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 10,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 10,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 10,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30111,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 2
				},
				"56": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 56,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 56,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 56,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30102
				},
				"137": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 137,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 137,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 137,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30109,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 7
				},
				"42161": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 42161,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 42161,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 42161,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30110,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 3
				}
			}
		},
		"42161": {
			"name": "Arbitrum",
			"usdc": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
			"usdcDecimals": 6,
			"wrappedNative": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
			"nativeSymbol": "ETH",
			"wrappedSymbol": "WETH",
			"composer": "0xe484191bfF3e4DED3520d1D8e0fcf098CAef4cE4",
			"houseReferrer": "0x69d3661ac6935a33D59b8A6964f0523182A5ae7d",
			"stablecoins": [
				"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
				"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
			],
			"stargateRailId": "0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404",
			"gasDeliveryShell": "0x02ED7CD8D60768797328B098ce0df2fa99db6f23",
			"gasPay": {
				"routerV3": "0xEa0E8caE2dba07D3BC828f42fd6219fF93ddCe97",
				"acrossUsdcAdapter": "0x25b14009e495D781D2180d3E3B3a86050967dd2A",
				"railId": "0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916"
			},
			"targets": {
				"0x4052700f83324Be5710d187b7bbEa9837DfFa8fc": {
					"role": "swap_shell",
					"selectors": {
						"0xab33b1ec": "swapWithBlob"
					}
				},
				"0x78D851D8BC6A9b9739549E7515Bf02D6394E1794": {
					"role": "measured_shell",
					"selectors": {
						"0xe0b7822f": "swapMeasuredWithBlobV1"
					}
				},
				"0xEa0E8caE2dba07D3BC828f42fd6219fF93ddCe97": {
					"role": "router_v3",
					"selectors": {
						"0x84022178": "crossChainSwap",
						"0xf79eec2e": "crossChainSwapNative",
						"0x9edd28ad": "bridgeToken"
					}
				},
				"0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": {
					"role": "wrapped_native",
					"selectors": {
						"0xd0e30db0": "deposit",
						"0x2e1a7d4d": "withdraw"
					}
				},
				"0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A": {
					"role": "across_spoke_pool",
					"selectors": {
						"0xad5425c6": "deposit"
					}
				},
				"0x97CCDBea4632140639aD5eA9b944aa034eb15fD4": {
					"role": "across_periphery_native_only",
					"selectors": {
						"0x609ea081": "depositNative"
					}
				}
			},
			"lanes": {
				"1": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 1,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 1,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 1,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 1,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30101,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 0
				},
				"10": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 10,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 10,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 10,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 10,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30111,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 2
				},
				"56": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 56,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 56,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 56,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30102
				},
				"137": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 137,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 137,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 137,
					"0x61a012ca05dbda272441751b0a350f6bbf2996f752862f4eba3fce9c7e8a89e6": 137,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30109,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 7
				},
				"8453": {
					"0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916": 8453,
					"0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328": 8453,
					"0xcadb263249f9536655ea392f5245afe7bf96a0ed7ff0095bb817c6a77c9b8d84": 8453,
					"0xb247d4fab2445d0279df94160c242cb8298d9aea57aa6b6af3c9dfddce2d1404": 30184,
					"0xed0f0a3ae066b02930027c7cc065548bade2974a98f517699d023130faa00e23": 6
				}
			}
		}
	}
} as const;
