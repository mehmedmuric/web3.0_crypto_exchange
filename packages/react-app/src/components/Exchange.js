import React, { useEffect, useState } from 'react';
import styles from '../styles';
import {getAvailableTokens, getCounterpartTokens, findPoolByTokens, isOperationPending, getFailureMessage, getSuccessMessage} from '../utils';
import { Contract } from '@ethersproject/contracts';
import { ERC20, useContractFunction, useEthers, useTokenAllowance, useTokenBalance } from '@usedapp/core';
import { ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { ROUTER_ADDRESS } from '../config';
import { abis } from '@my-app/contracts';
import { AmountIn, AmountOut, Balance} from './';



const Exchange = ({pools}) => {
  const {account} = useEthers();
  const [fromValue, setFromValue] = useState('0');
  const [fromToken, setFromToken] = useState(pools[0].token0Address);
  const [toToken, setToToken] = useState('');
  const [resetState, setResetState] = useState(false);

  const fromValueBigNumber = parseUnits(fromValue);
  const availableTokens = getAvailableTokens(pools);
  const counterpartTokens = getCounterpartTokens(pools, fromToken);
  const pairAddress = findPoolByTokens(pools, fromToken, toToken)?.address ?? '';

  const routerContract = new Contract(ROUTER_ADDRESS, abis.router02);
  const fromTokenContract = new Contract(fromToken, ERC20.abi);
  const fromTokenBalance = useTokenBalance(fromToken, account);
  const toTokenBalance = useTokenBalance(toToken, account);
  const tokenAllowance = useTokenAllowance(fromToken, account, ROUTER_ADDRESS) || parseUnits('0');

  const approvedNeeded = fromValueBigNumber.gt(tokenAllowance);
  const fromValueIsGreatThan0 = fromValueBigNumber.gt(parseUnits('0'));
  const enoughBalance = fromValueBigNumber.lte(fromTokenBalance ?? parseUnits('0'));

  const isApproving = isOperationPending(swapApprovedState);
  const isSwapping = isOperationPending(swapExecuteState);
  const canApprove = !isApproving && approvedNeeded;
  const canSwap = !approvedNeeded && !isSwapping && fromValueIsGreatThan0 && enoughBalance;
  const successMessage = getSuccessMessage(swapApprovedState, swapExecuteState);
  const failureMessage = getFailureMessage(swapApprovedState, swapExecuteState);


  const {state: swapApprovedState, send: swapApprovedSend } = useContractFunction(
    fromTokenContract, 'approve', {
      transactionName: 'onApproveRequested',
      gasLimitBufferPercentage: 10,
    }
  );

  const {state: swapExecuteState, send: swapExecuteSend } = useContractFunction(
    routerContract, 'swapExactTokensForTokens', {
      transactionName: 'swapExactTokensForTokens',
      gasLimitBufferPercentage: 10,
    }
  );

  const onApproveRequested = () => {
    swapApprovedSend(ROUTER_ADDRESS, ethers.constants.MaxInt256);
  };

  const onSwapRequested = () => {
    swapExecuteSend(
      fromValueBigNumber,
      0,
      [fromToken, toToken],
      account,
      Math.floor(Date.now() / 1000) + 60 * 2,
    ).then(() => {
      setFromValue('0');
    })
  };

  const onFromValueChange = (value) => {
    const trimmedValue = value.trim();

    try {
      if(trimmedValue){
        parseUnits(value);
        setFromValue(value);
      }
    } catch (error) {
        console.log(error);
    }
  }

  const onFromTokenChange = (value) => {
    setFromToken(value);
  }

  const onToTokenChange = (value) => {
    setToToken(value);
  }

  useEffect(() => {
    if(failureMessage || successMessage) {
      setTimeout(() => {
        setResetState(true);
        setFromValue('0');
        setToToken('');
      }, 5000)
    }
  }, [failureMessage, successMessage]);
  

  return (
    <div className='flex w-full flex-col items-center'>
      <div className='mb-8'>
        <AmountIn 
          value={fromValue}
          onChange={onFromValueChange}
          currencyValue={fromToken}
          onSelect={onFromTokenChange}
          currencies={availableTokens}
          isSwapping={isSwapping && enoughBalance}
        />
        <Balance tokenBalance={fromTokenBalance}/>
      </div>
      <div className='mb-8 w-[100%]'>
        <AmountOut 
          fromToken={fromToken}
          toToken={toToken}
          amountIn={fromValueBigNumber}
          pairContract={pairAddress}
          currencyValue={toToken}
          onSelect={onToTokenChange}
          currencies={counterpartTokens}
        />
        <Balance tokenBalance={toTokenBalance}/>
      </div>

      {approvedNeeded && !isSwapping ? (
        <button
          onClick={onApproveRequested} 
          disabled={!canApprove} 
          className={`${canApprove ? 'bg-site-pink text-white' : 'bg-site-dim2 text-site-dim2'} ${styles.actionButton}`}>
          {isApproving ? 'Approving...' : 'Approve'}
        </button>
      ) : <button
            onClick={onSwapRequested} 
            disabled={!canSwap} 
            className={`${canSwap ? 'bg-site-pink text-white' : 'bg-site-dim2 text-site-dim2'} ${styles.actionButton}`}>
            {isSwapping ? 'Swapping...' : enoughBalance ? 'Swap' : 'Insufficient Balance'}
          </button>
      }    

      {failureMessage && !resetState ? (
        <p className={styles.message}>{failureMessage}</p>
      ) : successMessage ? (
        <p className={styles.message}>{successMessage}</p>
      ): ''}
    </div>
  );
};

export default Exchange;