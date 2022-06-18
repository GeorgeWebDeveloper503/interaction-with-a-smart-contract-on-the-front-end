import Head from 'next/head'
import styles from '../styles/Home.module.css'

import 'bulma/css/bulma.css';

// Import
import Web3 from 'web3';
import { useState, useEffect } from 'react';

// Importamos la instacia de nuestro Contrato
import lotteryContract from '../blockchain/lottery';



export default function Home() {

  const [web3, setWeb3] = useState();
  const [address, setaddress] = useState();
  const [lcContract, setlcContract] = useState();
  const [error, setError] = useState('');
  const [successMsg, setsuccessMsg] = useState('');
  const [lotteryHistory, setlotteryHistory] = useState([]);
  const [lotteryId, seLotteryId] = useState();



  // Get POT
  const [lotteryPot, setLotteryPot] = useState();

  const getPot = async() =>{
      const pot = await lcContract.methods.getBalance().call();
      // console.log(pot);
      setLotteryPot(web3.utils.fromWei(pot,'ether'));
  }

  // Get players
  const [lotteryPlayers, setlotteryPlayers] = useState([]);
  const getPlayers = async() =>{
    const players = await lcContract.methods.getPlayers().call();
    // console.log(players);
      setlotteryPlayers(players);
  }

  // Enter Lottery 
  const enterLotteryHandler = async () =>{
    setsuccessMsg("please wait a few moments.....");
    try{
      // Hacemos una transaccion de envio, ya que estamos agregando unos datos a la blockchain mas bien enviando algunos eter
      await lcContract.methods.enter().send({
        from: address,
        value: web3.utils.toWei('0.011', 'ether'),
        gas:300000,
        gasPrice:null
      });

      // alert("success!");
      setsuccessMsg('Success you are already in the lottery!');
     
      setTimeout(()=>{
        setsuccessMsg("");
      }, 3000);

      functionUpdated();
       

    } catch(err){
       console.log(err.message);
       setError(err.message);
    }
  };


  // Pick winner
  const pickWinnerHandler = async () =>{
    try{
      setsuccessMsg("please wait a few moments.....");
      await lcContract.methods.payWinner().send({
        from: address,
        gas:300000,
        gasPrice:null
      });
      const winnerAddres =   lcContract.methods.lotteryHistory(lotteryId).call();
      // const winnerAddres =   lotteryHistory[lotteryId - 1].address;
     
      setsuccessMsg('The winner is:' ,winnerAddres);

      setTimeout(()=>{
        setsuccessMsg("");
      }, 3000)
      
      functionUpdated();

    } catch(err){

      setError(err.message);
      
      setTimeout(()=>{
        setsuccessMsg("");
      }, 3000)
    
    }
  }

// get History
const getHistory = async (id) =>{
  setlotteryHistory([]);
  for(let i = parseInt(id); i > 0; i--){
    const winnerAddress = await lcContract.methods.lotteryHistory(i).call();
    const historyObj = {};
          historyObj.id = i;
          historyObj.address = winnerAddress;
          setlotteryHistory(lotteryHistory => [...lotteryHistory, historyObj]);
  }
}
// get lottery ID
const getLotteryId = async () =>{
  const loterryId = await lcContract.methods.lotteryId().call();
  seLotteryId(loterryId);
  await getHistory(loterryId);
}

// function of updated 
const functionUpdated = () =>{  
  if(lcContract) getPot();
  if(lcContract) getPlayers();
  if(lcContract) getLotteryId();
};



useEffect(() =>{
  functionUpdated();
},[lcContract])



  const connectWalletHandler = async () =>{
      // Nos aseguramos que estemos en un navegador
      // Nos aseguramos que el objecto metamask Ethereum ha sido inyecto debajo del obejcto window O nos asegurmos que tengamos una billitera Metamask
      setError("");
      if(typeof window !=="undefined" && typeof window.ethereum !== "undefined"){
        
        try{
          // request wallet connection
          // Solicitar la conexion a la wallet
          // Funcion asincrona 
          await window.ethereum.request({method:"eth_requestAccounts"});
          
          // create web3 installed
          const web3 = new Web3(window.ethereum);
          setWeb3(web3);
          

          // window.ethereum.on('accountsChanged', async () => {  
            // console.log("Hello");
              // get list of accounts
              const accounts = await web3.eth.getAccounts();
              // set Account 1 to React state
              console.log(accounts[0])
              setaddress(accounts[0]);
          // });
          
          //Create local contract copy
          //llamamos nuestro smart contract y esto recibi un parametro que sera la instacia de web3
          const lc = lotteryContract(web3);
          console.log(lc);
          setlcContract(lc);

          
         setsuccessMsg('Connected Wallet!');

         setTimeout(()=>{
           setsuccessMsg("");
         }, 3000)
          
          
        } catch (err){

          console.log(err.message);
          setError(err.message);

        }


      } else {

        console.log("Please Install MetaMask");
        setError("Please Install MetaMask");

      }


  } 

  return (
    <div className="main-container-lottery">
      <Head>
        <title>Ether Lttery</title>
        <meta name="description" content="An Ethereum Lottery dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className="navbar mt-5">
            <div className="container">
              <div className="navbar-brand">
                <h1>Ether Lottery</h1>
              </div>
              <div className="navbar-end">
                <button className="button is-link" onClick={connectWalletHandler}> Connect Wallte </button>
              </div>
            </div>
        </nav>

        <div className="container">
          <section className="mt-5">
            <div className="columns">
              <div className="column is-two-thirds">
                <section className="mt-5">
                  <p> Enter the lottery by sending 0.01 Ether </p>
                  <button onClick={enterLotteryHandler} className="button is-link is-large is-light mt-3 ">Play now</button>
                </section>

                <section className="mt-6">
                  <p> <b>Admin only:</b> Pick Winner </p>
                  <button onClick={pickWinnerHandler} className="button is-primary is-large is-light mt-3 ">Play now</button>
                </section>

                <section className="mt-6">
                  <div className="container has-text-danger">
                    <p>{error}</p>
                  </div>
                </section>

                <section className="mt-6">
                  <div className="container has-text-success">
                    <p>{successMsg}</p>
                  </div>
                </section>

              </div>
              <div className="column is-one-thirds">
              <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Lottery History</h2>
                        {lotteryHistory.length !=0 && lotteryHistory &&

                              lotteryHistory.map((item, index)=>{

                                const winnerHistorie = "https://etherscan.io/address/"+item.address;
                                  if(lotteryId != item.id){
                                      return<div className="history-entry mt-3" key={index}>
                                                  <di>Lottry # {item.id}:</di>
                                                  <div>
                                                    <a href={winnerHistorie} target="_black">
                                                      {item.address}
                                                    </a>
                                                  </div>
                                              </div>
                                  }
                                })
                          }
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        {/* Una lista de jugadores que estan actualmente en la loteria */}
                        <h2>Players ({lotteryPlayers.length})</h2>
                          <div>
         
                              <ul className="lotteryULinfo">
                                {lotteryPlayers.length !=0 ? (

                                    lotteryPlayers.map((player, index)=>{
                                    const addressPlayer = "https://etherscan.io/address/"+player;
                                      return <li key={index}>
                                                <a href={addressPlayer} target="_blank">
                                                  {player}
                                                </a>        
                                            </li>
                                    })
                                ) : (
                                  <h3>
                                    No players
                                  </h3>
                                )}
                              </ul>
                                                
                            
                          </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Pot</h2>
                        <p>{lotteryPot} Ether</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

            </div>




          </section>
        </div>

      </main>

      <footer className={styles.footer}>
        2022 Block Explorer
      </footer>
    </div>
  )
}
