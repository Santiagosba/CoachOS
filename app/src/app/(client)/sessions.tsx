import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Alert,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

interface Session {
  id: string
  date: string
  duration: number
  type: 'PRESENCIAL' | 'ONLINE'
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  createdByRole?: 'TRAINER' | 'CLIENT'
  cancelledByRole?: 'TRAINER' | 'CLIENT' | null
  notes?: string | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   '#ca8a04',
  CONFIRMED: '#16a34a',
  CANCELLED: '#dc2626',
  COMPLETED: '#6366f1',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
}
const WEEKDAY_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const MONTH_LABELS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fromDateKey(k: string) {
  const [y,m,d] = k.split('-').map(Number); return new Date(y,m-1,d)
}
function buildCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay()+6)%7
  const start  = new Date(month.getFullYear(), month.getMonth(), 1-offset)
  return Array.from({length:42},(_,i)=>{ const d=new Date(start); d.setDate(start.getDate()+i); return d })
}
function formatDateInput(v: string) {
  const d=v.replace(/\D/g,'').slice(0,8)
  if(d.length<=4) return d
  if(d.length<=6) return `${d.slice(0,4)}-${d.slice(4)}`
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6)}`
}
function formatTimeInput(v: string) {
  const d=v.replace(/\D/g,'').slice(0,4)
  if(d.length<=2) return d
  return `${d.slice(0,2)}:${d.slice(2)}`
}

export default function ClientCalendarScreen() {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedKey,  setSelectedKey]  = useState(toDateKey(today))
  const [sessions,     setSessions]     = useState<Session[]>([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [showForm,     setShowForm]     = useState(false)

  const [fDate,     setFDate]     = useState('')
  const [fTime,     setFTime]     = useState('')
  const [fDuration, setFDuration] = useState('60')
  const [fType,     setFType]     = useState<'PRESENCIAL'|'ONLINE'>('PRESENCIAL')
  const [fNotes,    setFNotes]    = useState('')
  const [fSaving,   setFSaving]   = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/client/sessions')
      setSessions(data)
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  // Auto-refresh cada 30 s para detectar cancelaciones del entrenador
  useEffect(() => {
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    const mk=`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`
    const tk=`${today.getFullYear()}-${today.getMonth()}`
    setSelectedKey(mk===tk ? toDateKey(today) : toDateKey(visibleMonth))
  }, [visibleMonth])

  // ── Helper cross-platform (web: window.alert/confirm, nativo: Alert.alert) ──
  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') { window.alert(`${title}\n\n${message}`) }
    else { Alert.alert(title, message) }
  }

  async function handleBook() {
    if (!fDate||!fTime){ showAlert('Faltan datos','Introduce fecha y hora'); return }
    const iso = new Date(`${fDate}T${fTime}:00`).toISOString()
    if (isNaN(new Date(iso).getTime())){ showAlert('Formato inválido','Usa YYYY-MM-DD y HH:MM'); return }
    setFSaving(true)
    try {
      await api.post('/client/sessions',{ date:iso, duration:parseInt(fDuration,10)||60, type:fType, notes:fNotes.trim()||undefined })
      setFDate(''); setFTime(''); setFDuration('60'); setFType('PRESENCIAL'); setFNotes('')
      setShowForm(false); await load()
      showAlert('Solicitud enviada','Tu entrenador la confirmará pronto')
    } catch(e:any){ showAlert('Error', e?.response?.data?.error??'No se pudo reservar')
    } finally { setFSaving(false) }
  }

  // ── Cancelar / Confirmar — async fuera de Alert + cross-platform ──
  async function doCancelSession(id: string) {
    try { await api.patch(`/client/sessions/${id}/status`, { status: 'CANCELLED' }); await load() }
    catch(e:any){ showAlert('Error', e?.response?.data?.error ?? 'No se pudo cancelar') }
  }
  function handleCancel(id: string) {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que quieres cancelar esta sesión?')) doCancelSession(id)
      return
    }
    Alert.alert('Cancelar sesión', '¿Seguro que quieres cancelar esta sesión?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => doCancelSession(id) },
    ])
  }

  async function doConfirmSession(id: string) {
    try { await api.patch(`/client/sessions/${id}/status`, { status: 'CONFIRMED' }); await load() }
    catch(e:any){ showAlert('Error', e?.response?.data?.error ?? 'No se pudo confirmar') }
  }
  function handleConfirm(id: string) {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Confirmar esta sesión asignada por tu entrenador?')) doConfirmSession(id)
      return
    }
    Alert.alert('Confirmar sesión', '¿Confirmar esta sesión asignada por tu entrenador?', [
      { text: 'No', style: 'cancel' },
      { text: 'Confirmar', onPress: () => doConfirmSession(id) },
    ])
  }

  // Sesiones canceladas por el entrenador en los últimos 14 días o en el futuro
  const cancelledByTrainer = sessions.filter(s =>
    s.status === 'CANCELLED' &&
    s.cancelledByRole === 'TRAINER' &&
    new Date(s.date).getTime() >= Date.now() - 14 * 24 * 60 * 60 * 1000
  )

  const byDay = sessions.reduce<Record<string,Session[]>>((acc,s)=>{
    const k=toDateKey(new Date(s.date)); acc[k]=[...(acc[k]??[]),s]; return acc
  },{})

  const selectedSessions = (byDay[selectedKey]??[]).slice().sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
  const upcoming          = sessions.filter(s=>new Date(s.date).getTime()>=Date.now()&&s.status!=='CANCELLED'&&s.status!=='COMPLETED')
  const pendingTrainer    = upcoming.filter(s=>s.status==='PENDING'&&s.createdByRole==='TRAINER')
  const calDays           = buildCalendarDays(visibleMonth)
  const selectedDate      = fromDateKey(selectedKey)

  if (loading) return <LiquidGlassBackground><ActivityIndicator style={{flex:1}} color="#6366f1" size="large"/></LiquidGlassBackground>

  return (
    <LiquidGlassBackground>
      <ScrollView
        style={{flex:1}}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load()}} tintColor="#113b7a"/>}
      >
        <Text style={styles.eyebrow}>Mi Calendario</Text>
        <Text style={styles.title}>Sesiones</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Próximas</Text>
          </View>
          <View style={[styles.statCard, pendingTrainer.length>0&&styles.statCardWarn]}>
            <Text style={[styles.statValue, pendingTrainer.length>0&&{color:'#ca8a04'}]}>{pendingTrainer.length}</Text>
            <Text style={[styles.statLabel, pendingTrainer.length>0&&{color:'#92400e'}]}>Por confirmar</Text>
          </View>
          <TouchableOpacity style={[styles.statCard,styles.statCardBook]} onPress={()=>setShowForm(true)}>
            <Ionicons name="add-circle" size={22} color="#0f4c81"/>
            <Text style={[styles.statLabel,{color:'#0f4c81',fontWeight:'800'}]}>Reservar</Text>
          </TouchableOpacity>
        </View>

        {pendingTrainer.length>0&&(
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={16} color="#92400e"/>
            <Text style={styles.alertText}>
              Tienes {pendingTrainer.length} sesión{pendingTrainer.length>1?'es':''} asignada{pendingTrainer.length>1?'s':''} por tu entrenador pendiente{pendingTrainer.length>1?'s':''} de confirmación
            </Text>
          </View>
        )}

        {cancelledByTrainer.length>0&&(
          <View style={styles.cancelledTrainerBanner}>
            <Ionicons name="warning" size={16} color="#b91c1c"/>
            <Text style={styles.cancelledTrainerBannerText}>
              Tu entrenador canceló {cancelledByTrainer.length} sesión{cancelledByTrainer.length>1?'es':''} recientemente — revisa el calendario
            </Text>
          </View>
        )}

        {/* Calendar grid */}
        <View style={[glass.card,styles.calCard]}>
          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.navBtn} onPress={()=>setVisibleMonth(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1))}>
              <Ionicons name="chevron-back" size={18} color="#113b7a"/>
            </TouchableOpacity>
            <View style={{alignItems:'center',gap:6}}>
              <Text style={styles.monthLabel}>{MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text>
              <TouchableOpacity style={styles.todayBtn} onPress={()=>setVisibleMonth(new Date(today.getFullYear(),today.getMonth(),1))}>
                <Text style={styles.todayBtnText}>Hoy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.navBtn} onPress={()=>setVisibleMonth(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1))}>
              <Ionicons name="chevron-forward" size={18} color="#113b7a"/>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map(l=><Text key={l} style={styles.weekLabel}>{l}</Text>)}
          </View>

          <View style={styles.grid}>
            {calDays.map(day=>{
              const key     = toDateKey(day)
              const daySess = byDay[key]??[]
              const inMonth = day.getMonth()===visibleMonth.getMonth()
              const isSel   = key===selectedKey
              const isToday = key===toDateKey(today)
              const statuses= [...new Set(daySess.map(s=>s.status))]
              return (
                <TouchableOpacity key={key} style={[styles.dayCell,isSel&&styles.dayCellSel,!inMonth&&{opacity:0.3}]} onPress={()=>setSelectedKey(key)}>
                  <Text style={[styles.dayNum,isSel&&styles.dayNumSel]}>{day.getDate()}</Text>
                  {isToday&&<View style={styles.todayDotEl}/>}
                  {daySess.length>0&&(
                    <View style={styles.dotsRow}>
                      {statuses.slice(0,3).map(st=>(
                        <View key={st} style={[styles.dot,{backgroundColor:STATUS_COLORS[st]??'#888'}]}/>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Selected day detail */}
        <View style={[glass.card,styles.dayPanel]}>
          <Text style={styles.dayPanelEyebrow}>Día seleccionado</Text>
          <Text style={styles.dayPanelTitle}>
            {selectedDate.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </Text>

          {selectedSessions.length===0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={32} color="#aac0d8"/>
              <Text style={styles.emptyDayText}>Sin sesiones este día</Text>
              <TouchableOpacity style={styles.bookHereBtn} onPress={()=>{setFDate(selectedKey);setShowForm(true)}}>
                <Text style={styles.bookHereBtnText}>+ Reservar aquí</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedSessions.map(s=>{
              const d=new Date(s.date)
              const isFuture=d.getTime()>Date.now()
              const canCancel =isFuture&&s.status!=='CANCELLED'&&s.status!=='COMPLETED'
              const canConfirm=isFuture&&s.status==='PENDING'&&s.createdByRole==='TRAINER'
              return (
                <View key={s.id} style={[glass.softCard,styles.sessCard]}>
                  <View style={styles.sessTop}>
                    <View style={{flex:1}}>
                      <Text style={styles.sessTime}>
                        {d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}{'  ·  '}{s.duration} min{'  ·  '}{s.type==='PRESENCIAL'?'Presencial':'Online'}
                      </Text>
                      <Text style={styles.sessOrigin}>
                        {s.status==='CANCELLED'
                          ? s.cancelledByRole==='TRAINER' ? '❌ Cancelada por tu entrenador' : '❌ Cancelada por ti'
                          : s.createdByRole==='TRAINER'   ? '📋 Asignada por tu entrenador'   : '✉️ Solicitada por ti'}
                      </Text>
                      {s.notes&&<Text style={styles.sessNotes}>{s.notes}</Text>}
                    </View>
                    <View style={[styles.statusPill,{backgroundColor:STATUS_COLORS[s.status]+'22'}]}>
                      <View style={[styles.statusDot,{backgroundColor:STATUS_COLORS[s.status]}]}/>
                      <Text style={[styles.statusText,{color:STATUS_COLORS[s.status]}]}>{STATUS_LABELS[s.status]}</Text>
                    </View>
                  </View>
                  {(canConfirm||canCancel)&&(
                    <View style={styles.sessActions}>
                      {canConfirm&&<TouchableOpacity style={styles.confirmBtn} onPress={()=>handleConfirm(s.id)}><Ionicons name="checkmark-circle" size={14} color="#fff"/><Text style={styles.actionText}>Confirmar</Text></TouchableOpacity>}
                      {canCancel &&<TouchableOpacity style={styles.cancelBtn}  onPress={()=>handleCancel(s.id)} ><Ionicons name="close-circle"     size={14} color="#fff"/><Text style={styles.actionText}>Cancelar</Text></TouchableOpacity>}
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>

        {/* Upcoming list */}
        {upcoming.length>0&&(
          <>
            <Text style={styles.sectionTitle}>Próximas sesiones</Text>
            {upcoming.slice().sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map(s=>{
              const d=new Date(s.date)
              const isFuture=d.getTime()>Date.now()
              const canCancel =isFuture&&s.status!=='CANCELLED'&&s.status!=='COMPLETED'
              const canConfirm=isFuture&&s.status==='PENDING'&&s.createdByRole==='TRAINER'
              return (
                <View key={s.id} style={[glass.card,styles.upCard]}>
                  <View style={styles.upLeft}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateDay}>{d.getDate()}</Text>
                      <Text style={styles.dateMonth}>{d.toLocaleDateString('es-ES',{month:'short'}).toUpperCase()}</Text>
                    </View>
                    <View style={{flex:1}}>
                      <Text style={styles.upWeekday}>{d.toLocaleDateString('es-ES',{weekday:'long'})}</Text>
                      <Text style={styles.upMeta}>{d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} · {s.duration} min · {s.type==='PRESENCIAL'?'Presencial':'Online'}</Text>
                      <Text style={styles.upOrigin}>{s.createdByRole==='TRAINER'?'Asignada por entrenador':'Solicitada por ti'}</Text>
                    </View>
                  </View>
                  <View style={styles.upRight}>
                    <View style={[styles.statusPill,{backgroundColor:STATUS_COLORS[s.status]+'22'}]}>
                      <View style={[styles.statusDot,{backgroundColor:STATUS_COLORS[s.status]}]}/>
                      <Text style={[styles.statusText,{color:STATUS_COLORS[s.status]}]}>{STATUS_LABELS[s.status]}</Text>
                    </View>
                    {(canConfirm||canCancel)&&(
                      <View style={{flexDirection:'row',gap:6,marginTop:8,flexWrap:'wrap'}}>
                        {canConfirm&&<TouchableOpacity style={styles.confirmBtn} onPress={()=>handleConfirm(s.id)}><Ionicons name="checkmark-circle" size={13} color="#fff"/><Text style={styles.actionText}>Confirmar</Text></TouchableOpacity>}
                        {canCancel &&<TouchableOpacity style={styles.cancelBtn}  onPress={()=>handleCancel(s.id)} ><Ionicons name="close-circle"     size={13} color="#fff"/><Text style={styles.actionText}>Cancelar</Text></TouchableOpacity>}
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </>
        )}
        {/* Canceladas por el entrenador */}
        {cancelledByTrainer.length>0&&(
          <>
            <Text style={styles.sectionTitle}>Canceladas por tu entrenador</Text>
            {cancelledByTrainer
              .slice()
              .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())
              .map(s=>{
                const d=new Date(s.date)
                return (
                  <View key={s.id} style={[glass.card,styles.cancelledCard]}>
                    <View style={styles.cancelledIconWrap}>
                      <Ionicons name="close-circle" size={22} color="#b91c1c"/>
                    </View>
                    <View style={{flex:1}}>
                      <Text style={styles.cancelledDateText}>
                        {d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
                      </Text>
                      <Text style={styles.cancelledMetaText}>
                        {d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} · {s.duration} min · {s.type==='PRESENCIAL'?'Presencial':'Online'}
                      </Text>
                    </View>
                    <View style={styles.cancelledBadge}>
                      <Text style={styles.cancelledBadgeText}>Cancelada</Text>
                    </View>
                  </View>
                )
              })
            }
          </>
        )}

        <View style={{height:120}}/>
      </ScrollView>

      {/* Booking modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}/>
            <Text style={styles.modalTitle}>Solicitar sesión</Text>
            <Text style={styles.modalSub}>Tu entrenador recibirá la solicitud y la confirmará</Text>

            <View style={styles.formRow}>
              <View style={{flex:1}}>
                <Text style={styles.formLabel}>Fecha</Text>
                <TextInput style={styles.formInput} value={fDate} onChangeText={v=>setFDate(formatDateInput(v))} placeholder="2026-04-20" placeholderTextColor="#a0b0c0" keyboardType="numeric"/>
              </View>
              <View style={{flex:1}}>
                <Text style={styles.formLabel}>Hora</Text>
                <TextInput style={styles.formInput} value={fTime} onChangeText={v=>setFTime(formatTimeInput(v))} placeholder="18:30" placeholderTextColor="#a0b0c0" keyboardType="numeric"/>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={{flex:1}}>
                <Text style={styles.formLabel}>Duración (min)</Text>
                <TextInput style={styles.formInput} value={fDuration} onChangeText={setFDuration} keyboardType="number-pad" placeholder="60" placeholderTextColor="#a0b0c0"/>
              </View>
              <View style={{flex:1}}>
                <Text style={styles.formLabel}>Tipo</Text>
                <View style={{flexDirection:'row',gap:8}}>
                  {(['PRESENCIAL','ONLINE'] as const).map(t=>(
                    <TouchableOpacity key={t} style={[styles.typeChip,fType===t&&styles.typeChipActive]} onPress={()=>setFType(t)}>
                      <Text style={[styles.typeChipText,fType===t&&{color:'#234675'}]}>{t==='PRESENCIAL'?'Presencial':'Online'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.formLabel}>Notas (opcional)</Text>
            <TextInput style={[styles.formInput,{height:72,textAlignVertical:'top',marginBottom:16}]} value={fNotes} onChangeText={setFNotes} placeholder="Ej. prefiero tarde o videollamada" placeholderTextColor="#a0b0c0" multiline/>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={()=>setShowForm(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBookBtn,fSaving&&{opacity:0.7}]} onPress={handleBook} disabled={fSaving}>
                {fSaving?<ActivityIndicator color="#fff" size="small"/>:<Text style={styles.modalBookText}>Enviar solicitud</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  scroll:     { padding:20, paddingTop:60, paddingBottom:40 },
  eyebrow:    { fontSize:11, fontWeight:'700', color:'#5d6f85', letterSpacing:1.4, textTransform:'uppercase', marginBottom:4 },
  title:      { fontSize:30, fontWeight:'900', color:'#10213a', marginBottom:20 },
  statsRow:   { flexDirection:'row', gap:10, marginBottom:14 },
  statCard:   { flex:1, backgroundColor:'rgba(244,248,255,0.7)', borderRadius:18, padding:14, alignItems:'center', gap:4, borderWidth:1, borderColor:'rgba(255,255,255,0.6)' },
  statCardWarn:{ backgroundColor:'rgba(254,243,199,0.8)', borderColor:'rgba(202,138,4,0.3)' },
  statCardBook:{ backgroundColor:'rgba(15,76,129,0.08)', borderColor:'rgba(15,76,129,0.2)' },
  statValue:  { fontSize:24, fontWeight:'900', color:'#10213a' },
  statLabel:  { fontSize:11, fontWeight:'700', color:'#5d6f85', textAlign:'center' },
  alertBanner:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(254,243,199,0.9)', borderRadius:14, padding:12, marginBottom:14, borderWidth:1, borderColor:'rgba(202,138,4,0.3)' },
  alertText:  { flex:1, fontSize:13, fontWeight:'600', color:'#92400e' },
  calCard:    { padding:16, marginBottom:14 },
  monthRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  navBtn:     { width:38, height:38, borderRadius:19, backgroundColor:'rgba(255,255,255,0.5)', alignItems:'center', justifyContent:'center' },
  monthLabel: { fontSize:18, fontWeight:'800', color:'#10213a' },
  todayBtn:   { backgroundColor:'#dce8ff', borderRadius:999, paddingHorizontal:12, paddingVertical:5 },
  todayBtnText:{ fontSize:12, fontWeight:'700', color:'#234675' },
  weekRow:    { flexDirection:'row', marginBottom:6 },
  weekLabel:  { flex:1, textAlign:'center', fontSize:11, fontWeight:'700', color:'#5d6f85' },
  grid:       { flexDirection:'row', flexWrap:'wrap', gap:6 },
  dayCell:    { width:'13.3%', minHeight:72, borderRadius:14, padding:6, backgroundColor:'rgba(255,255,255,0.4)', borderWidth:1, borderColor:'rgba(255,255,255,0.5)', alignItems:'center' },
  dayCellSel: { backgroundColor:'#113b7a', borderColor:'#113b7a' },
  dayNum:     { fontSize:14, fontWeight:'800', color:'#10213a' },
  dayNumSel:  { color:'#fff' },
  todayDotEl: { width:5, height:5, borderRadius:3, backgroundColor:'#38bdf8', marginTop:3 },
  dotsRow:    { flexDirection:'row', gap:3, marginTop:4, flexWrap:'wrap', justifyContent:'center' },
  dot:        { width:6, height:6, borderRadius:3 },
  dayPanel:   { padding:16, marginBottom:14 },
  dayPanelEyebrow:{ fontSize:11, fontWeight:'700', color:'#5d6f85', letterSpacing:1, textTransform:'uppercase', marginBottom:4 },
  dayPanelTitle:  { fontSize:16, fontWeight:'800', color:'#10213a', marginBottom:14, textTransform:'capitalize' },
  emptyDay:   { alignItems:'center', paddingVertical:24, gap:8 },
  emptyDayText:{ fontSize:14, color:'#aac0d8', fontWeight:'600' },
  bookHereBtn: { backgroundColor:'#0f4c8118', borderRadius:12, paddingHorizontal:16, paddingVertical:8 },
  bookHereBtnText:{ fontSize:13, fontWeight:'800', color:'#0f4c81' },
  sessCard:   { padding:12, marginBottom:8 },
  sessTop:    { flexDirection:'row', alignItems:'flex-start', gap:10 },
  sessTime:   { fontSize:14, fontWeight:'700', color:'#10213a' },
  sessOrigin: { fontSize:12, color:'#5d6f85', marginTop:3 },
  sessNotes:  { fontSize:12, color:'#7a9ab8', marginTop:4 },
  sessActions:{ flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap' },
  statusPill: { flexDirection:'row', alignItems:'center', gap:5, borderRadius:999, paddingHorizontal:9, paddingVertical:5 },
  statusDot:  { width:7, height:7, borderRadius:4 },
  statusText: { fontSize:11, fontWeight:'800' },
  confirmBtn: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#166534', borderRadius:10, paddingHorizontal:11, paddingVertical:8 },
  cancelBtn:  { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#991b1b', borderRadius:10, paddingHorizontal:11, paddingVertical:8 },
  actionText: { color:'#fff', fontSize:12, fontWeight:'700' },
  sectionTitle:{ fontSize:13, fontWeight:'800', color:'#5d6f85', letterSpacing:1, textTransform:'uppercase', marginBottom:10, marginTop:4 },
  upCard:     { padding:14, marginBottom:10 },
  upLeft:     { flexDirection:'row', gap:12, flex:1 },
  upRight:    { alignItems:'flex-end' },
  dateBadge:  { width:44, alignItems:'center' },
  dateDay:    { fontSize:22, fontWeight:'900', color:'#10213a' },
  dateMonth:  { fontSize:10, color:'#5d6f85', fontWeight:'700' },
  upWeekday:  { fontSize:14, fontWeight:'700', color:'#10213a', textTransform:'capitalize' },
  upMeta:     { fontSize:12, color:'#5d6f85', marginTop:2 },
  upOrigin:   { fontSize:11, color:'#0f4c81', fontWeight:'700', marginTop:3 },
  modalOverlay:{ flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor:'#f4f8ff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:40 },
  modalHandle:{ width:40, height:4, borderRadius:2, backgroundColor:'#c8d8e8', alignSelf:'center', marginBottom:20 },
  modalTitle: { fontSize:22, fontWeight:'900', color:'#10213a', marginBottom:4 },
  modalSub:   { fontSize:13, color:'#5d6f85', marginBottom:20 },
  formRow:    { flexDirection:'row', gap:12, marginBottom:12 },
  formLabel:  { fontSize:12, fontWeight:'700', color:'#5d6f85', marginBottom:6 },
  formInput:  { backgroundColor:'rgba(255,255,255,0.8)', borderRadius:14, borderWidth:1, borderColor:'rgba(200,216,232,0.8)', paddingHorizontal:14, paddingVertical:12, fontSize:15, color:'#10213a' },
  typeChip:   { flex:1, paddingVertical:10, borderRadius:12, alignItems:'center', backgroundColor:'rgba(255,255,255,0.5)', borderWidth:1.5, borderColor:'#c8d8e8' },
  typeChipActive:{ backgroundColor:'#dce8ff', borderColor:'#97b8eb' },
  typeChipText:{ fontSize:12, fontWeight:'700', color:'#5d6f85' },
  modalBtns:  { flexDirection:'row', gap:12 },
  modalCancelBtn:{ flex:1, paddingVertical:14, borderRadius:14, backgroundColor:'rgba(0,0,0,0.06)', alignItems:'center' },
  modalCancelText:{ fontWeight:'700', color:'#5d6f85' },
  modalBookBtn:{ flex:2, paddingVertical:14, borderRadius:14, backgroundColor:'#0f4c81', alignItems:'center' },
  modalBookText:{ fontWeight:'800', color:'#fff', fontSize:15 },
  // Banner cancelación por entrenador
  cancelledTrainerBanner:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(254,226,226,0.92)', borderRadius:14, padding:12, marginBottom:14, borderWidth:1, borderColor:'rgba(220,38,38,0.3)' },
  cancelledTrainerBannerText:{ flex:1, fontSize:13, fontWeight:'600', color:'#b91c1c' },
  // Sección canceladas por entrenador
  cancelledCard:{ flexDirection:'row', alignItems:'center', gap:12, padding:14, marginBottom:10 },
  cancelledIconWrap:{ width:40, height:40, borderRadius:20, backgroundColor:'rgba(254,226,226,0.8)', alignItems:'center', justifyContent:'center' },
  cancelledDateText:{ fontSize:14, fontWeight:'700', color:'#10213a', textTransform:'capitalize' },
  cancelledMetaText:{ fontSize:12, color:'#5d6f85', marginTop:2 },
  cancelledBadge:{ backgroundColor:'rgba(254,226,226,0.8)', borderRadius:10, paddingHorizontal:10, paddingVertical:5 },
  cancelledBadgeText:{ fontSize:11, fontWeight:'800', color:'#b91c1c' },
})
