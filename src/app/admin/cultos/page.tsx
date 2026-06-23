'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Save,
  Users, Plus, X, CalendarDays, Edit3, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import type { Miembro } from '@/types'

/* ---------- helpers ---------- */

interface SlotCulto {
  titulo: string; preside: string; lectura: string; predicacion: string
  limpieza: string; hora_inicio: string; hora_fin: string
}

type SemanaCultos = Record<string, SlotCulto[]>

interface Participante {
  slotIdx: number
  miembroId: string
  nombreCompleto: string
}

const DIAS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const DIAS_LABEL: Record<string,string> = {
  lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',
  jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo',
}
const DAY_KEYS: Record<number,string> = {
  0:'domingo',1:'lunes',2:'martes',3:'miercoles',4:'jueves',5:'viernes',6:'sabado',
}

function fmt(s:Date):string {
  const y=s.getFullYear(), m=String(s.getMonth()+1).padStart(2,'0'), d=String(s.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

function sameDay(a:Date,b:Date):boolean {
  return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()
}

function getMonday(d:Date):Date {
  const r=new Date(d)
  const day=r.getDay()
  r.setDate(r.getDate()-(day===0?6:day-1))
  r.setHours(0,0,0,0)
  return r
}

function weekId(d:Date):string{return fmt(getMonday(d))}

function getMonthWeeks(year:number,month:number):Date[][]{
  const weeks:Date[][]=[]
  const first=new Date(year,month,1)
  const last=new Date(year,month+1,0)
  const start=getMonday(first)
  const end=new Date(last)
  const ld=end.getDay()
  end.setDate(end.getDate()+(ld===0?0:7-ld))
  let cur=new Date(start)
  while(cur<=end){
    const w:Date[]=[]
    for(let i=0;i<7;i++){w.push(new Date(cur));cur.setDate(cur.getDate()+1)}
    weeks.push(w)
  }
  return weeks
}

function timeout(ms:number){return new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))}

/* ---------- component ---------- */

