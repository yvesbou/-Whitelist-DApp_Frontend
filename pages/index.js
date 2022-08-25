import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_CHAIN, DEFAULT_CHAIN_ID, WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
  */
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    // ethers wrapper around the provider (comfort/convenience)
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    console.log(chainId)
    if (chainId !== DEFAULT_CHAIN_ID) {
      window.alert("Change the network");
      throw new Error("Change network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  const addAddressToWhitelist = async () => {
    console.log('executed')
    try {
      // we will perform a write transaction, thus we need the signer
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call func from the contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // wait for the transaction to get mined
      setLoading(false);
      const numWhitelisted = await getNumberOfWhitelisted();
      setNumberOfWhitelisted(numWhitelisted);
      setJoinedWhitelist(true);
    } catch (error) {
      console.error(error);
    }
  }

  const getNumberOfWhitelisted = async () => {
    try {
      // no need for signer, only read rpc connection needed
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      
      const numWhitelisted = await whitelistContract.getNumAddressesWhitelisted();

      setNumberOfWhitelisted(numWhitelisted);
    } catch (error) {
      console.error(error);
    }
  }

  const checkIfAddressInWhitelist = async () => {
    try {
      // even though we do only a read operation
      // we use the signer, because we need the address
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      
      const address = await signer.getAddress();

      // calling the mapping from the contract, returns bool
      const _joinedWhitelist = await whitelistContract.addressWhitelisted(address);
      
      setJoinedWhitelist(_joinedWhitelist);

    } catch (error) {
      console.error(error);
    }
  }

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (error) {
      console.error(error);
    }
  }

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading ...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        )
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      )
    }
  }

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal
    console.log(walletConnected)
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: DEFAULT_CHAIN,
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  // useEffect(() => {
  //   if (walletConnected){
  //     const listenToAccountsChanged = async () => {
  //       // const provider = await web3ModalRef.current.connect();
  //       const web3provider = await getProviderOrSigner(true);
  //       console.log(web3provider)
  //       // const web3Provider = new providers.Web3Provider(provider);
  //       // console.log(web3Provider)
  //       web3provider.provider.on("accountsChanged", (accounts) => {
  //         console.log(accounts);
  //       });
  //     }

  //     listenToAccountsChanged();
  //   }
  
    
  // }, )
  

  return (
    <div>
      <Head>
        <title>Whitelist DApp</title>
        <meta name='description' content='Whitelist-DApp'></meta>
        <link rel='icon' href="/favicon.ico"></link>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg"></img>
        </div>
      </div>
      <footer>
        Made with &#10084; by Yves 
      </footer>
    </div>
  )

}
