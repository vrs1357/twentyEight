import React, {useState} from 'react';

const Card = ({ rank, suit, faceUp = true, liftOnHover = false, onClick}) => {
  const cardFile = faceUp ? `card_${suit}_${rank}.png` : 'card_back.png';
  const imagePath = `/cards/${cardFile}`;
    const [isHovered, setIsHovered] = useState(false);
  return (
    <img
      src={imagePath}
      alt={faceUp ? `${rank} of ${suit}` : 'Card Back'}
      className={`w-16 h-[5.5rem] object-contain rounded shadow-md transition-transform duration-200 ${
        isHovered && liftOnHover ? 'transform -translate-y-4 scale-105 z-10' : ''
      }`}
      onMouseEnter={() => liftOnHover && setIsHovered(true)}
      onMouseLeave={() => liftOnHover && setIsHovered(false)}
    />
  );
};

export default Card;
