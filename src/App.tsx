import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Box, ArrowUpRight, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Eraser, FlaskConical, Info, LockKeyhole, Palette, RotateCcw, ShieldCheck, Sparkles, TriangleAlert, BookOpen, Menu, X, Gamepad2, Home as HomeIcon } from 'lucide-react';
import CubeView from './CubeView';
import Player from './Player';
import Home from './Home';
import Practice from './Practice';
import About from './About';
import { colors, faces, exampleColors, solvedColors, validate, applyMoves, type Color, type Face } from './cube';
import { readSaved, STORAGE_KEY, type Solution } from './storage';
import { lessons } from './lessons';

const names:Record<Face,string>={U:'Верхня',R:'Права',F:'Передня',D:'Нижня',L:'Ліва',B:'Задня'};
const colorOrder:Color[]=['white','yellow','red','orange','blue','green'];
const hints:Record<Face,string>={U:'Передня грань F — біля нижнього краю.',D:'Передня грань F — біля верхнього краю.',F:'Дивіться прямо на передню грань. U — вгорі.',B:'Поверніть увесь кубик на 180° по горизонталі. U — вгорі, R — ліворуч.',R:'Поверніть увесь кубик правою гранню до себе. U — вгорі, F — ліворуч.',L:'Поверніть увесь кубик лівою гранню до себе. U — вгорі, F — праворуч.'};

function Notation(){return <div className="notation"><div className="section-label">МОВА КУБИКА</div><h3>Шість літер. Усі рухи.</h3><div className="notation-grid">{faces.map(f=><div key={f}><b>{f}</b><span>{names[f]}</span></div>)}</div><p><strong>R</strong> — 90° за годинниковою стрілкою.<br/><strong>R′</strong> — 90° проти годинникової стрілки.<br/><strong>R2</strong> — 180°, пів оберту.</p><div className="note"><Info size={17}/><span>Напрямок визначайте, дивлячись <strong>прямо на грань, яку обертаєте</strong>. Для B уявіть погляд ззаду, для D — знизу.</span></div></div>}

