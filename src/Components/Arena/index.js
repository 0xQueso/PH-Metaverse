import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import { abi } from '../../utils/abi.json';
import './Arena.css';

const Arena = ({ characterNFT, setCharacterNFT }) => {
    const [gameContract, setGameContract] = useState(null);
    const [boss, setBoss] = useState(null);
    const [attackState, setAttackState] = useState('');
    const [opensea, setOpensea] = useState();
    const [isHealing, setIsHealing] = useState(false);
    const [isBuffing, setIsBuffing] = useState(false);

    const runAttackAction = async () => {
        try {
            if (gameContract) {
                setAttackState('attacking');
                console.log('Attacking boss...');
                const attackTxn = await gameContract.attackBoss();
                await attackTxn.wait();
                console.log('attackTxn:', attackTxn);
                setAttackState('hit');
            }
        } catch (error) {
            console.error('Error attacking boss:', error);
            setAttackState('');
        }
    };

    const buyHp = async () => {
        try {
            if (gameContract) {
                console.log('healing char');
                setIsHealing(true);
                const buyHealthPoints = await gameContract.addHp({value: 0.002 * 10**18});
                await buyHealthPoints.wait();
                console.log('buyHealthPoints:', buyHealthPoints);

            }
        } catch (error) {
            setIsHealing(false);
            console.error('Error healing', error);
            setAttackState('');
        }
    }

    const buffAd = async () => {
        try {
            if (gameContract) {
                console.log('healing char');
                setIsBuffing(true);
                const buyAttackDamage = await gameContract.addAd({value: 0.002 * 10**18});
                await buyAttackDamage.wait();
                console.log('buyAttackDamage:', buyAttackDamage);

            }
        } catch (error) {
            setIsBuffing(false);
            console.error('Error healing', error);
            setAttackState('');
        }
    }

    useEffect(() => {
        const fetchBoss = async () => {
            const bossTxn = await gameContract.getBigBoss();
            const idTxn = await gameContract.getUserNFT();
            console.log(gameContract.address, 'add');
            setOpensea('https://testnets.opensea.io/assets/' + gameContract.address  + '/'+ idTxn.toString());
            console.log('Boss:', bossTxn);
            console.log('ID:', opensea);
            setBoss(transformCharacterData(bossTxn));
        };

        const onAttackComplete = (newBossHp, newPlayerHp) => {
            const bossHp = newBossHp.toNumber();
            const playerHp = newPlayerHp.toNumber();

            console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

            setBoss((prevState) => {
                return { ...prevState, hp: bossHp };
            });

            setCharacterNFT((prevState) => {
                return { ...prevState, hp: playerHp };
            });
        };

        const onHealComplete = (newPlayerHp) => {
            const playerHp = newPlayerHp.toNumber();

            console.log(`AttackHeal: Player Hp: ${playerHp}`);
            setIsHealing(false);
            setCharacterNFT((prevState) => {
                return { ...prevState, hp: playerHp };
            });
        };

        const onBuffComplete = (newPlayerAd) => {
            const playerAd = newPlayerAd.toNumber();

            console.log(`AttackHeal: Player Hp: ${playerAd}`);
            setIsBuffing(false);
            setCharacterNFT((prevState) => {
                return { ...prevState, attackDamage: playerAd };
            });
        };

        if (gameContract) {
            fetchBoss();
            gameContract.on('AttackComplete', onAttackComplete);
            gameContract.on('HealComplete', onHealComplete);
            gameContract.on('BuffComplete', onBuffComplete);
        }

        return () => {
            if (gameContract) {
                gameContract.off('AttackComplete', onAttackComplete);
                gameContract.off('HealComplete', onHealComplete);
                gameContract.off('BuffComplete', onBuffComplete);
            }
        }
    }, [gameContract]);

    // UseEffects
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

            setGameContract(gameContract);
        } else {
            console.log('Ethereum object not found');
        }
    }, []);

    return (
        <div className="arena-container">
            {characterNFT && (
                <div className="players-container">
                    <div className="player-help">
                        <button className="cta-button" onClick={buyHp}>
                            { isHealing ? "🚨🚨 Healing... 🚨🚨" : "🚑 Heal"}
                        </button>
                        <button className="cta-button" onClick={buffAd}>
                            { isBuffing ? "👊👊 Buffing up 👊👊" : "🥋 Train"}
                        </button>
                    </div>
                    <div className="player-container">

                        <div className="player">
                            <div className="image-content">
                                <h2>{characterNFT.name}</h2>
                                <p> {characterNFT.characterIndex}</p>
                                <img
                                    src={characterNFT.imageURI}
                                    alt={`Character ${characterNFT.name}`}
                                />
                                <div className="health-bar">
                                    <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                                    <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>

                                </div>
                            </div>
                            <div className="stats">
                                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
                                <a
                                    className="footer-text"
                                    href={opensea}
                                    target="_blank"
                                    rel="noreferrer"
                                >{`view on Opensea`}</a>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {boss && (
                <div className="boss-container">
                    <div className={`boss-content ${attackState}`}>
                        <h2>🔥 {boss.name} 🔥</h2>
                        <div className="image-content">
                            <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
                            <div className="health-bar">
                                <progress value={boss.hp} max={boss.maxHp} />
                                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
                            </div>
                        </div>
                    </div>
                    <div className="attack-container">
                        <button className="cta-button" onClick={runAttackAction}>
                            {`💥 Attack ${boss.name}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Arena;