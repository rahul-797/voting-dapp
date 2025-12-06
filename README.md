solana config set -ul
anchor build

If manually running validator (recommended)
    solana-test-validator --reset
    anchor deploy
    anchor test --skip-local-validator

Direct test (It will start local validator each time from scratch, so can't work with previous data)
    anchor test