function Solver(){
  const [initial]=useState(()=>readSaved());
  const [input,setInput]=useState<(Color|null)[]>(()=>initial?.input??exampleColors());
  const [solution,setSolution]=useState<Solution|null>(initial?.solution??null);
  const [step,setStep]=useState(initial?.step??0);
  const [speed,setSpeed]=useState(initial?.speed??1);
  const [selected,setSelected]=useState<Color>('white');
  const [centersEditable,setCentersEditable]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const [example,setExample]=useState(!initial);
  const [faceHint,setFaceHint]=useState<Face>('F');
  const [help,setHelp]=useState(false);
  const worker=useRef<Worker|null>(null);
  const requestId=useRef(0);
  const timeout=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const resultRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify({input,solution,step,speed}));setStorageError(false)}catch{setStorageError(true)}},[input,solution,step,speed]);
  useEffect(()=>()=>{worker.current?.terminate();clearTimeout(timeout.current)},[]);
  const edit=(next:(Color|null)[],isExample=false)=>{requestId.current++;clearTimeout(timeout.current);setInput(next);setSolution(null);setStep(0);setError('');setBusy(false);setExample(isExample)};
  const solve=()=>{
    const result=validate(input);
    if(!result.ok){setError(result.error);setSolution(null);return;}
    setError('');
    const centers=[4,13,22,31,40,49].map(i=>input[i] as Color);
    if(faces.every((f,i)=>result.facelets.slice(i*9,i*9+9)===f.repeat(9))){setSolution({facelets:result.facelets,moves:[],centers});setStep(0);return;}
    setBusy(true);
    const id=++requestId.current;
    try {
      if(!worker.current)worker.current=new Worker(new URL('./solver.worker.ts',import.meta.url),{type:'module'});
      worker.current.onmessage=(e:MessageEvent<{id:number;moves:string[];error?:string}>)=>{
        if(e.data.id!==requestId.current)return;
        clearTimeout(timeout.current);setBusy(false);
        if(e.data.error){setError(e.data.error);return;}
        const final=applyMoves(result.facelets,e.data.moves);
        if(!faces.every((f,i)=>final.slice(i*9,i*9+9)===f.repeat(9))){setError('Не вдалося перевірити розв’язання. Повторіть пошук.');return;}
        setSolution({facelets:result.facelets,moves:e.data.moves,centers});setStep(0);
        setTimeout(()=>resultRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}),100);
      };
      worker.current.onerror=()=>{clearTimeout(timeout.current);setBusy(false);setError('Розв’язувач не запустився. Спробуйте ще раз.');worker.current?.terminate();worker.current=null};
      timeout.current=setTimeout(()=>{requestId.current++;worker.current?.terminate();worker.current=null;setBusy(false);setError('Пошук тривав понад хвилину. Спробуйте ще раз або перевірте стан кубика.')},60000);
      worker.current.postMessage({id,facelets:result.facelets});
    } catch {setBusy(false);setError('Браузер не зміг запустити розв’язувач. Спробуйте сучасний Chrome, Firefox або Safari.');}
  };
  const counts=Object.fromEntries(colorOrder.map(c=>[c,input.filter(v=>v===c).length])) as Record<Color,number>;
  const filled=input.filter(Boolean).length;
  return <>
    <div className="page-intro"><div><div className="eyebrow"><span className="status-dot"/> ВІД КОЛЬОРІВ ДО РОЗВ’ЯЗАННЯ</div><h1>Складімо <span>кубик.</span></h1><p>Перенесіть кольори свого кубика — і пройдіть<br className="desktop-break"/> шлях до зібраних граней, рух за рухом.</p></div><div className="intro-note"><span className="mono">3 × 3 × 3</span><span>Одна головоломка.<br/>Зрозумілий наступний крок.</span></div></div>
    <div className="workspace">
      <section className="editor card"><div className="card-heading"><div className="number-heading"><span className="step-badge">01</span><div><h2>Перенесіть кольори</h2><p>Оберіть колір і натисніть на клітинку.</p></div></div><button className="text-button help-button" onClick={()=>setHelp(!help)} aria-expanded={help}><CircleHelp size={17}/> Як тримати кубик <ChevronDown size={14}/></button></div>
        {help&&<div className="orientation-help"><strong>Спочатку зафіксуйте передню та верхню грані.</strong><p>Поставте кубик перед собою: F дивиться на вас, U — вгору. На розгортці показано погляд прямо на кожну грань. Переміщуйте весь кубик, щоб оглянути інші грані; не обертайте окремі шари.</p><p>Для U нахиліть кубик, щоб побачити верх: край, що торкається F, має бути внизу зображення. Для D край біля F має бути вгорі. Для бічних граней зберігайте U вгорі. Після огляду поверніться до початкового положення F/U.</p><p>Центри не змінюють положення відносно один одного. Колір центру визначає колір зібраної грані. Якщо схема вашого кубика інша, увімкніть редагування центрів.</p></div>}
        <div className="palette" role="group" aria-label="Палітра кольорів">{colorOrder.map((c,i)=><button key={c} aria-label={`Обрати колір: ${colors[c].label}`} aria-pressed={selected===c} onClick={()=>setSelected(c)} className={`color-choice ${selected===c?'selected':''}`}><span className="swatch" style={{background:colors[c].hex}}>{selected===c&&<Check size={17}/>}</span><span>{colors[c].label}</span><kbd>{i+1}</kbd></button>)}</div>
        <div className="editor-status"><span><Palette size={14}/> Обрано: <strong>{colors[selected].label.toLowerCase()}</strong></span><span>{example?'Завантажено приклад':`${filled} із 54 клітинок`}</span></div>
        <div className="cube-net" role="group" aria-label="Розгортка кубика" onKeyDown={e=>{if(/^[1-6]$/.test(e.key)){setSelected(colorOrder[Number(e.key)-1]);e.preventDefault()}}}>{(['U','L','F','R','B','D'] as Face[]).map(face=>{const faceIndex=faces.indexOf(face);return <div key={face} className={`net-face face-${face}`}><div className="face-title"><span>{face}</span> {names[face]}</div><div className="face-grid">{Array.from({length:9},(_,cell)=>{const i=faceIndex*9+cell;const center=cell===4;return <button key={cell} className={`sticker ${center?'center':''} ${input[i]===null?'empty':''}`} style={{background:input[i]?colors[input[i]!].hex:undefined,color:input[i]==='white'||input[i]==='yellow'?'#333':'#fff'}} title={`${names[face]}: ${center?'центр':`клітинка ${cell+1}`} — ${input[i]?colors[input[i]!].label:'не заповнена'}`} aria-label={`${names[face]}, ${center?'центр':`клітинка ${cell+1}`}, ${input[i]?colors[input[i]!].label:'не заповнена'}`} aria-disabled={center&&!centersEditable} onFocus={()=>setFaceHint(face)} onMouseEnter={()=>setFaceHint(face)} onClick={()=>{setFaceHint(face);if(center&&!centersEditable)return;const next=[...input];next[i]=selected;edit(next)}}>{center?<><span>{face}</span>{!centersEditable&&<LockKeyhole size={10}/>}</>:null}</button>})}</div></div>})}</div>
        <div className="mobile-face-editor">
          <div className="mobile-face-heading"><strong>Заповнюйте по одній грані</strong><span>Збільшені клітинки для дотику</span></div>
          <div className="mobile-face-tabs" role="group" aria-label="Грань для збільшеного редагування">{(['U','L','F','R','B','D'] as Face[]).map(f=><button key={f} aria-pressed={faceHint===f} onClick={()=>setFaceHint(f)}>{f}<small>{names[f]}</small></button>)}</div>
          <div className="mobile-face-grid">{Array.from({length:9},(_,cell)=>{const i=faces.indexOf(faceHint)*9+cell;return <button key={cell} style={{background:input[i]?colors[input[i]!].hex:'#edf0e7',color:input[i]==='white'||input[i]==='yellow'?'#333':'#fff'}} aria-label={`Збільшена ${names[faceHint]}, клітинка ${cell+1}, ${input[i]?colors[input[i]!].label:'не заповнена'}`} aria-disabled={cell===4&&!centersEditable} onClick={()=>{if(cell===4&&!centersEditable)return;const next=[...input];next[i]=selected;edit(next)}}>{cell===4?<>{faceHint}{!centersEditable&&<LockKeyhole size={13}/>}</>:null}</button>})}</div>
        </div>
        <div className="face-hint"><Info size={15}/><span><strong>{faceHint} · {names[faceHint]}.</strong> {hints[faceHint]}</span></div>
        <label className="center-toggle"><input type="checkbox" checked={centersEditable} onChange={e=>setCentersEditable(e.target.checked)}/> Редагувати центральні клітинки <span>для іншої схеми кольорів</span></label>
        <div className="color-counts" aria-label="Кількість клітинок кожного кольору">{colorOrder.map(c=><span key={c} className={counts[c]===9?'count-ok':counts[c]>9?'count-error':''}><i style={{background:colors[c].hex}}/><span className="sr-only">{colors[c].label}: </span>{counts[c]}<small>/9</small>{counts[c]===9&&<Check size={11}/>}</span>)}</div>
        {error&&<div className="error-message" role="alert"><TriangleAlert size={19}/><span>{error}</span></div>}
        <div className="editor-actions"><button className="button primary" onClick={solve} disabled={busy}>{busy?<span className="spinner"/>:<Sparkles size={17}/>} {busy?'Шукаємо розв’язання…':'Знайти розв’язання'}{!busy&&<ArrowRight size={17}/>}</button><button className="text-button" onClick={()=>edit(solvedColors().map((c,i)=>i%9===4?c:null))}><Eraser size={16}/> Очистити</button><button className="text-button" onClick={()=>edit(exampleColors(),true)}><RotateCcw size={15}/> Завантажити приклад</button></div>
        <div className="local-note"><ShieldCheck size={13}/>{storageError?'Браузер не дозволив зберегти прогрес. Залишайте вкладку відкритою.':'Стан і прогрес зберігаються у вашому браузері.'}{busy&&' Перший пошук готує таблиці й може тривати кілька секунд.'}</div>
      </section>
      <aside className="workspace-aside"><div ref={resultRef} className="result-anchor">{solution?<Player key={solution.facelets+solution.moves.join('')} solution={solution} step={step} onStep={setStep} speed={speed} onSpeed={setSpeed}/>:<section className="preview card"><div className="card-heading"><span className="eyebrow"><Box size={16}/> ПОПЕРЕДНІЙ ПЕРЕГЛЯД</span><span className="small-tag">3D</span></div><CubeView stickers={input}/><div className="preview-caption"><span className="step-badge">02</span><div><h3>Ваше розв’язання — тут</h3><p>Після перевірки кольорів покажемо<br/>рухи та проведемо через кожен крок.</p></div></div></section>}</div><Notation/></aside>
    </div>
    <section className="bottom-strip"><div><ShieldCheck/><h3>Перевіряємо перед пошуком</h3><p>Кількість кольорів, центри, ребра, кути та їх орієнтацію.</p></div><div><BookOpen/><h3>Хочете зрозуміти кожен рух?</h3><p>Почніть із коротких уроків і практики на 3D-кубику.</p><Link to="/lessons">До уроків <ArrowUpRight size={15}/></Link></div><div><LockKeyhole/><h3>Усе на вашому пристрої</h3><p>Без реєстрації. Обчислення та збереження працюють у браузері.</p></div></section>
  </>;
}

