import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import Whitelist from "./WL/Addresses.json"; 


//merkle management
import { utils } from 'ethers';
const { MerkleTree } =require('merkletreejs');
const keccak256 =require('keccak256');



const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;
//margin (space between mint buttons)
export const StyledButton = styled.button`
  padding: 20px;
  margin:20px;
  border-radius: 50px;
  border: none;
  background-color: var(--secondary);
  padding: 60px;
  font-weight: bold;
  font-size: 20px;
  color: var(--secondary-text);
  width: 250px;                                                       
  cursor: pointer;
  box-shadow: 12px 12px 2px 1px rgba(0, 0, 255, 0.2);
  -webkit-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;
//16-adjustment for hight of connect button
//19-adjust width of connect button
//21-shadow effects for the connect button

export const StyledRoundButton = styled.button`
  padding: 20px;
  border-radius: 100%;
  border: solid;
  background-color: var(--primary);
  font-weight: bold;
  font-size: 15px;
  color: var(--primary-text);
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const ResponsiveWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: stretched;
  align-items: stretched;
  width: 80%;
  @media (min-width: 767px) {
    flex-direction: row;
  }
`;

//66 min alowance for screen width before changing
//67 alignment of media row colum etc

export const StyledLogo = styled.img`
  width: 200px;
  @media (min-width:767px) {
    width: 300px;
  }

  transition: width 0.5s;
  transition: height 0.5s;
`;
//75 -77 logo adjustment settings

export const StyledImg = styled.img`
  box-shadow: 0px 5px 11px 2px rgba(0, 0, 0, 0.7);
  border: 4px solid var(--accent);
  background-color: var(--accent);
  border-radius: 10%;
  width: 200px;
  padding:10px;
  margin:10px;
  @media (min-width: 900px) {
    width: 250px;
  }
  @media (min-width: 1000px) {
    width: 300px;
  }
  transition: width 0.5s;
`;
//86 background ring around .gif pictures
//94 adjustment of .gif size

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
`;


