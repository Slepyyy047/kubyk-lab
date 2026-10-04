import { useCallback, useEffect, useRef, useState } from 'react';
import { faces } from './cube';
import { applystory:[],moves:0,shuffled:false};
  if(!persist)return empty;
  try {
    const raw=localStorage.getItem(`kubyk:play:v1:${size}`);
    if(!raw)return empty;
    const value=JSON.parse(raw) as GameRecord;
    if(!Array.isArray(value.history)||value.history.length>20000||!Number.isInteger(value.moves)||value.moves<0||typeof value.shuffled!=='boolean')return empty;
    if(!value.history.every(m=>m&&faces.includes(m.face)&&Number.isInteger(m.depth)&&m.depth>=0&&m.depth<size&&[1,-1,2].includes(m.turns)))return empty;
    return value;
  }catch{return empty;}
}

/** Persist legal moves rather than trusting arbitrary saved sticker colors. */
export default function usePuzzle(size:PuzzleSize,persist=true) {
  const [initial]=useState(()=>restore(size,persist));
  const [puzzle,setPuzzle]=useState(()=>initial.history.reduce(applyPuzzleMove,solvedPuzzle(size)));
  const [record,setRecord]=useState(initial);
  const [turn,setTurn]=useState<{id:number;move:PuzzleMove}|null>(null);
  const [shuffling,setef(false);
  useEffect(()=>{
    if(!persist)return;
    try{localStorage.setItem(`kubyk:play:v1:${size}`,JSON.stringify(record));setSaveFailed(false)}catch{setSaveFailed(true)}
  },[record,size,persist]);
  const move=useCallback((next:PuzzleMove)=>{
    if(lock.current||shuffleRef.current)return;
    lock.current=true;setTurn({id:++sequence.current,move:next});
  },[]);
  const complete=useCallback(()=>{
    const current=turnRef.current;if(!current)return;
    turnRef.current=null;
    setPuzquence.current,move:next});return;}
    setTurn(null);lock.current=false;
    if(shuffleRef.current){shuffleRef.current=false;setShuffling(false);setRecord(previous=>({...previous,moves:0,shuffled:true}));}
  },[]);
  const shuffle=useCallback(()=>{
    if(lock.current||shuffleRef.current)return;
    queue.current=scrambleMoves(size,size===2?12:size===3?22:32);
    const first=queue.current.shift();if(!first)return;
    shuffleRef.current=true;setShuffling(true);lock.current=true;
    setTurn({id:++sequence.current,move:first});
  },[size]);
  return {puzzle,turn,move,complete,shuffle,shuffling,moves:record.moves,shuffled:record.shuffled,busy:!!turn,saveFailed};
}
