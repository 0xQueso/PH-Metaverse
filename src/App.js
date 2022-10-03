import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import SelectCharacter from './Components/SelectCharacter';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import { abi } from './utils/abi.json'
import { ethers } from 'ethers';
import Arena from './Components/Arena';

import './App.css';

// Constants
const TWITTER_HANDLE = '0xqueue';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState(null);

  const renderContent = () => {
    if (!currentAccount) {
      return (
          <div className="connect-wallet-container">
            <img
                src="https://64.media.tumblr.com/tumblr_mbia5vdmRd1r1mkubo1_500.gifv"
                alt="Monty Python Gif"
            />
            <button
                className="cta-button connect-wallet-button"
                onClick={connectWalletAction}
            >
              Connect Wallet To Get Started
            </button>
          </div>
      );
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    } else if (currentAccount && characterNFT) {
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT}  />;
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);

        const accounts = await ethereum.request({method: 'eth_accounts'});

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('account = ' + account);
          setCurrentAccount(account);
        } else {
          console.log('No authorized account found');
        }

      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWalletAction = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        console.log('no wallet')
        return
      }

      const accounts = await ethereum.request({method: 'eth_requestAccounts'})

      console.log('connected: ' + accounts[0])
      setCurrentAccount(accounts[0])

    }
    catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    const fetchNFTMetadata = async () => {

      let chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
        return
      }

      console.log('Checking for Character NFT on address:', currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          signer
      );
      const txn = await gameContract.checkIfUserHasNFT();

      if (txn.name) {
        console.log('User has character NFT');
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log('No character NFT found');
      }
    };

    if (currentAccount) {
      console.log('CurrentAccount:', currentAccount);
      fetchNFTMetadata();
    }
  }, [currentAccount]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text"> 🇵🇭 War on Duts ⚔️</p>
          <p className="sub-text">dethrone d30!</p>
            {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