function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Click buy to mint your NFT.`);
  const [mintAmount, setMintAmount] = useState(1);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
    PhaseClaim: false,
    PhaseWL: false,
    PhasePublic: false,
    MaxMintAmount:1
  });


  //Merkle root management
//current user proof called when mint
let currentProof='';

function merkle(){

const leafNodes = Whitelist.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHash = '0x' + merkleTree.getRoot().toString('hex');

  const proof= merkleTree.getHexProof(keccak256(blockchain.account));
  const rawProof= '["'+ proof.toString().replace(/,/g, '","')+'"]';

  if(merkleTree.verify(proof,keccak256(blockchain.account), rootHash )){
  currentProof=proof;
  }
  else{
    alert("You are not on the Whitelist");
    setClaimingNft(false);
  }
  console.log("merkleComplete");

}

  const claimNFTs = () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit +((gasLimit* mintAmount)*.2));
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `Congratulations, the ${CONFIG.NFT_NAME} is now all yours! go visit Opensea.io to see your new NFT!.`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

 //Mint NFTs with Merkle proof
 const WLNFTs = () => {
  let cost = CONFIG.WEI_COST;
  let gasLimit = CONFIG.GAS_LIMIT;
  let totalCostWei = String(cost * mintAmount);
  let totalGasLimit = String(gasLimit +((gasLimit* mintAmount)*.2));
  console.log("Cost: ", totalCostWei);
  console.log("Gas limit: ", totalGasLimit);
  setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);
  setClaimingNft(true);
  merkle();
  if(claimNFTs){
  blockchain.smartContract.methods.whitelistMint(mintAmount,currentProof)
    .send({
      gasLimit: String(totalGasLimit),
      to: CONFIG.CONTRACT_ADDRESS,
      from: blockchain.account,
      value: totalCostWei,
    })
    
    .once("error", (err) => {
      console.log(err);
      setFeedback("Sorry, something went wrong please try again later.");
      setClaimingNft(false);
    })
    .then((receipt) => {
      console.log(receipt);
      setFeedback(
        `Congratulations, the ${CONFIG.NFT_NAME} is now all yours! go visit Opensea.io to see your new NFT!.`
      );
      setClaimingNft(false);
      dispatch(fetchData(blockchain.account));
    });
  }
};

  // Balloon town Claim
  const ParentClaimNFTs = () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit +((gasLimit* mintAmount)*.2));
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .claimForParentNFT(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `Congratulations, the ${CONFIG.NFT_NAME} is now all yours! go visit Opensea.io to see your new NFT!.`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

  //increment/decrement
  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > CONFIG.MaxMintAmount) { 
      newMintAmount = CONFIG.MaxMintAmount;
    }
    setMintAmount(newMintAmount);
  };

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <s.Screen>
      
      <s.Container
        flex={1}
        ai={"center"}      //change placement of the logo (right = top left of page)
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={window.innerWidth >= 950 ? "./config/images/bg.png" : "./config/images/bg1.png"}
    
      >
        <s.SpacerLarge/>
        <s.SpacerLarge/>
       <s.Container style={{paddingTop:0,width:450}} flex={1} ai={"center"} image={Window.innerWidth >= 950 ? "./config/images/Transparent.png" : "/config/images/logo.png" } >
    

<div style={window.innerWidth>=1250 ? {height:1300} : {height:1300}}/>
        </s.Container>
   
          
          <ResponsiveWrapper flex={1} style={{ padding: 24 }} test>
          <s.Container flex={1} jc={"center"} ai={"center"}>
            <StyledImg alt={"example"} src={"/config/images/16.png"} />
            <StyledImg alt={"example"} src={"/config/images/6130.png"} />

          </s.Container>
          <s.SpacerLarge />
          <s.Container
            flex={2}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              padding: 24,
              borderRadius: 24,
              border: "4px double var(--secondary)",
              boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
            }}
          >
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 50,
                fontWeight: "bold",
                color: "var(--accent-text)",
              }}
            >
              {data.totalSupply} / {CONFIG.MAX_SUPPLY}
            </s.TextTitle>
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--primary-text)",
              }}
            >
              <StyledLink target={"_blank"} href={CONFIG.SCAN_LINK}>
                {truncate(CONFIG.CONTRACT_ADDRESS, 15)}
              </StyledLink>
            </s.TextDescription>
            <s.SpacerSmall />
            {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
              <>
                <s.TextTitle
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  The sale has ended.
                </s.TextTitle>
                <s.TextDescription
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  You can still find {CONFIG.NFT_NAME} on
                </s.TextDescription>
                <s.SpacerSmall />
                <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                  {CONFIG.MARKETPLACE}
                </StyledLink>
              </>
            ) : (
              <>
                <s.TextTitle
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  1 {CONFIG.SYMBOL} costs {CONFIG.DISPLAY_COST}{" "}
                  {CONFIG.NETWORK.SYMBOL}.
                </s.TextTitle>
                <s.SpacerXSmall />
                <s.TextDescription
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  Excluding gas fees.
                </s.TextDescription>
                <s.SpacerSmall />
                {blockchain.account === "" ||
                blockchain.smartContract === null ? (
                  <s.Container ai={"center"} jc={"center"}>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      Connect to the {CONFIG.NETWORK.NAME} network
                    </s.TextDescription>
                    <s.SpacerSmall />
                    <StyledButton
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(connect());
                        getData();
                      }}
                    >
                      CONNECT
                    </StyledButton>
                    {blockchain.errorMsg !== "" ? (
                      <>
                        <s.SpacerSmall />
                        <s.TextDescription
                          style={{
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          {blockchain.errorMsg}
                        </s.TextDescription>
                      </>
                    ) : null}
                  </s.Container>
                ) : (
                  <>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      {feedback}
                    </s.TextDescription>
                    <s.SpacerMedium />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledRoundButton
                        style={{ lineHeight: 0.4 }}
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          decrementMintAmount();
                        }}
                      >
                        -
                      </StyledRoundButton>
                      <s.SpacerMedium />
                      <s.TextDescription
                        style={{
                          textAlign: "center",
                          color: "var(--accent-text)",
                        }}
                      >
                        {mintAmount}
                      </s.TextDescription>
                      <s.SpacerMedium />
                      <StyledRoundButton
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          incrementMintAmount();
                        }}
                      >
                        +
                      </StyledRoundButton >
                    </s.Container>
                    <s.SpacerSmall />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
              
                    {CONFIG.PhaseClaim == true ? (   
                       <StyledButton
                       disabled={claimingNft ? 1 : 0}
                       onClick={(e) => {
                        e.preventDefault();
                        ParentClaimNFTs();
                        getData();
                      }}
                      >

                      {claimingNft ? "BUSY" : "BALLOONTOWN CLAIMS ONLY"}  
                      </StyledButton>
                    ):null}

                      {CONFIG.PhaseWL == true ? (    
                      <StyledButton
                      disabled={claimingNft ? 1 : 0}
                      onClick={(e) => {
                        e.preventDefault();
                        WLNFTs();
                        getData();
                      }}
                      >

                      {claimingNft ? "BUSY" : "WHITELIST MINT ONLY"}
                      </StyledButton>        
                      ):null}

                      {CONFIG.PhasePublic == true ? ( 
                      <StyledButton
                      disabled={claimingNft ? 1 : 0}
                      onClick={(e) => {
                        e.preventDefault();
                        claimNFTs();
                        getData();
                      }}
                      >

                      {claimingNft ? "BUSY" : "MINT"}  
                      </StyledButton>
                      ):null}


                    </s.Container>
                  </>
                )}
              </>
            )}
            <s.SpacerMedium />
          </s.Container>
          <s.SpacerLarge />
          <s.Container flex={1} jc={"center"} ai={"center"}>
            <StyledImg
              alt={"example"}
              src={"/config/images/77.png"}
              style={{ transform: "scaleX(-1)" }}
            />
            <StyledImg
              alt={"example"}
              src={"/config/images/82.png"}
              style={{ transform: "scaleX(-1)" }}
            />
          </s.Container>
        </ResponsiveWrapper>
        <s.SpacerMedium />
        <s.Container jc={"center"} ai={"center"} style={{ width: "70%" }}>
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
              boxShadow: "0px 5px 11px 2px rgba(0, 0, 0, 0.7)",
              border: "4px solid var(--primary)",
              backgroundColor: "var(--primary)",
            //adjusted bottom text bar 1
            }}
          >
            Check you are connected to the (
            {CONFIG.NETWORK.NAME} Mainnet). Caution:
            Once you make a purchase, you cannot undo this action. Please do not Claim on the (21st) if you do not Hold Balloon Town NFTs
            
          </s.TextDescription>
          <s.SpacerSmall />
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
              boxShadow: "0px 5px 11px 2px rgba(0, 0, 0, 0.7)",
              border: "4px solid var(--primary)",
              backgroundColor: "var(--primary)",
              fontSize: 20,
              //adjusted bottom text bar 2  
            }}
          >
            - The Minting Process will consist of Claims "1 for 1" (21st 11am EST), Whitelist "3 per WL address" (22nd 11am EST), and Public "5 per transaction" (23rd 11am EST) -
          </s.TextDescription>
        </s.Container>
     <div style={window.innerWidth>=1050 ? {height: 2600} : {height: 2600}}/>
    

      </s.Container>

    </s.Screen>
  );
}

export default App;
