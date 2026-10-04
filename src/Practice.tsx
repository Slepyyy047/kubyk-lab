import { useEffect, useState } from 'react';
import { Check, ChevronDown, Shuffle, Keyboard, Hand, RotateCcw } from 'lucide-react';
import InteractiveCube from './InteractiveCube';
import usePuzzle from './usePuzzle';
import { faces, type Face } from './cube';
import { isPuzzleSolved, parsePuzzleKey, puzzleMoveLabel, type PuzzleSize } from './puzzle';

const faceNames:Record<Face,string>={U:'Верх',D:'Низ',F:'Перед',B:'Зад',R:'Праворуч',L:'Ліворуч'};
function moveCount(count:number){
  const last=count%10,teen=count%100>=11&&count%100<=14;
  return `${count} ${!teen&&last===1?'рух':!teen&&last>=2&&last<=4?'рухи':'рухів'}`;
}
function Board({size,onSize}:{size:PuzzleSize;onSize:(size:PuzzleSize)=>void}){
  const game=usePuzzle(size);
  const [available,setAvailable]=useState(true);
  const [inverse,setInverse]=useState(false);
  const [inner,setInner]=useState(false);
  const solved=isPuzzleSolved(game.puzzle);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(!(e.target instanceof HTMLElement)||!e.target.closest('.practice-page')||['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(e.target.tagName))return;
      const move=parsePuzzleKey(e.key,e.shiftKey,e.altKey,size);
      if(move&&!e.ctrlKey&&!e.metaKey){e.preventDefault();game.move(move);}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[size,game.move]);
  return <div className="practice-page">
    <div className="practice-heading"><div><div className="eyebrow"><span className="status-dot"/> ВІРТУАЛЬНИЙ КУБИК</div><h1>Тепер <span>твоя черга.</span></h1></div><label className="model-select">Модель<select value={size} disabled={game.busy} onChange={e=>onSize(Number(e.target.value) as PuzzleSize)}><option value="2">2 × 2 — кишеньковий</option><option value="3">3 × 3 — класичний</option><option value="4">4 × 4 — ще один рівень</option></select><ChevronDown size={16}/></label></div>
    <div className="practice-arena">
      <div className="game-status" aria-live="polite"><span className={solved?'solved-badge':'playing-badge'}>{game.shuffling?<><RotateCcw size={15}/> Перемішуємо…</>:solved?<><Check size={15}/>{game.shuffled?'Складено. Є!':'Готовий до гри'}</>:<>У процесі</>}</span><span>{moveCount(game.moves)}</span></div>
      <InteractiveCube puzzle={game.puzzle} turn={game.turn?{...game.turn,onComplete:game.complete}:undefined} onMove={game.move} onReady={setAvailable}/>
      <div className="shuffle-bar"><button className="button primary shuffle-button" onClick={game.shuffle} disabled={game.busy}><Shuffle size={19}/>{game.shuffling?'Перемішуємо…':'Перемішати кубик'}</button><p>{game.saveFailed?'Браузер не дозволив зберегти гру.':'Можеш закрити вкладку. Кубик чекатиме тут.'}</p></div>
    </div>
    <div className="practice-instructions"><p><Hand size={19}/><span><strong>Крути шари.</strong> Затисни клітинку й потягни вздовж грані. Натискання без руху обертає всю грань.</span></p><p><RotateCcw size={19}/><span><strong>Оглядай.</strong> Перетягуй порожній простір або використовуй праву кнопку миші. Стрілки на клавіатурі змінюють кут огляду.</span></p><p><Keyboard size={19}/><span><strong>Клавіші U D L R F B.</strong> Shift — у зворотний бік.{size===4?' Alt — внутрішній шар.':''}</span></p></div>
    <details className="manual-controls" open={!available}><summary>Керування без жестів <Keyboard size={17}/></summary><div><p>Ці кнопки роблять ті самі повороти. F завжди означає початкову передню грань, незалежно від камери.</p><div className="manual-options"><label><input type="checkbox" checked={inverse} onChange={e=>setInverse(e.target.checked)}/> У зворотний бік</label>{size===4&&<label><input type="checkbox" checked={inner} onChange={e=>setInner(e.target.checked)}/> Внутрішній шар</label>}</div><div className="manual-moves">{faces.map(face=><button key={face} disabled={game.busy} aria-label={`Повернути ${faceNames[face]}${inverse?' у зворотний бік':''}${inner?' внутрішній шар':''}`} onClick={()=>game.move({face,depth:inner?1:0,turns:inverse?-1:1})}><b>{puzzleMoveLabel({face,depth:inner?1:0,turns:inverse?-1:1})}</b><span>{faceNames[face]}</span></button>)}</div></div></details>
  </div>;
}
export default function Practice(){
  const [size,setSize]=useState<PuzzleSize>(()=>{try{const saved=Number(localStorage.getItem('kubyk:play:size'));return saved===2||saved===4?saved:3;}catch{return 3;}});
  const select=(next:PuzzleSize)=>{setSize(next);try{localStorage.setItem('kubyk:play:size',String(next))}catch{/* The game remains usable without storage. */}};
  return <Board key={size} size={size} onSize={select}/>;
}
