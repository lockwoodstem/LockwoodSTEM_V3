import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
(self as typeof self & { MonacoEnvironment: unknown }).MonacoEnvironment = { getWorker: () => new EditorWorker() };
export function Editor({code, onChange, onRun, fontSize}: {code:string; onChange:(value:string)=>void; onRun:()=>void; fontSize:number}) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const actions = useRef({onChange,onRun}); actions.current = {onChange,onRun};
  useEffect(() => {
    const instance = monaco.editor.create(host.current!, {value:code,language:'python',theme:'vs-dark',automaticLayout:true,fontSize,minimap:{enabled:false},scrollBeyondLastLine:false,tabSize:4,insertSpaces:true,wordWrap:'on',ariaLabel:'Python code editor',padding:{top:18},fixedOverflowWidgets:true});
    editor.current = instance;
    const change = instance.onDidChangeModelContent(() => actions.current.onChange(instance.getValue()));
    instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => actions.current.onRun());
    return () => { change.dispose(); const model = instance.getModel(); instance.dispose(); model?.dispose(); };
  }, []);
  useEffect(() => { if(editor.current && editor.current.getValue() !== code) editor.current.setValue(code); }, [code]);
  useEffect(() => { editor.current?.updateOptions({fontSize}); }, [fontSize]);
  return <div className="studio-editor" ref={host} />;
}
