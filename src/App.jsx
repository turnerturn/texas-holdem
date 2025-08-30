
import './App.css';

import { useState } from 'react';

const seats = Array.from({ length: 8 }, (_, i) => `Seat ${i + 1}`);

const outsTable = [
  { label: 'Open-ended straight and flush draw', outs: 15 },
  { label: 'Inside straight and flush draw', outs: 12 },
  { label: 'Flush draw', outs: 9 },
  { label: 'Open-ended straight draw', outs: 8 },
  { label: 'Two overcards', outs: 6 },
  { label: 'Two pair to full house', outs: 4 },
  { label: 'Inside straight draw', outs: 4 },
  { label: 'One overcard', outs: 3 },
  { label: 'Pair to Set Draw', outs: 2 },
];

function parseCard(card) {
  // e.g. "A♠", "10♥"
  const suit = card.slice(-1);
  let rank = card.slice(0, card.length - 1);
  if (rank === 'A') return { rank: 14, suit, raw: card };
  if (rank === 'K') return { rank: 13, suit, raw: card };
  if (rank === 'Q') return { rank: 12, suit, raw: card };
  if (rank === 'J') return { rank: 11, suit, raw: card };
  if (rank === 'T' || rank === '10') return { rank: 10, suit, raw: card };
  return { rank: parseInt(rank, 10), suit, raw: card };
}

function getAllCards(handCards, boardCards) {
  return [...handCards, ...boardCards].map(parseCard);
}

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function isFlushDraw(cards) {
  // 4 cards of same suit
  const suitCounts = countBy(cards, 'suit');
  return Object.values(suitCounts).some(count => count === 4);
}

function isFlush(cards) {
  // 5 cards of same suit
  const suitCounts = countBy(cards, 'suit');
  return Object.values(suitCounts).some(count => count >= 5);
}

function isStraight(cards) {
  // 5 sequential ranks, Ace can be 1 or 14
  let ranks = cards.map(c => c.rank);
  ranks = Array.from(new Set(ranks)).sort((a, b) => a - b);
  // Ace low
  if (ranks.includes(14)) ranks.unshift(1);
  for (let i = 0; i <= ranks.length - 5; i++) {
    let seq = ranks.slice(i, i + 5);
    if (seq[4] - seq[0] === 4) return true;
  }
  return false;
}

function isOpenEndedStraightDraw(cards) {
  // 4 sequential ranks, can complete on either end
  let ranks = cards.map(c => c.rank);
  ranks = Array.from(new Set(ranks)).sort((a, b) => a - b);
  // Ace low
  if (ranks.includes(14)) ranks.unshift(1);
  for (let i = 0; i <= ranks.length - 4; i++) {
    let seq = ranks.slice(i, i + 4);
    if (seq[3] - seq[0] === 3) return true;
  }
  return false;
}

function isInsideStraightDraw(cards) {
  // 4 cards with a gap in the middle
  let ranks = cards.map(c => c.rank);
  ranks = Array.from(new Set(ranks)).sort((a, b) => a - b);
  // Ace low
  if (ranks.includes(14)) ranks.unshift(1);
  for (let i = 0; i <= ranks.length - 4; i++) {
    let seq = ranks.slice(i, i + 4);
    if (seq[3] - seq[0] === 4 && new Set(seq).size === 4) return true;
  }
  return false;
}

function isOpenEndedStraightAndFlushDraw(cards) {
  // 4 cards same suit, sequential
  const suitCounts = countBy(cards, 'suit');
  const suit = Object.keys(suitCounts).find(s => suitCounts[s] === 4);
  if (!suit) return false;
  const suitedCards = cards.filter(c => c.suit === suit);
  let ranks = suitedCards.map(c => c.rank);
  ranks = Array.from(new Set(ranks)).sort((a, b) => a - b);
  if (ranks.includes(14)) ranks.unshift(1);
  for (let i = 0; i <= ranks.length - 4; i++) {
    let seq = ranks.slice(i, i + 4);
    if (seq[3] - seq[0] === 3) return true;
  }
  return false;
}

