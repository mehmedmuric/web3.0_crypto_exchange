import React from "react";
import {useEthers} from '@usedapp/core';
import {uniswapLogo} from './assets';
import styles from './styles';
import { WalletButton, Loader, Exchange } from "./components";
import { usePools } from './hooks'


const App = () => {
  const {account} = useEthers();
  const [loading, pools] = usePools();

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <header className={styles.header}>
          <img src={uniswapLogo} alt="logo" className="w-16 h-16 object-contain"/>
          <WalletButton />
        </header>
        <div className={styles.exchangeContainer}>
          <h1 className={styles.headTitle}>Mehmed Muric Web3.0 Exchange</h1>
          <p className={styles.subTitle}>Exchange Tokens In Seconds</p>
          <div className={styles.exchangeBoxWrapper}>
            <div className={styles.exchangeBox}>
              <div className="pink_gradient"/>
              <div className={styles.exchange}>
                {account ? (
                  loading ? (
                    <Loader title='Loading pools...'/>
                  ) : ( 
                    <Exchange pools={pools}/>
                  )
                ) : ( <Loader title='Please connect your wallet'/> )}
              </div>
              <div className="blue_gradient"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App;