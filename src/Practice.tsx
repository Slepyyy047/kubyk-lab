import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Play, Pause, Check, Move3d } from 'lucide-react';
import CubeView from './CubeView';
import { applyMoves, describeMove, faceletsToColors, invertAlgorithm } from './cube';
import type { Solution } from './storage';

interface Props { solution:Solution; step:number; onStep:(step:number)=>void; speed:number; onSpeed:(speed:number)=>void; lesson?:boolean }
export default function Player({solution,step,onStep,speed,onSpeed,lesson}:Props) {
  const [playing,setPlaying] = useState(false);
  const [turn,setTurn] = useState<{move:string;target:number;reverse:boolean;duration:number}|null>(null);
  const reduced = useRef(false);
  useEffect(()=>{ const q=window.matchMedia('(prefers-reduced-motion: reduce)'); reduced.current=q.matches; const change=()=>{reduced.current=q.matches}; q.addEventListener('change',change); return ()=>q.removeEventListener('change',change); },[]);
  const facelets = useMemo(()=>applyMoves(solution.facelets,solution.moves.slice(0,step)),[solution,step]);
  const stickers = useMemo(()=>faceletsToColors(facelets,solution.centers),[facelets,solution.centers]);
  const duration = reduced.current ? 0 : 650/speed;
  const begin = (target:number) => {
    if(turn || target<0 || target>solution.moves.length || target===step) return;
    setTurn({move:solution.moves[target>step?step:target],target,reverse:target<step,duration});
  };
  useEffect(()=>{
    if(!playing || turn) return;
    if(step>=solution.moves.length) {setPlaying(false);return;}
    const timer=window.setTimeout(()=>begin(step+1),250/speed);
    return ()=>clearTimeout(timer);
  },[playing,turn,step,speed]);
  useEffect(()=>{const hidden=()=>{if(document.hidden)setPlaying(false)}; document.addEventListener('visibilitychange',hidden); return ()=>document.removeEventListener('visibilitychange',hidden);},[]);
  const complete=()=>{if(turn){onStep(turn.target);setTurn(null)}};
  const completeState=step===solution.moves.length&&!turn;
  const shownMove=turn?(turn.reverse?invertAlgorithm(turn.move):turn.move):solution.moves[step];
  return <section className={`player ${lesson?'lesson-player':''}`} aria-label="Покрокове відтворення">
    <div className="card-heading"><span className="eyebrow"><Move3d size={16}/> {lesson?'Інтерактивний приклад':'Ваш кубик у 3D'}</span><span className="small-tag">{step} / {solution.moves.length}</span></div>
    <CubeView stickers={stickers} animation={turn?{move:turn.move,reverse:turn.reverse,duration:turn.duration,onComplete:complete}:undefined}/>
    <div className="player-body">
      <div className="progress-track"><span style={{width:`${solution.moves.length?step/solution.moves.length*100:100}%`}}/></div>
      <div className="move-instruction" aria-live="polite"><span className={`move-symbol ${completeState?'done':''}`}>{completeState?<Check size={25}/>:shownMove}</span><div><strong>{completeState?(lesson?'Приклад завершено':'Кубик складено!'):turn?.reverse?`Скасування руху ${step}`:`Рух ${step+1} із ${n className="icon-button" onClick={()=>{setPlaying(false);onStep(0)}} disabled={!!turn||step===0} title="На початок" aria-label="На початок"><RotateCcw size={18}/></button>
        <button className="icon-button" onClick={()=>{setPlaying(false);besize={19}/></button>
      </div>
      <label className="speed-label">Швидкість <select value={speed} onChange={e=>onSpeed(Number(e.target.value))}><option value="0.5">0,5× — повільно</option><option value="1">1× — звичайно</option><option value="1.5">1,5×</option><option value="2">2× — швидко</option></select></label>
      <div className="algorithm-heading"><strong>Послідовність рухів</strong><span>{solution.moves.length} рухів · HTM</span></div>
      <div className="move-list" aria-label="Послідовність рухів">{solution.moves.map((move,i)=><button key={i} disabled={!!turn} aria-label={`Перейти до стану після руху ${i+1}: ${move}`} aria-current={i===step?'step':undefined} className={i<step?'visited':i===step?'current':''} onClick={()=>ерх',D:'Низ',F:'Перед',B:'Зад',R:'Праворуч',L:'Ліворуч'};
function moveCount(count:number){
  const last=count%10,teen=count%100>=11&&count%100<=14;
  return `${count} ${!teen&&last===1?'рух':!teen&&last>=2&&last<=4?'рухи':'рухів'}`;
}
function Board(ove]);
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
