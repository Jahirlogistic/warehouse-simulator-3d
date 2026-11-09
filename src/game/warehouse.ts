import * as THREE from 'three';

const mat = (color: string, roughness = 0.82) => new THREE.MeshStandardMaterial({ color, roughness });
function box(parent: THREE.Group, w:number,h:number,d:number, material:THREE.Material, x:number,y:number,z:number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export type PalletObject = { group: THREE.Group; home: THREE.Vector3; id: string };
export function buildWarehouse(scene: THREE.Scene) {
  const floorMat = mat('#aeb8c2'), wallMat = mat('#d9e0e6'), rackBlue = mat('#245b83'), rackOrange = mat('#ef8b32'), palletWood = mat('#a87543'), carton = mat('#c99b61');
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(84, 62), floorMat); floor.rotation.x = -Math.PI/2; floor.position.y = -0.06; floor.receiveShadow = true; scene.add(floor);
  // Main shell and structural columns
  box(scene as unknown as THREE.Group, 84,.35,.5,wallMat,0,7,-31);
  box(scene as unknown as THREE.Group, 84,.35,.5,wallMat,0,7,31);
  box(scene as unknown as THREE.Group, .5,7,62,wallMat,-42,3.5,0);
  box(scene as unknown as THREE.Group, .5,7,62,wallMat,42,3.5,0);
  const columnMat = mat('#7e8b96');
  for (const x of [-34,-18,0,18,34]) for (const z of [-24,0,24]) box(scene as unknown as THREE.Group,.55,7,.55,columnMat,x,3.5,z);
  // Receiving / dispatch dock doors
  const dockMat = mat('#34495e');
  for (let i=0;i<4;i++) {
    const x=-27+i*18;
    box(scene as unknown as THREE.Group,8,4,.18,dockMat,x,2.2,-30.65);
    box(scene as unknown as THREE.Group,8,4,.18,dockMat,x,2.2,30.65);
    const stripe=box(scene as unknown as THREE.Group,7.5,.12,.22,rackOrange,x,.25,-30.45); stripe.rotation.z=0;
  }
  // Racking rows, 3 bays each side of a broad central aisle
  const rackRows = [-20,-11,11,20];
  for (const z of rackRows) {
    for (let bay=0;bay<7;bay++) {
      const x=-30+bay*10;
      for (const dx of [0,9.2]) box(scene as unknown as THREE.Group,.22,5.7,.22,rackBlue,x+dx,2.85,z);
      for (const level of [1.15,2.95,4.75]) {
        box(scene as unknown as THREE.Group,9.4,.16,.65,rackOrange,x+4.6,level,z);
        box(scene as unknown as THREE.Group,9.4,.12,.65,rackBlue,x+4.6,level+.18,z);
      }
    }
  }
  // Floor markings and zone labels as simple colored pads
  const zone = (x:number,z:number,w:number,d:number,color:string) => {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.22,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,.005,z);scene.add(m);
  };
  zone(-29,-26,20,7,'#22c55e'); zone(29,-26,20,7,'#f59e0b'); zone(-29,25,20,7,'#0ea5e9'); zone(29,25,20,7,'#a855f7');
  // Painted lane lines
  const lineMat = new THREE.MeshBasicMaterial({color:'#f5c542'});
  for(let z=-28;z<=28;z+=4){const line=new THREE.Mesh(new THREE.BoxGeometry(.08,.018,1.6),lineMat);line.position.set(0,.012,z);scene.add(line);}
  // Pallets in staging and on lower rack levels
  const pallets:PalletObject[]=[];
  for(let i=0;i<8;i++) {
    const g=new THREE.Group(); const x=-29+(i%4)*5.2, z= -23+Math.floor(i/4)*4.2;
    box(g,1.45,.13,1.15,palletWood,0,.12,0);
    for(const px of [-.48,0,.48]) box(g,.18,.2,1.12,mat('#79502f'),px,-.02,0);
    box(g,1.12,1.05,.92,carton,0,.72,0);
    box(g,1.12,.035,.92,mat('#d8b27e'),0,1.26,0);
    g.position.set(x,0,z); scene.add(g); pallets.push({group:g,home:g.position.clone(),id:`PLT-${String(i+1).padStart(3,'0')}`});
  }
  // Zone signs
  const addSign=(text:string,x:number,z:number,color:string)=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d')!;
    c.fillStyle=color;c.fillRect(0,0,512,128);c.fillStyle='#fff';c.font='bold 48px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,64);
    const tex=new THREE.CanvasTexture(canvas);const sign=new THREE.Mesh(new THREE.PlaneGeometry(7,1.75),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.position.set(x,5.8,z);sign.rotation.y=z<0?0:Math.PI;scene.add(sign);
  };
  addSign('RECEPCIÓN',-29,-30,'#15803d'); addSign('DESPACHO',29,-30,'#b45309'); addSign('PICKING',-29,30,'#0369a1'); addSign('DEVOLUCIONES',29,30,'#7e22ce');
  return pallets;
}

export function buildForklift(scene: THREE.Scene) {
  const root=new THREE.Group(); root.position.set(-4,0,5); scene.add(root);
  const yellow=new THREE.MeshStandardMaterial({color:'#f4b323',roughness:.55});
  const dark=new THREE.MeshStandardMaterial({color:'#202a35',roughness:.8});
  const glass=new THREE.MeshStandardMaterial({color:'#8bc4d9',metalness:.2,roughness:.2,transparent:true,opacity:.72});
  const metal=new THREE.MeshStandardMaterial({color:'#8e9aa5',metalness:.7,roughness:.32});
  box(root,2.05,.72,3.15,yellow,0,1.0,0);
  box(root,1.75,.15,1.05,dark,0,1.44,-.82);
  // overhead guard frame
  for(const x of [-.78,.78]) {box(root,.12,2.05,.12,dark,x,2.35,-.7);box(root,.12,2.05,.12,dark,x,2.35,.72);}
  box(root,1.7,.12,1.6,dark,0,3.37,.02);
  box(root,1.25,1.0,1.0,glass,0,2.3,-.35);
  // seat
  box(root,.8,.18,.75,dark,0,1.78,.15);
  // mast at front (+z)
  const mast=new THREE.Group();mast.position.set(0,1.15,1.47);root.add(mast);
  box(mast,1.45,3.2,.16,metal,0,1.65,0);
  for(const x of [-.57,.57]) box(mast,.12,3.1,.22,dark,x,1.62,.12);
  const carriage=new THREE.Group();carriage.position.set(0,.42,.3);mast.add(carriage);
  box(carriage,1.35,.18,.18,metal,0,0,0);
  for(const x of [-.48,.48]) box(carriage,.14,.1,1.15,metal,x,-.1,.62);
  const wheels:THREE.Mesh[]=[];
  for(const x of [-1.05,1.05]) for(const z of [-.95,.95]) {
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.25,20),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.48,z);wheel.castShadow=true;root.add(wheel);wheels.push(wheel);
  }
  return {root,mast,carriage,wheels};
}
