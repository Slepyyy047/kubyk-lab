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
      <div className="move-instruction" aria-live="polite"><span className={`move-symbol ${completeState?'done':''}`}>{completeState?<Check size={25}/>:shownMove}</span><div><strong>{completeState?(lesson?'Приклад завершено':'Кубик складено!'):turn?.reverse?`Скасування руху ${step}`:`Рух ${step+1} із ${solution.moves.length}`}</strong><p>{completeState?(solution.moves.length===0?'Ваш кубик уже складений — рухи не потрібні.':'Усі грані мають свій колір.'):describeMove(shownMove)}</p></div></div>
      <div className="playback-controls">
        <button className="icon-button" onClick={()=>{setPlaying(false);onStep(0)}} disabled={!!turn||step===0} title="На початок" aria-label="На початок"><RotateCcw size={18}/></button>
        <button className="icon-button" onClick={()=>{setPlaying(false);begin(step-1)}} disabled={!!turn||step===0} title="Назад" aria-label="Назад"><ArrowLeft size={19}/></button>
        <button className="button dark play-button" disabled={completeState&&!playing} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Пауза':'Відтворити'}</button>
        <button className="icon-button" onClick={()=>{setPlaying(false);begin(step+1)}} disabled={!!turn||completeState} title="Наступний рух" aria-label="Наступний рух"><ArrowRight size={19}/></button>
      </div>
      <label className="speed-label">Швидкість <select value={speed} onChange={e=>onSpeed(Number(e.target.value))}><option value="0.5">0,5× — повільно</option><option value="1">1× — звичайно</option><option value="1.5">1,5×</option><option value="2">2× — швидко</option></select></label>
      <div className="algorithm-heading"><strong>Послідовність рухів</strong><span>{solution.moves.length} рухів · HTM</span></div>
      <div className="move-list" aria-label="Послідовність рухів">{solution.moves.map((move,i)=><button key={i} disabled={!!turn} aria-label={`Перейти до стану після руху ${i+1}: ${move}`} aria-current={i===step?'step':undefined} className={i<step?'visited':i===step?'current':''} onClick={()=>{setPlaying(false);onStep(i+1)}}><small>{i+1}</small>{move}</button>)}</div>
      <p className="fineprint">Подвійний поворот рахується як один рух. Клік на позначенні переходить до стану після цього руху. Пауза зупиняє відтворення після поточного повороту.</p>
    </div>
  </section>;
}
