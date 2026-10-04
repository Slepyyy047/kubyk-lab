import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Maximize2, Minimize2, MousePointer2, MoveRight } from 'lucide-react';
import InteractiveCube from './InteractiveCube';
import usePuzzle from './usePuzzle';
import { parsePuzzleKey } from './puzzle';

export default function Home(){
  const game=usePuzzle(3,false);
  const [exploded,setExploded]=useState(false);
  const [available,setAvailable]=useState(true);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(!(e.target instanceof HTMLElement)||!e.target.closest('.home-stage')||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||exploded)return;
      const move=parsePuzzleKey(e.key,e.shiftKey,e.altKey,3);
      if(move){e.preventDefault();game.move(move);}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[game.move,exploded]);
  return <div className="home-page">
    <section className="home-hero">
      <div className="home-copy"><div className="eyebrow"><span className="status-dot"/> 3 × 3 · ІНТЕРАКТИВНА МОДЕЛЬ</div><h1>Почни<br/> з <span>повороту.</span></h1><p>Потягни грань. Зміни кут огляду.<br/>Подивись, як усе рухається разом.</p><div className="home-actions"><Link className="button primary" to="/play">Скласти самому <ArrowUpRight size={20}/></Link><Link className="home-secondary" to="/solve">Маю фізичний кубик <MoveRight size={19}/></Link></div></div>
      <div className={`home-stage ${exploded?'is-exploded':''}`}>
        <div className="stage-index"><span>ОБ’ЄКТ 001</span><span>RUBIK’S CUBE</span></div>
        <InteractiveCube puzzle={game.puzzle} turn={game.turn?{...game.turn,onComplete:game.complete}:undefined} onMove={game.move} interactive={!exploded} exploded={exploded} hero onReady={setAvailable}/>
        {available&&<button className="explode-button" disabled={game.busy} aria-pressed={exploded} onClick={()=>setExploded(!exploded)}>{exploded?<Minimize2 size={17}/>:<Maximize2 size={17}/>} {exploded?'Зібрати деталі':'Зазирнути всередину'}</button>}
        <div className="stage-bottom"><span><MousePointer2 size={15}/> {exploded?'Розсунуті деталі. Обертай модель, щоб оглянути.':'Клітинка + рух пальцем — поворот шару'}</span><span className="stage-coordinate">X / Y / Z</span></div>
      </div>
    </section>
    <section className="home-paths" aria-label="Що робити далі"><Link to="/play"><span className="path-number">01</span><div><h2>Пограти</h2><p>2×2, 3×3 або 4×4. Перемішай і склади своїми руками.</p></div><ArrowUpRight/></Link><Link to="/lessons"><span className="path-number">02</span><div><h2>Розібратися</h2><p>Від білого хреста до останнього кута. З прикладами.</p></div><ArrowUpRight/></Link><Link to="/solve"><span className="path-number">03</span><div><h2>Знайти розв’язання</h2><p>Перенеси кольори фізичного кубика й отримай рухи.</p></div><ArrowUpRight/></Link></section>
  </div>;
}

