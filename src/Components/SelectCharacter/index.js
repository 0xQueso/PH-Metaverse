import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import { abi } from '../../utils/abi.json';

const SelectCharacter = ({ setCharacterNFT }) => {

    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);
    const [idMinting, setIdMinting] = useState();

    const mintCharacterNFTAction = (characterId) => async () => {
        try {
            if (gameContract) {
                console.log('Minting...');
                setIdMinting(characterId);
                const mintTxn = await gameContract.mintCharacterNFT(characterId);
                await mintTxn.wait();
                console.log('mintTxn:', mintTxn);
            }
        } catch (error) {
            console.warn('MintCharacterAction Error:', error);
        }
    };

    useEffect(() => {
        const { ethereum } = window;

        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                abi,
                signer
            );
            console.log(gameContract, 'game contraxt')

            setGameContract(gameContract);
        } else {
            console.log('Ethereum object not found');
        }
    }, []);

    useEffect(() => {
        const getCharacters = async () => {
            try {
                console.log('getting contract')
                const charactersTxn = await gameContract.getAllDefaultCharacters();
                console.log(charactersTxn)
                const characters = charactersTxn.map((characterData) =>
                    transformCharacterData(characterData)
                );
                setIdMinting('');
                setCharacters(characters)
            } catch (e) {
                console.log(e, 'character error')
            }
        }

        const onCharacterMint = async (sender, tokenId, characterIndex) => {
            console.log(
                `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
            );

            if (gameContract) {
                const characterNFT = await gameContract.checkIfUserHasNFT();
                console.log('CharacterNFT: ', characterNFT);
                setIdMinting('');
                setCharacterNFT(transformCharacterData(characterNFT));
            }
        };

        if (gameContract) {
            getCharacters()
            gameContract.on('CharacterNFTMinted', onCharacterMint);
        }

        return () => {
            if (gameContract) {
                gameContract.off('CharacterNFTMinted', onCharacterMint);
            }
        };
    }, [gameContract])

    const renderCharacters = () =>
        characters.map((character, index) => (
            <div className="character-item" key={character.name}>
                <div className="name-container">
                    <p>{character.name}</p>
                </div>
                <img src={character.imageURI} alt={character.name} />
                <button
                    type="button"
                    className="character-mint-button"
                    onClick={mintCharacterNFTAction(index)}
                >{ idMinting === index ? "Minting..." : `Mint ${character.name}`}</button>
            </div>
        ));

    return (
        <div className="select-character-container">
            {characters.length > 0 && (
                <>
                    <h2>Select your fighter.</h2>
                <div className="character-grid">{renderCharacters()}</div>
                </>
            )}
        </div>
    );
};

export default SelectCharacter;