export default function AdminCultosPage(){
  const router=useRouter()
  const {user,puede}=useAuth()
  const hoy=new Date()
  const [mes,setMes]=useState(new Date(hoy.getFullYear(),hoy.getMonth()))
  const [semana,setSemana]=useState<SemanaCultos>({})
  const [participacion,setParticipacion]=useState<Record<string,Participante[]>>({})
  const [miembros,setMiembros]=useState<Miembro[]>([])
  const [selectedDate,setSelectedDate]=useState<string|null>(null)
  const [showConfirm,setShowConfirm]=useState(false)
  const [pendingDate,setPendingDate]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState('')
  const [showTemplate,setShowTemplate]=useState(false)
  const [participantesLocal,setParticipantesLocal]=useState<Participante[]>([])
  const [autoText,setAutoText]=useState('')
  const [autoSlot,setAutoSlot]=useState<number>(0)
  const [showAuto,setShowAuto]=useState(false)
  const autoRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(!puede('cultos','ver'))router.replace('/admin/dashboard')
    loadAll()
  },[])

  useEffect(()=>{document.addEventListener('mousedown',onClickOutside);return()=>document.removeEventListener('mousedown',onClickOutside)})

  function onClickOutside(e:MouseEvent){
    if(autoRef.current&&!autoRef.current.contains(e.target as Node))setShowAuto(false)
  }

  async function loadAll(){
    try{
      const [semSnap,miemSnap]=await Promise.all([
        Promise.race([getDoc(doc(db,'config','cultos-semana')),timeout(8000)]),
        Promise.race([getDocs(collection(db,'miembros')),timeout(8000)]),
      ])
      if(semSnap.exists())setSemana(semSnap.data() as SemanaCultos)
      else setSemana({
        lunes:[],
        martes:[{titulo:'Culto de Oración y Testimonio',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'19:00',hora_fin:'21:00'}],
        miercoles:[{titulo:'Culto de Damas',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'19:00',hora_fin:'21:00'}],
        jueves:[{titulo:'Estudio Bíblico',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'19:00',hora_fin:'21:00'}],
        viernes:[],
        sabado:[{titulo:'Culto de Servicio a Dios',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'19:00',hora_fin:'21:00'}],
        domingo:[
          {titulo:'Escuela Dominical',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'09:00',hora_fin:'11:00'},
          {titulo:'Culto Evangelístico y Milagros',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'17:00',hora_fin:'19:00'},
        ],
      })
      setMiembros(miemSnap.docs.map(d=>({id:d.id,...d.data()})as Miembro).sort((a,b)=>`${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)))
    }catch{setError('Error al cargar datos')}
  }

  async function loadParticipacion(fecha:string){
    try{
      const snap=await Promise.race([getDoc(doc(db,'participacion-cultos',fecha)),timeout(8000)])
      if(snap.exists())setParticipantesLocal(snap.data().participantes||[])
      else setParticipantesLocal([])
    }catch{setParticipantesLocal([])}
  }

  const weeks=getMonthWeeks(mes.getFullYear(),mes.getMonth())
  const currentWeekId=weekId(hoy)

  function getDayClass(d:Date):string{
    const inMonth=d.getMonth()===mes.getMonth()
    if(!inMonth)return 'text-gray-200'
    const today=sameDay(d,hoy)
    const cw=sameDay(getMonday(d),getMonday(hoy))
    const past=d<hoy&&!today
    if(today)return 'bg-yellow-200 font-bold ring-2 ring-yellow-500 z-10'
    if(cw)return 'bg-green-100'
    if(past)return 'bg-gray-100 text-gray-400'
    return 'bg-blue-50'
  }

  function getWeekState(w:Date[]):'past'|'current'|'future'{
    const wid=weekId(w[0])
    if(wid===currentWeekId)return'current'
    if(w[0]<getMonday(hoy))return'past'
    return'future'
  }

  function handleDayClick(d:Date){
    if(d.getMonth()!==mes.getMonth())return
    const f=fmt(d)
    setParticipantesLocal([])
    const wState=getWeekState(getMonthWeeks(mes.getFullYear(),mes.getMonth()).find(week=>week.some(day=>sameDay(day,d)))||[d])
    if(wState==='future'){
      setPendingDate(f)
      setShowConfirm(true)
    }else{
      setSelectedDate(f)
      loadParticipacion(f)
    }
  }

  function confirmFuture(){
    if(pendingDate){
      setSelectedDate(pendingDate)
      loadParticipacion(pendingDate)
    }
    setShowConfirm(false)
    setPendingDate(null)
  }

  function toggleParticipante(slotIdx:number,miembroId:string,nombreCompleto:string){
    setParticipantesLocal(prev=>{
      const idx=prev.findIndex(p=>p.slotIdx===slotIdx&&p.miembroId===miembroId)
      if(idx>=0)return prev.filter((_,i)=>i!==idx)
      return[...prev,{slotIdx,miembroId,nombreCompleto}]
    })
  }

  function addParticipante(slotIdx:number,miembroId:string,nombreCompleto:string){
    setParticipantesLocal(prev=>{
      if(prev.some(p=>p.slotIdx===slotIdx&&p.miembroId===miembroId))return prev
      return[...prev,{slotIdx,miembroId,nombreCompleto}]
    })
    setAutoText('')
    setShowAuto(false)
  }

  async function guardarParticipacion(){
    if(!selectedDate)return
    setSaving(true)
    setError('')
    try{
      await Promise.race([
        setDoc(doc(db,'participacion-cultos',selectedDate),{fecha:selectedDate,participantes:participantesLocal,updatedAt:serverTimestamp()}),
        timeout(8000),
      ])
      setSaved(true);setTimeout(()=>setSaved(false),2000)
    }catch{setError('Error al guardar participación')}
    setSaving(false)
  }

  const miembrosFiltrados=useMemo(()=>{
    if(!autoText.trim())return[]
    const q=autoText.toLowerCase()
    return miembros.filter(m=>`${m.nombre} ${m.apellido}`.toLowerCase().includes(q)).slice(0,8)
  },[autoText,miembros])

  /* ---- template editor ---- */
  const [tempForm,setTempForm]=useState<SemanaCultos>({})

  function openTemplate(){
    setTempForm(JSON.parse(JSON.stringify(semana)))
    setShowTemplate(true)
  }

  function updateTempSlot(dia:string,idx:number,field:keyof SlotCulto,val:string){
    setTempForm(prev=>{
      const slots=[...(prev[dia]||[])]
      if(!slots[idx])slots[idx]={titulo:'',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'',hora_fin:''}
      slots[idx]={...slots[idx],[field]:val}
      return{...prev,[dia]:slots}
    })
  }

  function addTempSlot(dia:string){
    setTempForm(prev=>({...prev,[dia]:[...(prev[dia]||[]),{titulo:'',preside:'',lectura:'',predicacion:'',limpieza:'',hora_inicio:'',hora_fin:''}]}))
  }

  function removeTempSlot(dia:string,idx:number){
    setTempForm(prev=>({...prev,[dia]:(prev[dia]||[]).filter((_,i)=>i!==idx)}))
  }

  async function guardarTemplate(){
    setSaving(true);setError('')
    try{
      await Promise.race([setDoc(doc(db,'config','cultos-semana'),{...tempForm,updatedAt:serverTimestamp()}),timeout(8000)])
      setSemana(JSON.parse(JSON.stringify(tempForm)))
      setShowTemplate(false)
      setSaved(true);setTimeout(()=>setSaved(false),2000)
    }catch{setError('Error al guardar plantilla')}
    setSaving(false)
  }

  const diaActual=selectedDate?new Date(selectedDate+'T00:00:00'):null
  const diaKey=diaActual?DAY_KEYS[diaActual.getDay()]:''
  const slotsHoy=diaKey?semana[diaKey]||[]:[]

  return(
    <div>
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={()=>router.back()}><ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary"/></button>
          <div>
            <h1 className="text-2xl font-bold text-dark">Cultos</h1>
            <p className="text-sm text-gray-500">Calendario mensual de participación</p>
          </div>
        </div>
        <div className="flex gap-2">
          {puede('cultos','editar')&&(
            <Button variant="outline" size="sm" onClick={openTemplate}>
              <Edit3 className="mr-1 h-4 w-4"/> Plantilla
            </Button>
          )}
        </div>
      </div>

      {error&&<p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      {/* month nav */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-200">
        <button onClick={()=>setMes(new Date(mes.getFullYear(),mes.getMonth()-1))} className="p-1 text-gray-500 hover:text-primary">
          <ChevronLeft className="h-5 w-5"/>
        </button>
        <span className="text-lg font-bold text-dark">
          {mes.toLocaleDateString('es-ES',{month:'long',year:'numeric'})}
        </span>
        <button onClick={()=>setMes(new Date(mes.getFullYear(),mes.getMonth()+1))} className="p-1 text-gray-500 hover:text-primary">
          <ChevronRight className="h-5 w-5"/>
        </button>
      </div>

      {/* calendar grid */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d=>
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{d}</div>
          )}
        </div>
        {weeks.map((week,wi)=>{
          const ws=getWeekState(week)
          return(
            <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((d,di)=>{
                const f=fmt(d)
                const inMonth=d.getMonth()===mes.getMonth()
                const partCount=(participacion[f]||[]).length
                const hoyBool=sameDay(d,hoy)
                return(
                  <button
                    key={di}
                    onClick={()=>handleDayClick(d)}
                    disabled={!inMonth}
                    className={`relative flex flex-col items-center justify-start px-1 py-2 min-h-[72px] text-sm transition-colors ${inMonth?'cursor-pointer hover:bg-gray-50':'cursor-default'} ${getDayClass(d)}`}
                  >
                    <span className={`text-sm leading-none ${hoyBool?'text-dark':''}`}>{d.getDate()}</span>
                    {partCount>0&&(
                      <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Users className="h-3 w-3"/>{partCount}
                      </span>
                    )}
                    {ws==='future'&&inMonth&&(
                      <span className="mt-0.5 text-[9px] text-blue-400 font-medium">Futura</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-100 border border-green-200"/> Semana actual (lun-vie)
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-yellow-200 border border-yellow-300"/> Hoy
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gray-100 border border-gray-200"/> Pasado
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-50 border border-blue-200"/> Futuro
        </div>
      </div>

      {/* confirm future */}
      {showConfirm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={()=>{setShowConfirm(false);setPendingDate(null)}}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl text-center" onClick={e=>e.stopPropagation()}>
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-yellow-500"/>
            <h3 className="mb-2 text-lg font-bold text-dark">Semana Futura</h3>
            <p className="mb-6 text-sm text-gray-500">
              Aún no estamos en esta semana. ¿Seguro que deseas agregar algún dato para esta semana seleccionada?
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={()=>{setShowConfirm(false);setPendingDate(null)}}>No, regresar</Button>
              <Button variant="primary" size="sm" onClick={confirmFuture}>Sí, continuar</Button>
            </div>
          </div>
        </div>
      )}

      {/* participation modal */}
      {selectedDate&&diaActual&&(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-10" onClick={()=>setSelectedDate(null)}>
          <div
            className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-2xl transition-all duration-300 scale-100 opacity-100"
            onClick={e=>e.stopPropagation()}
          >
            <button onClick={()=>setSelectedDate(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5"/>
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-dark">
                {diaActual.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </h2>
              <p className="text-sm text-gray-500">{DIAS_LABEL[diaKey]}</p>
            </div>

            {slotsHoy.length===0?(
              <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-400">
                No hay cultos programados para este día.
              </div>
            ):(
              <div className="space-y-6">
                {slotsHoy.map((slot,si)=>{
                  const partSlot=participantesLocal.filter(p=>p.slotIdx===si)
                  return(
                    <div key={si} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-dark">{slot.titulo||'Sin título'}</h3>
                          {slot.hora_inicio&&<span className="text-xs text-gray-400">{slot.hora_inicio} - {slot.hora_fin||'...'}</span>}
                        </div>
                        <span className="text-xs font-medium text-gray-400">{partSlot.length} participante{partSlot.length!==1?'s':''}</span>
                      </div>

                      {slot.preside&&<p className="mb-2 text-xs text-gray-500"><span className="font-medium">Preside:</span> {slot.preside}</p>}
                      {slot.predicacion&&<p className="mb-2 text-xs text-gray-500"><span className="font-medium">Predicación:</span> {slot.predicacion}</p>}
                      {slot.lectura&&<p className="mb-2 text-xs text-gray-500"><span className="font-medium">Lectura:</span> {slot.lectura}</p>}
                      {slot.limpieza&&<p className="mb-2 text-xs text-gray-500"><span className="font-medium">Limpieza:</span> {slot.limpieza}</p>}

                      <div className="mt-3 space-y-1">
                        {partSlot.map((p,pi)=>(
                          <div key={pi} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                            <span>{p.nombreCompleto}</span>
                            <button
                              onClick={()=>toggleParticipante(si,p.miembroId,p.nombreCompleto)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="h-3.5 w-3.5"/>
                            </button>
                          </div>
                        ))}
                      </div>

                      {user?.role!=='visual'&&(
                        <div className="relative mt-2">
                          <div className="flex gap-2">
                            <input
                              value={autoSlot===si?autoText:''}
                              onChange={e=>{setAutoSlot(si);setAutoText(e.target.value);setShowAuto(true)}}
                              onFocus={()=>{setAutoSlot(si);setShowAuto(true)}}
                              placeholder="Buscar miembro..."
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                            <Button variant="primary" size="sm" onClick={()=>{setAutoSlot(si);setShowAuto(!showAuto)}}>
                              <Plus className="h-4 w-4"/>
                            </Button>
                          </div>
                          {showAuto&&autoSlot===si&&miembrosFiltrados.length>0&&(
                            <div ref={autoRef} className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                              {miembrosFiltrados.map(m=>{
                                const yaAgregado=participantesLocal.some(p=>p.slotIdx===si&&p.miembroId===m.id)
                                return(
                                  <button
                                    key={m.id}
                                    onClick={()=>{
                                      if(!yaAgregado)addParticipante(si,m.id,`${m.nombre} ${m.apellido}`)
                                      else toggleParticipante(si,m.id,`${m.nombre} ${m.apellido}`)
                                    }}
                                    className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 ${
                                      yaAgregado?'opacity-50':''}`}
                                  >
                                    <span>{m.nombre} {m.apellido}</span>
                                    <span className="text-xs text-gray-400">{yaAgregado?'✓ agregado':''}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={()=>setSelectedDate(null)}>Cerrar</Button>
              {user?.role!=='visual'&&(
                <Button variant="primary" size="sm" onClick={guardarParticipacion} disabled={saving}>
                  <Save className="mr-1 h-4 w-4"/>
                  {saved?'✓ Guardado':saving?'Guardando...':'Guardar Participación'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* template editor modal */}
      {showTemplate&&(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-10" onClick={()=>setShowTemplate(false)}>
          <div className="relative w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowTemplate(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5"/>
            </button>
            <h2 className="mb-6 text-lg font-bold text-dark">Plantilla Semanal</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {DIAS.map(dia=>{
                const slots=tempForm[dia]||[]
                return(
                  <Card key={dia}>
                    <CardContent className="p-0">
                      <div className="rounded-t-xl bg-primary px-4 py-3 text-sm font-bold text-white">
                        <CalendarDays className="mr-2 inline h-4 w-4"/>{DIAS_LABEL[dia]}
                        <span className="ml-2 text-xs font-normal text-white/70">{slots.length} horario{slots.length!==1?'s':''}</span>
                      </div>
                      <div className="space-y-4 p-4">
                        {slots.map((slot,i)=>(
                          <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">Horario {i+1}</span>
                              {slots.length>1&&(
                                <button onClick={()=>removeTempSlot(dia,i)} className="text-red-400 hover:text-red-600">
                                  <X className="h-3.5 w-3.5"/>
                                </button>
                              )}
                            </div>
                            <Input label="Título" value={slot.titulo} onChange={e=>updateTempSlot(dia,i,'titulo',e.target.value)}/>
                            <Input label="Preside" value={slot.preside} onChange={e=>updateTempSlot(dia,i,'preside',e.target.value)}/>
                            <Input label="Lectura Bíblica" value={slot.lectura} onChange={e=>updateTempSlot(dia,i,'lectura',e.target.value)}/>
                            <Input label="Predicación" value={slot.predicacion} onChange={e=>updateTempSlot(dia,i,'predicacion',e.target.value)}/>
                            <Input label="Limpieza" value={slot.limpieza} onChange={e=>updateTempSlot(dia,i,'limpieza',e.target.value)}/>
                            <div className="grid grid-cols-2 gap-2">
                              <Input label="Inicio" type="time" value={slot.hora_inicio} onChange={e=>updateTempSlot(dia,i,'hora_inicio',e.target.value)}/>
                              <Input label="Fin" type="time" value={slot.hora_fin} onChange={e=>updateTempSlot(dia,i,'hora_fin',e.target.value)}/>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={()=>addTempSlot(dia)} className="w-full">
                          <Plus className="mr-1 h-3.5 w-3.5"/> Agregar horario
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={()=>setShowTemplate(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={guardarTemplate} disabled={saving}>
                <Save className="mr-1 h-4 w-4"/>{saving?'Guardando...':'Guardar Plantilla'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
