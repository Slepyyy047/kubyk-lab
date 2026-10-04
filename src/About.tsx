import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Cuboid, Layers3, Puzzle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CubeView from './CubeView';
import { solvedColors } from './cube';

const history = [
  { year: '1974', title: 'Рухома просторова модель', text: 'Угорський архітектор і викладач Ерне Рубік створив рухому тривимірну модель, щоб допомогти студентам краще зрозуміти просторові відношення.', source: 'https://www.rubiks.com/history', sourceLabel: 'Історія Rubik’s' },
  { year: '1975', title: 'Заявка на патент', text: 'Рубік подав заявку на патент для конструкції «Магічного куба».', source: 'https://rubik.hu/hirek/rubik-lexikon/30-a-rubik-kocka', sourceLabel: 'Rubik Studio: історія кубика' },
  { year: '1977', title: 'Перший випуск в Угорщині', text: 'Для внутрішнього ринку виготовили першу партію «Магічного куба» — 12 тисяч екземплярів.', source: 'https://rubik.hu/hirek/rubik-lexikon/29-kronologia', sourceLabel: 'Rubik Studio: хронологія' },
  { year: '1980', title: 'Міжнародний запуск', text: '«Магічний куб» перейменували на «Кубик Рубіка» й запустили на міжнародному ринку.', source: 'https://www.rubiks.com/history', sourceLabel: 'Історія Rubik’s' }
];

const sourceClass = 'source-link';

export default function About() {
  return <>
    <div className="page-intro">
      <div>
        <div className="eyebrow"><span className="status-dot" /> ПРО ГОЛОВОЛОМКУ</div>
        <h1>Один кубик. <span>Багато ідей.</span></h1>
        <p>Як навчальна модель стала механічною головоломкою,<br />що поєднує простір, логіку й рух.</p>
      </div>
      <div className="intro-note"><Cuboid size={25} /><span>3×3×3<br />26 видимих деталей</span></div>
    </div>

    <div className="about-layout">
      <article className="article card">
        <div className="section-label"><CalendarDays size={15} /> ІСТОРІЯ</div>
        <h2>Від навчального засобу до головоломки</h2>
        <p>Ерне Рубік створив куб як рухому модель для пояснення просторових взаємозв’язків. Ідея полягала в тому, щоб частини могли обертатися навколо осей, не розпадаючись. Згодом перемішування кольорових граней стало самостійною задачею: повернути кожну грань до одного кольору.</p>
        <ol className="history-list" aria-label="Ключові дати історії кубика">
          {history.map((item) => <li className="history-event" key={item.year}>
            <span className="history-year">{item.year}</span>
            <div><h3>{item.title}</h3><p>{item.text}</p><a className={sourceClass} href={item.source} target="_blank" rel="noreferrer">{item.sourceLabel} <ArrowUpRight size={12} aria-hidden="true" /></a></div>
          </li>)}
        </ol>

        <hr />
        <div className="section-label"><Cuboid size={15} /> БУДОВА</div>
        <h2>Три типи деталей</h2>
        <p>У стандартному кубику 3×3 видно 26 рухомих деталей: 6 центрів, 12 ребер і 8 кутів. Кожен центр має один колір, кожне ребро — два, кожен кут — три. Центральні деталі задають колір кожної грані; під час звичайних поворотів вони залишаються на місцях відносно одна одної.</p>
        <div className="fact-grid about-facts">
          <div><b>6</b><span>центрів · 1 колір</span></div>
          <div><b>12</b><span>ребер · 2 кольори</span></div>
          <div><b>8</b><span>кутів · 3 кольори</span></div>
        </div>
        <p>Саме деталі, а не окремі наліпки, переміщуються навколо куба. Тому не кожне розташування кольорів можливе: наприклад, на правильно зібраному 3×3 не можна перевернути лише одне ребро або закрутити лише один кут.</p>
        <a className={sourceClass} href="https://rubiks.com/solve-guide" target="_blank" rel="noreferrer">
          Офіційний посібник: центри, ребра й кути <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <a className={sourceClass} href="https://kociemba.org/math/cubielevel.htm" target="_blank" rel="noreferrer">
          Математична модель деталей і допустимих станів <ArrowUpRight size={14} aria-hidden="true" />
        </a>

        <hr />
        <div className="section-label"><Layers3 size={15} /> ІНШІ РОЗМІРИ</div>
        <h2>Чим відрізняються 2×2 і 4×4</h2>
        <p><strong>2×2</strong> складається лише з восьми кутових деталей; видимих центрів і ребер у нього немає. Через це положення кольорів визначається кутами, а не нерухомими центрами, як у 3×3.</p>
        <p><strong>4×4</strong> має рухомі центральні блоки та парні реберні деталі. Під час зведення його до моделі 3×3 іноді виникає паритет: наприклад, одна пара ребер виглядає перевернутою або дві пари — поміняними місцями. Такий стан можливий на 4×4 і виправляється окремим алгоритмом.</p>
        <a className={sourceClass} href="https://www.cubeskills.com/uploads/pdf/tutorials/beginners-method-for-solving-the-4x4-cube.pdf" target="_blank" rel="noreferrer">
          Посібник зі складання 4×4 та паритету <ArrowUpRight size={14} aria-hidden="true" />
        </a>

        <hr />
        <div className="section-label"><Puzzle size={15} /> СПІДКУБІНГ</div>
        <h2>Збирати на швидкість</h2>
        <p>Спідкубінг — розв’язання кубика та інших головоломок на час. Учасники тренують огляд стану, послідовність алгоритмів і точність рухів. World Cube Association (WCA) визначає правила офіційних змагань; серед її дисциплін є 2×2, 3×3, 4×4 та складання однією рукою.</p>
        <a className={sourceClass} href="https://www.worldcubeassociation.org/regulations/" target="_blank" rel="noreferrer">
          Правила та офіційні дисципліни WCA <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </article>

      <aside>
        <div className="about-visual card">
          <div className="section-label"><span className="status-dot" /> ЗІБРАНИЙ 3×3</div>
          <CubeView stickers={solvedColors()} />
          <p>Обертай модель мишкою або дотиком.</p>
        </div>
        <div className="green-callout">
          <BookOpen size={23} aria-hidden="true" />
          <h3>Вивчи кубик поетапно</h3>
          <p>Почни з будови й позначень, а потім склади хрест і шари.</p>
          <Link className="button dark" to="/lessons">Перейти до уроків <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </aside>
    </div>
  </>;
}