function Lessons(){
  const [active,setActive]=useState(0);const [demoIndex,setDemoIndex]=useState(0);const [step,setStep]=useState(0);const [speed,setSpeed]=useState(1);
  const l=lessons[active]; const demos=[l,...(l.demos??[])]; const demo=demos[demoIndex]??l;
  const solution:Solution=useMemo(()=>({facelets:applyMoves(l.base,demo.setup),moves:demo.algorithm.split(/\s+/).filter(Boolean),centers:l.centers}),[l,demo]);
  return <><div className="page-intro"><div><div className="eyebrow"><span className="status-dot"/> ВІД ПЕРШОГО ПОВОРОТУ ДО ПЕРШОГО РОЗВ’ЯЗАННЯ</div><h1>Зрозуміти. <span>І скласти.</span></h1><p>Шість уроків для початківців.<br/>Один крок, одна ідея, трохи практики.</p></div><div className="intro-note"><BookOpen size={25}/><span>У власному темпі.<br/>Без поспіху й секундоміра.</span></div></div><div className="lessons-layout"><nav className="lesson-nav" aria-label="Обрати урок"><div className="section-label">ВАШ МАРШРУТ</div>{lessons.map((lesson,i)=><button key={lesson.id} className={i===active?'active':''} onClick={()=>{setActive(i);setDemoIndex(0);setStep(0)}} aria-current={i===active?'page':undefined}><span className="lesson-num">{String(i+1).padStart(2,'0')}</span><div><strong>{lesson.title}</strong><small>{lesson.subtitle}</small></div><ChevronRight size={16}/></button>)}<div className="lesson-nav-note"><Info size={17}/><p>Демонстрації показують конкретні випадки. Звіряйте початкові умови зі своїм кубиком перед алгоритмом.</p></div></nav><article className="lesson-content card"><div className="section-label">УРОК {String(active+1).padStart(2,'0')} / 06</div><h2>{l.title}</h2><p className="lesson-goal"><CheckCircle2 size={20}/><span><strong>Мета.</strong> {l.goal}</span></p>{l.explanation.map((p,i)=><p key={i}>{p}</p>)}{demos.length>1&&<label className="demo-selector">Обрати приклад<select value={demoIndex} onChange={e=>{setDemoIndex(Number(e.target.value));setStep(0)}}>{demos.map((d,i)=><option key={i} value={i}>{i===0?"Основний алгоритм":d.title}</option>)}</select></label>}<div className="conditions"><h3>Перед початком</h3><p><strong>Положення кубика:</strong> {demo.orientation}</p><p><strong>Початкові умови:</strong> {demo.conditions}</p></div><div className="lesson-algorithm"><span className="section-label">РУХИ ДЛЯ ЦЬОГО ПРИКЛАДУ</span><code>{demo.algorithm}</code><p>{demo.result}</p></div><h3>Типові помилки</h3><ul className="mistakes">{l.mistakes.map((m,i)=><li key={i}>{m}</li>)}</ul><div className="lesson-pager"><button className="text-button" disabled={active===0} onClick={()=>{setActive(active-1);setDemoIndex(0);setStep(0)}}>← Попередній урок</button><button className="button primary" disabled={active===lessons.length-1} onClick={()=>{setActive(active+1);setDemoIndex(0);setStep(0)}}>Наступний урок <ArrowRight size={16}/></button></div></article><aside><Player key={l.id+demoIndex} solution={solution} step={step} onStep={setStep} speed={speed} onSpeed={setSpeed} lesson/><div className="lesson-demo-note"><FlaskConical size={17}/><p>Приклад підготовлено зворотними рухами. Застосування всього алгоритму повертає кубик у складений стан.</p></div><Notation/></aside></div><div className="course-source">Курс використовує початковий пошаровий метод. Довідкові матеріали: <a href="https://rubiks.com/solve-guide" target="_blank" rel="noreferrer">офіційні посібники Rubik’s</a>. Для довільного стану скористайтеся <Link to="/solve">розв’язувачем</Link>.</div></>;
}

