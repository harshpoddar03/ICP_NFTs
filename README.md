# ICP_NFTs

We have to use wsl to use the ICP SCKs and the DFX SDKs.

To install the DFX SDKs, run the following command in the terminal:

```bash
  sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

To initialize the project:

```bash
  dfx new ICP_NFTs
```

To build the project:

```bash
  dfx build
```

To run the project:

```bash
  dfx canister create --all
  dfx canister install --all
```

install rust if we don't have it:

```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

install npm if we don't have it:

```bash
  sudo apt install npm
```

install nodejs if we don't have it:

```bash
  sudo apt install nodejs
```

install the internet identity:

```bash
  dfx identity get-wallet
```

to generate the internet identity:

```bash
  dfx identity new
```

if running on playground, we have to run the following command:

```bash
  dfx deploy --playgroung
```

to generate the cannister:

```bash
  dfx canister create --all
```

