import {lessons,type Lesson} from './lessons';

/**
 * Studio is the coding workspace. Assignment directions and evidence requirements
 * live on the corresponding ADM lesson pages, not inside this selector.
 */
type Props = {
  disabled:boolean;
  onLaunch:(lesson:Lesson)=>void;
};
export function Classroom({disabled,onLaunch}:Props) {
  return <section className="studio-panel classroom classroom-compact" aria-labelledby="classroom-title">
    <div className="panel-heading"><h2 id="classroom-title">ADM lesson code</h2></div>
    <div className="classroom-body">
      <label htmlFor="studio-lesson-code">Load lesson starter code</label>
      <select id="studio-lesson-code" aria-label="Classroom lesson" value="" disabled={disabled}
        onChange={e=>{const next=lessons.find(l=>l.id===e.target.value);if(next)onLaunch(next);}}>
        <option value="">Choose an ADM lesson…</option>
        {lessons.map((lesson,i)=><option key={lesson.id} value={lesson.id}>{['2.1.8','2.1.9','2.1.10'][i] || ''} · {lesson.title.replace(/^[0-9]+ · /,'')}</option>)}
      </select>
    </div>
  </section>;
}
