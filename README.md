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
  dfx identity new my_identity
```

to generate the cannister:

```bash
  dfx canister create --all
```
to list the identity:

```bash
  dfx identity list
```

to use the identity:

```bash
  dfx identity use my_identity
```

to see canister info:
  
  ```bash
    dfx canister info <canister_id>
  ```

  to change cannister access:

    ```bash
      dfx canister update-settings ICP_NFTs_frontend --add-controller $(dfx --identity=your-identity-name identity get-principal)
    ```