/**
 * Calculate optimal card layout (width, gap) that fills available space
 * while respecting min/max width and gap constraints.
 * 
 * Priority:
 * 1. Find optimal number of columns
 * 2. Expand card width first until we hit maxWidth or fill space
 * 3. If we hit maxWidth and still have space, increase gap
 * 
 * @param totalWidth - Total available width for cards (screen width minus padding)
 * @param numberOfCards - Maximum number of cards/columns
 * @param minCardWidth - Minimum card width
 * @param maxCardWidth - Maximum card width
 * @param targetCardWidth - Target card width (ideally halfway between min and max)
 * @param targetGap - Target gap between cards (default 20px)
 * @param minGap - Minimum gap between cards (for validation)
 * @param maxGap - Maximum gap between cards (for validation)
 * @returns Object with optimal cardWidth and gap
 */
export function calculateOptimalCardLayout(
  totalWidth: number,
  numberOfCards: number,
  minCardWidth: number = 1,
  maxCardWidth: number = Infinity,
  targetCardWidth: number | undefined,
  targetGap: number = 20,
  minGap: number  = 15,
  maxGap: number = Infinity
): {
  cardWidth: number;
  gap: number;
  columns: number;
} {
    minCardWidth = Math.max(1, minCardWidth);
    maxCardWidth = Math.min(maxCardWidth, totalWidth);
    minGap = Math.max(0, minGap);
    maxGap = Math.min(maxGap, totalWidth);
    numberOfCards = Math.max(1, numberOfCards);
    targetCardWidth = targetCardWidth ?? Math.floor((minCardWidth + maxCardWidth) / 2);
    console.log("HERE", {minCardWidth, maxCardWidth, totalWidth, numberOfCards, minGap, maxGap, targetGap, targetCardWidth});


  // calc max columns
    const maxColumns = Math.min(numberOfCards, Math.max(1, Math.floor((totalWidth + minGap) / (minGap + minCardWidth))));
    console.log("maxColumns", maxColumns);

    // if max 1 that is the answer
  if (maxColumns === 1){
    let cardWidth = targetCardWidth;
    if (minCardWidth) cardWidth = Math.max(cardWidth, minCardWidth);
    if (maxCardWidth) cardWidth = Math.min(cardWidth, maxCardWidth);
    return { cardWidth, gap: targetGap };
  }

  // calc min columns
  const minColumns = Math.min(maxColumns, Math.max(1, Math.floor((totalWidth + maxGap) / (maxGap + maxCardWidth))));
  console.log("minColumns", minColumns);



  function getAnswerGivenColumns(columns: number): { cardWidth: number; gap: number } {
      // Try with targetGap first
      let cardWidth = widthGivenGap(totalWidth, columns, targetGap);
      if (inRange(cardWidth, minCardWidth, maxCardWidth)){
          return { cardWidth, gap: targetGap };
      }
      
      // Width is out of range, need to adjust
      if (cardWidth < minCardWidth) {
          // Card is too narrow, use minCardWidth and calculate gap
          cardWidth = minCardWidth;
          let gap = gapGivenWidth(totalWidth, columns, cardWidth);
          gap = clamp(gap, minGap, maxGap);
          return { cardWidth, gap };
      } else {
          // cardWidth > maxCardWidth, use maxCardWidth and calculate gap
          cardWidth = maxCardWidth;
          let gap = gapGivenWidth(totalWidth, columns, cardWidth);
          gap = clamp(gap, minGap, maxGap);
          return { cardWidth, gap };
      }
  }
    // if min equals max, that is the answer
    if (minColumns === maxColumns) {
        const result = getAnswerGivenColumns(minColumns);
        return { ...result, columns: minColumns };
    }

   // calc target
   const targetColumns = clamp(Math.floor((totalWidth + targetGap) / (targetGap + targetCardWidth)), minColumns, maxColumns);
    console.log('HERE', {minColumns, maxColumns, targetColumns});

   // Try columns from targetColumns, expanding outward
   let bestSolution: { cardWidth: number; gap: number; columns: number; score: number } | null = null;

   const testColumnRange = (start: number, end: number, step: number) => {
     for (let testColumns = start; step > 0 ? testColumns <= end : testColumns >= end; testColumns += step) {
       const solution = getAnswerGivenColumns(testColumns);
       
       // Verify the solution actually fits
       const totalUsed = calcTotalWidth(testColumns, solution.cardWidth, solution.gap);
       const remainingSpace = totalWidth - totalUsed;
       
       // Skip if solution doesn't fit
       if (totalUsed > totalWidth + 0.1) {
         continue; // Doesn't fit
       }
       
       // Check constraints
       const hitMaxWidth = solution.cardWidth >= maxCardWidth;
       const hitMaxGap = solution.gap >= maxGap;
       
       // If we have remaining space, try to fill it
       if (remainingSpace > 0.1) {
         if (!hitMaxWidth) {
           // Expand width first to fill space
           const widthIncrease = remainingSpace / testColumns;
           const newWidth = Math.min(solution.cardWidth + widthIncrease, maxCardWidth);
           solution.cardWidth = newWidth;
           const newTotalUsed = calcTotalWidth(testColumns, solution.cardWidth, solution.gap);
           const newRemainingSpace = totalWidth - newTotalUsed;
           
           // If still have space and hit maxWidth, expand gap
           if (newRemainingSpace > 0.1 && solution.cardWidth >= maxCardWidth && !hitMaxGap) {
             const gapIncrease = newRemainingSpace / (testColumns - 1);
             solution.gap = Math.min(solution.gap + gapIncrease, maxGap);
           }
         } else if (!hitMaxGap) {
           // Already at maxWidth, expand gap to fill space
           const gapIncrease = remainingSpace / (testColumns - 1);
           solution.gap = Math.min(solution.gap + gapIncrease, maxGap);
         }
       }
       
       // Calculate score: lower is better
       let score = Infinity;
       
       // BEST: using targetGap, width is in range and closest to the targetWidth
       if (solution.gap === targetGap && inRange(solution.cardWidth, minCardWidth, maxCardWidth)) {
         score = Math.abs(solution.cardWidth - targetCardWidth);
       }
       // Second best: gap between minGap and targetGap, width in range, prefer minCardWidth if it fits
       else if (solution.gap < targetGap && solution.gap >= minGap && inRange(solution.cardWidth, minCardWidth, maxCardWidth)) {
         const gapDistance = Math.abs(solution.gap - targetGap);
         const widthDistance = Math.abs(solution.cardWidth - targetCardWidth);
         const prefersMinWidth = solution.cardWidth === minCardWidth ? 0 : 100;
         score = 1000 + gapDistance + widthDistance + prefersMinWidth;
       }
       // Third best: maxWidth, gap between targetGap and maxGap
       else if (solution.cardWidth === maxCardWidth && solution.gap >= targetGap && solution.gap <= maxGap) {
         score = 2000 + (maxGap - solution.gap); // Prefer larger gaps (closer to maxGap)
       }
       // Worst: maxWidth and maxGap
       else if (solution.cardWidth === maxCardWidth && solution.gap === maxGap) {
         score = 3000;
       } else {
         // Invalid solution, skip
         continue;
       }
       
       if (!bestSolution || score < bestSolution.score) {
         bestSolution = { ...solution, columns: testColumns, score };
       }
     }
   };

   // Test columns starting from targetColumns, expanding outward
   testColumnRange(targetColumns, minColumns, -1);
   testColumnRange(targetColumns + 1, maxColumns, 1);

   // If we found a solution, return it
   if (bestSolution) {
     return { cardWidth: bestSolution.cardWidth, gap: bestSolution.gap, columns: bestSolution.columns };
   }

   // Fallback: use maxColumns with maxWidth and maxGap
   const fallbackResult = getAnswerGivenColumns(maxColumns);
   return { ...fallbackResult, columns: maxColumns };
 }


function clamp(value: number, min: number = 1, max: number = Infinity) {
    if (max < min){
        throw new Error("max cannot be less than min");
    }
    return Math.max(min, Math.min(value, max));
}
function countColumns(totalWidth: number, targetCardWidth: number, targetGap: number, maxColumns: number = Infinity, minColumns: number = 1): number {
    // no gap on the far right, so this is a fencepost problem
    const v = (totalWidth + targetGap) / (targetCardWidth + targetGap);
    return clamp(v, minColumns, maxColumns);
}
function gapGivenWidth(totalWidth: number, numColumns: number, cardWidth: number) {
    if (numColumns <= 1){
        return 0;
    }
    return (totalWidth - cardWidth * numColumns)/(numColumns - 1);
}
function widthGivenGap(totalWidth: number, numColumns: number, gap: number) {
    if (numColumns <= 1){
        return totalWidth
    }
    return (totalWidth + gap)/(numColumns) - gap;
}
function calcTotalWidth(numColumns: number, cardWidth: number, gap: number) {
    if (numColumns <= 1){
        return cardWidth;
    }
    return cardWidth * numColumns + gap * (numColumns - 1);
}
function inRange(value: number, min: number, max: number = Infinity) {
    return value >= min && value <= max
}