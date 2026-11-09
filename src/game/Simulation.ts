import * as THREE from 'three';
import { buildForklift, buildWarehouse, type PalletObject } from './warehouse';
import { useSimStore } from '../store/useSimStore';

type Controls={forward:boolean;reverse:boolean;left:boolean;right:boolean;brake:boolean;raise:boolean;lower:boolean;tiltBack:boolean;tiltForward:boolean};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export class Simulation {
  renderer:THREE.WebGLRenderer; scene=new THREE.Scene(); camera:THREE.PerspectiveCamera; clock=new THREE.Clock(); forklift:ReturnType<typeof buildForklift>; pallets:PalletObject[]; controls:Controls={forward:false,reverse:false,left:false,right:false,brake:false,raise:false,lower:false,tiltBack:false,tiltForward:false};
  speed=0; heading=0; forkHeight=0; tilt=0; distance=0; elapsed=0; carried:PalletObject|null=null; keys=new Set<string>(); running=true; private frame=0; private lastTelemetry=0;
  constructor(private canvas:HTMLCanvasElement){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene.background=new THREE.Color('#c9d5df');this.scene.fog=new THREE.Fog('#c9d5df',55,115);
    const hemi=new THREE.HemisphereLight('#ffffff','#667788',2.0);this.scene.add(hemi);
    const sun=new THREE.DirectionalLight('#fff4df',2.2);sun.position.set(-22,35,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;this.scene.add(sun);
    this.camera=new THREE.PerspectiveCamera(58,canvas.clientWidth/canvas.clientHeight,.1,180);
    this.pallets=buildWarehouse(this.scene);this.forklift=buildForklift(this.scene);this.camera.position.set(0,7,13);
    this.bindKeys();this.resize();window.addEventListener('resize',this.resize);
    this.renderer.setAnimationLoop(this.animate);
  }
  private bindKeys=()=>{window.addEventListener('keydown',this.onKeyDown);window.addEventListener('keyup',this.onKeyUp);};
  private onKeyDown=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();this.keys.add(k);if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='c')this.cycleCamera();if(k==='e')this.interact();if(k==='escape')useSimStore.getState().setStatus('Pausa: presiona ESC para continuar.');};
  private onKeyUp=(e:KeyboardEvent)=>{this.keys.delete(e.key.toLowerCase());};
  setControl=(name:keyof Controls,value:boolean)=>{this.controls[name]=value;};
  private cycleCamera=()=>{const c=useSimStore.getState().camera;useSimStore.getState().setCamera(c==='chase'?'cab':c==='cab'?'overview':'chase');};
  private interact=()=>{
    if(this.carried){
      const p=this.carried;const drop=new THREE.Vector3();this.forklift.root.getWorldPosition(drop);drop.add(new THREE.Vector3(0,0,2.8).applyAxisAngle(new THREE.Vector3(0,1,0),this.heading));
      if(drop.x < -39||drop.x>39||drop.z < -28||drop.z>28){useSimStore.getState().setStatus('No se puede depositar fuera del área operativa.');return;}
      p.group.position.set(drop.x,0,drop.z);this.carried=null;useSimStore.getState().setCarrying(false);useSimStore.getState().setStatus(`${p.id} depositado. Operación de prueba completada.`);return;
    }
    const forkPos=this.forkWorldPosition();let nearest:PalletObject|null=null,dist=2.6;
    for(const p of this.pallets){const d=p.group.position.distanceTo(forkPos);if(d<dist){dist=d;nearest=p;}}
    if(nearest){this.carried=nearest;useSimStore.getState().setCarrying(true);useSimStore.getState().setStatus(`${nearest.id} recogido. Transpórtalo y presiona E para depositar.`);}else useSimStore.getState().setStatus('Acércate a un pallet con las horquillas bajas y presiona E.');
  };
  private forkWorldPosition=()=>{const p=this.forklift.root.position.clone();p.add(new THREE.Vector3(0,0,2.35).applyAxisAngle(new THREE.Vector3(0,1,0),this.heading));return p;};
  private updateMovement(dt:number){
    const c=this.controls,k=this.keys;const forward=c.forward||k.has('w')||k.has('arrowup');const reverse=c.reverse||k.has('s')||k.has('arrowdown');const left=c.left||k.has('a')||k.has('arrowleft');const right=c.right||k.has('d')||k.has('arrowright');const brake=c.brake||k.has(' ');
    const accel=forward?7:reverse?-5:0;this.speed+=accel*dt;this.speed*=brake?Math.pow(.04,dt):Math.pow(.34,dt);this.speed=clamp(this.speed,-4.2,7.2);
    if(Math.abs(this.speed)>.08){const steer=(right?1:0)-(left?1:0);this.heading+=steer*dt*1.05*Math.sign(this.speed)*Math.min(1,Math.abs(this.speed)/2.2);}
    const dir=new THREE.Vector3(Math.sin(this.heading),0,Math.cos(this.heading));const next=this.forklift.root.position.clone().addScaledVector(dir,this.speed*dt);
    // Conservative warehouse boundary and rack/column clearance for the Phase 1 prototype.
    const blocked=next.x < -39 || next.x>39 || next.z < -28 || next.z>28 || this.pallets.some(p=>!this.carried||p!==this.carried ? new THREE.Vector2(next.x-p.group.position.x,next.z-p.group.position.z).length()<1.35 : false);
    if(!blocked){this.forklift.root.position.copy(next);this.distance+=Math.abs(this.speed*dt);}else this.speed=0;
    this.forklift.root.rotation.y=this.heading;
    this.forklift.wheels.forEach(w=>w.rotation.x+=this.speed*dt*1.8);
    const raise=c.raise||k.has('r'),lower=c.lower||k.has('f');this.forkHeight=clamp(this.forkHeight+(raise?1:0)*dt*1.3-(lower?1:0)*dt*1.3,0,2.8);this.forklift.carriage.position.y=.42+this.forkHeight;
    const back=c.tiltBack||k.has('q'),front=c.tiltForward||k.has('z');this.tilt=clamp(this.tilt+(back?1:0)*dt*.35-(front?1:0)*dt*.35,-.22,.22);this.forklift.mast.rotation.x=this.tilt;
    if(this.carried){const pos=this.forkWorldPosition();this.carried.group.position.set(pos.x,this.forkHeight+.08,pos.z);this.carried.group.rotation.y=this.heading;}
    this.elapsed+=dt;
  }
  private updateCamera(dt:number){
    const mode=useSimStore.getState().camera;const root=this.forklift.root;let target:THREE.Vector3,look:THREE.Vector3;
    if(mode==='cab'){target=root.position.clone().add(new THREE.Vector3(0,2.65,-.35).applyAxisAngle(new THREE.Vector3(0,1,0),this.heading));look=target.clone().add(new THREE.Vector3(Math.sin(this.heading),-.2,Math.cos(this.heading)).multiplyScalar(12));}
    else if(mode==='overview'){target=new THREE.Vector3(0,48,44);look=new THREE.Vector3(0,0,0);}
    else {target=root.position.clone().add(new THREE.Vector3(0,6,-10).applyAxisAngle(new THREE.Vector3(0,1,0),this.heading));look=root.position.clone().add(new THREE.Vector3(0,1,3).applyAxisAngle(new THREE.Vector3(0,1,0),this.heading));}
    this.camera.position.lerp(target,1-Math.pow(.001,dt));this.camera.lookAt(look);
  }
  private animate=()=>{if(!this.running)return;const dt=Math.min(this.clock.getDelta(),.04);this.updateMovement(dt);this.updateCamera(dt);this.renderer.render(this.scene,this.camera);if(performance.now()-this.lastTelemetry>100){this.lastTelemetry=performance.now();useSimStore.getState().setTelemetry({speed:Math.abs(this.speed)*3.6,forkHeight:this.forkHeight,mastTilt:this.tilt,distance:this.distance,elapsed:this.elapsed});}};
  private resize=()=>{const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();};
  dispose(){this.running=false;this.renderer.setAnimationLoop(null);this.renderer.dispose();window.removeEventListener('resize',this.resize);window.removeEventListener('keydown',this.onKeyDown);window.removeEventListener('keyup',this.onKeyUp);}
}