function isInsideStraightAndFlushDraw(cards) {
  // 4 cards same suit, with a gap
  const suitCounts = countBy(cards, 'suit');
  const suit = Object.keys(suitCounts).find(s => suitCounts[s] === 4);
  if (!suit) return false;
  const suitedCards = cards.filter(c => c.suit === suit);
  let ranks = suitedCards.map(c => c.rank);
  ranks = Array.from(new Set(ranks)).sort((a, b) => a - b);
  if (ranks.includes(14)) ranks.unshift(1);
  for (let i = 0; i <= ranks.length - 4; i++) {
    let seq = ranks.slice(i, i + 4);
    if (seq[3] - seq[0] === 4 && new Set(seq).size === 4) return true;
  }
  return false;
}

function isFullHouse(cards) {
  // 3 of one rank, 2 of another
  const rankCounts = countBy(cards, 'rank');
  const counts = Object.values(rankCounts);
  return counts.includes(3) && counts.includes(2);
}

function isTwoPairToFullHouse(cards) {
  // 2 pairs, can improve to full house
  const rankCounts = countBy(cards, 'rank');
  const pairs = Object.values(rankCounts).filter(c => c === 2).length;
  return pairs === 2;
}

function isOvercard(handCards, boardCards) {
  // Only if both hand cards are higher than all board cards
  const handRanks = handCards.map(c => c.rank);
  const boardRanks = boardCards.map(c => c.rank);
  return handRanks.every(hr => hr > Math.max(...boardRanks));
}

function detectHandType(handCards, boardCards) {
  const allCards = getAllCards(handCards, boardCards);
  if (isOpenEndedStraightAndFlushDraw(allCards)) return outsTable[0];
  if (isInsideStraightAndFlushDraw(allCards)) return outsTable[1];
  if (isFlushDraw(allCards)) return outsTable[2];
  if (isOpenEndedStraightDraw(allCards)) return outsTable[3];
  if (isTwoPairToFullHouse(allCards)) return outsTable[5];
  if (isInsideStraightDraw(allCards)) return outsTable[6];
  // Overcard logic
  const handRanks = handCards.map(c => parseCard(c).rank);
  const boardRanks = boardCards.map(c => parseCard(c).rank);
  const maxBoardRank = Math.max(...boardRanks);
  const overcards = handRanks.filter(hr => hr > maxBoardRank).length;
  if (overcards === 2) return outsTable[4]; // Two overcards, 6 outs
  if (overcards === 1) return outsTable[7]; // One overcard, 3 outs
  // Pair to set draw: if player has a pair (one of their hand cards matches any board card)
  if (handRanks.some(hr => boardRanks.includes(hr))) {
    return outsTable[8]; // Pair to Set Draw
  }
  return null;
}


function estimateEquity(outs, street) {
  // street: 'flop', 'turn', or 'river'
  let multiplier = 0;
  if (street === 'flop') multiplier = 4.4;
  else if (street === 'turn') multiplier = 2.2;
  else multiplier = 0;
  return Math.round(outs * multiplier);
}

function getCoachFeedback(action, equity) {
  if (action === 'Fold') {
    if (equity > 20) return 'Folding with high equity! Consider calling or raising.';
    return 'Good fold. Sometimes it is best to let go.';
  }
  if (action === 'Check') {
    if (equity > 15) return 'Checking with decent equity. Consider betting for value.';
    return 'Check is fine here.';
  }
  if (action === 'Bet') {
    if (equity < 10) return 'Betting with low equity is risky.';
    return 'Nice bet! You have some equity.';
  }
  if (action === 'Raise') {
    if (equity < 12) return 'Raising with low equity can be dangerous.';
    return 'Aggressive play! Make sure your outs are clean.';
  }
  return 'Action taken.';
}

function getRandomHandType() {
  const idx = Math.floor(Math.random() * outsTable.length);
  return outsTable[idx].label;
}