export default function App(){
  const location=useLocation();const main=useRef<HTMLElement>(null);
  const [menu,setMenu]=useState(false);
  useEffect(()=>{
    const titles:Record<string,string>={'/':'Головна','/solve':'Розв’язати','/play':'Грати','/lessons':'Уроки','/about':'Про кубик'};
    document.title=`${titles[location.pathname]??'Сторінку не знайдено'} — Кубик`;
    window.scrollTo(0,0);main.current?.focus({preventScroll:true});setMenu(false);
  },[location.pathname]);
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false)};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[]);
  return <>
    <a className="skip-link" href="#main">Перейти до вмісту</a>
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Кубик — головна"><span className="brand-icon"><Box size={25} strokeWidth={2}/></span>кубик<span className="brand-dot">.</span></Link>
      <nav id="main-navigation" className={menu?'menu-open':''} aria-label="Головне меню">
        <NavLink to="/" end><HomeIcon size={16}/>Головна</NavLink>
        <NavLink to="/play"><Gamepad2 size={17}/>Грати</NavLink>
        <NavLink to="/solve"><Box size={16}/>Розв’язати</NavLink>
        <NavLink to="/lessons"><BookOpen size={16}/>Уроки</NavLink>
        <NavLink to="/about"><Info size={16}/>Про кубик</NavLink>
      </nav>
      <span className="header-note">КРУТИ. ДОСЛІДЖУЙ.</span>
      <button className="menu-toggle" aria-label={menu?'Закрити меню':'Відкрити меню'} aria-expanded={menu} aria-controls="main-navigation" onClick={()=>setMenu(!menu)}>{menu?<X size={25}/>:<Menu size={25}/>}</button>
    </header>
    <main id="main" tabIndex={-1} ref={main}>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/play" element={<Practice/>}/>
        <Route path="/solve" element={<Solver/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/lessons" element={<Lessons/>}/>
        <Route path="*" element={<div className="not-found"><h1>Цю грань не знайдено.</h1><p>Такої сторінки немає.</p><Link className="button primary" to="/">На головну <ArrowRight size={17}/></Link></div>}/>
      </Routes>
    </main>
    <footer><Link to="/" className="footer-brand">кубик.</Link><span>Від першого руху до зібраних граней.</span><Link className="footer-last" to="/about">Як він влаштований <ArrowUpRight size={15}/></Link></footer>
  </>;
}


