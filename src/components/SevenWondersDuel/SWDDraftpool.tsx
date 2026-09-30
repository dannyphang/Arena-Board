import React from 'react';
import { DraftCard } from '../../games/seven-wonders-duel/types';
import { SWDCard } from './SWDCard';
import { isCardAvailable } from '../../games/seven-wonders-duel/engine';

interface SWDDraftpoolProps {
  draftPool: DraftCard[];
  currentAge: number;
  isMyTurn: boolean;
  onSelectCard: (card: DraftCard) => void;
  selectedCardId?: number;
}

export const SWDDraftpool: React.FC<SWDDraftpoolProps> = ({
  draftPool,
  currentAge,
  isMyTurn,
  onSelectCard,
  selectedCardId,
}) => {
  // Group cards by row
  const rows = React.useMemo(() => {
    const rowMap: Record<number, DraftCard[]> = {};
    draftPool.forEach((c) => {
      if (!rowMap[c.row]) rowMap[c.row] = [];
      rowMap[c.row].push(c);
    });
    // Sort cards in each row by column
    Object.keys(rowMap).forEach((r) => {
      rowMap[Number(r)].sort((a, b) => a.col - b.col);
    });
    return rowMap;
  }, [draftPool]);

  const rowIndices = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none w-full max-w-2xl mx-auto overflow-visible">
      {/* Draftpool Container with staggered vertical row overlaps */}
      <div className="flex flex-col items-center">
        {rowIndices.map((rowIndex) => {
          const cardsInRow = rows[rowIndex];

          return (
            <div
              key={rowIndex}
              className="flex justify-center items-center relative"
              style={{
                marginTop: rowIndex === 0 ? '0px' : '-44px',
              }}
            >
              <div className="flex gap-2 sm:gap-3">
                {cardsInRow.map((card) => {
                  const available = !card.isTaken && isCardAvailable(card, draftPool);
                  const isSelected = selectedCardId === card.id;

                  if (card.isTaken) {
                    // Empty slot placeholder to maintain consistent spacing
                    return (
                      <div
                        key={card.id}
                        className="w-16 h-24 sm:w-20 sm:h-30 invisible pointer-events-none"
                      />
                    );
                  }

                  return (
                    <div
                      key={card.id}
                      className="relative transition-transform duration-200"
                    >
                      <SWDCard
                        cardId={card.id}
                        isFaceUp={card.faceUp}
                        age={currentAge}
                        size="small"
                        isAvailable={available && isMyTurn}
                        isSelected={isSelected}
                        onClick={() => {
                          if (available && isMyTurn) {
                            onSelectCard(card);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
