const removeOverlap = (accumulated: string, incoming: string): string => {
  const accWords = accumulated.trim().toLowerCase().split(/\s+/);
  const incWords = incoming.trim().toLowerCase().split(/\s+/);
  
  if (accWords.length === 0 || incWords.length === 0) {
    return incoming;
  }
  
  let maxOverlap = 0;
  const maxPossibleOverlap = Math.min(accWords.length, incWords.length);
  
  for (let len = 1; len <= maxPossibleOverlap; len++) {
    let match = true;
    for (let i = 0; i < len; i++) {
      const accWord = accWords[accWords.length - len + i];
      const incWord = incWords[i];
      if (accWord !== incWord) {
        match = false;
        break;
      }
    }
    if (match) {
      maxOverlap = len;
    }
  }
  
  if (maxOverlap > 0) {
    const originalIncWords = incoming.trim().split(/\s+/);
    return originalIncWords.slice(maxOverlap).join(" ");
  }
  
  return incoming;
};

console.log(removeOverlap("bonjour ", "bonjour comment tu vas?"));