function getRandomStreet() {
  return Math.random() < 0.5 ? 'flop' : 'turn';
}

function getRandomCard() {
  // Unicode playing cards: 0x1F0A1 (Ace of Spades) to 0x1F0DE (King of Diamonds)
  // We'll use a simple set for demo: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2 of spades
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['♠', '♥', '♦', '♣'];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  return `${rank}${suit}`;
}

function renderCard(card) {
  const suit = card.slice(-1);
  const isRed = suit === '♦' || suit === '♥';
  return <span className="card" style={{ color: isRed ? '#e53935' : '#222' }}>{card}</span>;
}

function PokerTable() {
  const [pot, setPot] = useState(0);
  const [callAmount, setCallAmount] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const [coachMsg, setCoachMsg] = useState('Welcome! Take an action to get feedback.');
  const [boardCards, setBoardCards] = useState(Array(3 + Math.floor(Math.random() * 3)).fill('').map(getRandomCard));
  const [handCards, setHandCards] = useState([getRandomCard(), getRandomCard()]);

  // Determine street based on number of board cards
  let street = 'flop';
  if (boardCards.length === 4) street = 'turn';
  else if (boardCards.length === 5) street = 'river';

  const detected = detectHandType(handCards, boardCards);
  const outs = detected?.outs || 0;
  const handType = detected?.label || 'No draw';
  const equity = estimateEquity(outs, street);
  const potOdds = (callAmount > 0 && pot >= 0) ? ((callAmount / (pot + callAmount)) * 100).toFixed(1) : null;

  function handleAction(action) {
    setLastAction(action);
    setCoachMsg(getCoachFeedback(action, equity));
  }

  function nextRound() {
    // Randomize board card count for street
    const newBoardCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
    setBoardCards(Array(newBoardCount).fill('').map(getRandomCard));
    setHandCards([getRandomCard(), getRandomCard()]);
    setCoachMsg('New scenario! Take an action to get feedback.');
    setPot(0);
    setCallAmount(0);
    setLastAction(null);
  }

  return (
    <div className="poker-table">
      <div className="table-center">
        <div className="pot">
          Total Pot: $
          <input
            type="number"
            min="0"
            value={pot}
            onChange={e => setPot(Number(e.target.value))}
            style={{ width: '80px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', marginLeft: '8px' }}
          />
          <span style={{ marginLeft: '2rem' }}>Amount to Call: $</span>
          <input
            type="number"
            min="0"
            value={callAmount}
            onChange={e => setCallAmount(Number(e.target.value))}
            style={{ width: '80px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', marginLeft: '8px' }}
          />
        </div>
        {potOdds !== null && (
          <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#61dafb' }}>
            Pot Odds: {potOdds}%
          </div>
        )}
        <div className="board-cards">
          {boardCards.map((card, idx) => renderCard(card))}
        </div>
      </div>
      <div className="player-area">
        <div className="player-cards">
          {handCards.map((card, idx) => renderCard(card))}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Hand Type:
            <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{handType}</span>
          </label>
          <label style={{ marginLeft: '2rem' }}>
            Street:
            <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{street.charAt(0).toUpperCase() + street.slice(1)}</span>
          </label>
        </div>
        <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#ffd700' }}>
          Estimated Equity: {equity}% ({outs} outs)
        </div>
        <div className="actions">
          <button onClick={() => handleAction('Check')}>Check</button>
          <button onClick={() => handleAction('Fold')}>Fold</button>
          <button onClick={() => handleAction('Bet')}>Bet</button>
          <button onClick={() => handleAction('Raise')}>Raise</button>
          <button style={{ marginLeft: '2rem', background: '#61dafb', color: '#222' }} onClick={nextRound}>Next Scenario</button>
        </div>
      </div>
      <div className="coach-chat">
        <h3>Coach Chat</h3>
        <div className="chat-messages">
          <p>{coachMsg}</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <PokerTable />;
}
