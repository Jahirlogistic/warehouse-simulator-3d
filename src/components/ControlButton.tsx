import type { ReactNode } from 'react';
export default function ControlButton({label,children,onDown,onUp,wide=false}:{label:string;children:ReactNode;onDown:()=>void;onUp:()=>void;wide?:boolean}){
 return <button className={`touch-control ${wide?'wide':''}`} aria-label={label} onPointerDown={e=>{e.preventDefault();(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);onDown();}} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={e=>e.preventDefault()}>{children}<small>{label}</small></button>;
}
