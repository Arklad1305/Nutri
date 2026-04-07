import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Activity, Send, Sparkles, Loader2, BarChart3, Flame, Droplets, Zap, Target, ChevronRight, Dna, Layers, Battery, Brain } from 'lucide-react'
import { submitHealthData } from '../lib/n8n'
import { BiohackerNutrients } from '../components/BiohackerNutrients'
import { BComplexVitamins } from '../components/BComplexVitamins'
import { StructuralMinerals } from '../components/StructuralMinerals'
import { EssentialAminoAcids } from '../components/EssentialAminoAcids'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface DailyData {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export function Analysis() {
  const { user } = useAuth()
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [averages, setAverages] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })

  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const toggleSection = (id: string) => setExpandedSection(prev => prev === id ? null : id)

  const [userMessage, setUserMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [biohackerNutrients, setBiohackerNutrients] = useState({
    choline_mg: 0, anthocyanins_mg: 0, copper_mg: 0, vitamin_e_iu: 0,
    vitamin_k1_mcg: 0, probiotics_cfu: 0, omega_3_mg: 0, omega_6_mg: 0,
  })
  const [bComplexVitamins, setBComplexVitamins] = useState({
    vitamin_b1_thiamin_mg: 0, vitamin_b2_riboflavin_mg: 0, vitamin_b3_niacin_mg: 0,
    vitamin_b5_pantothenic_mg: 0, vitamin_b6_mg: 0, vitamin_b7_biotin_mcg: 0,
    vitamin_b12_mcg: 0, folate_mcg: 0,
  })
  const [structuralMinerals, setStructuralMinerals] = useState({
    calcium_mg: 0, phosphorus_mg: 0, manganese_mg: 0, iodine_mcg: 0, chromium_mcg: 0,
  })
  const [essentialAminoAcids, setEssentialAminoAcids] = useState({
    leucine_mg: 0, isoleucine_mg: 0, valine_mg: 0, lysine_mg: 0,
    methionine_mg: 0, phenylalanine_mg: 0, threonine_mg: 0, histidine_mg: 0, tryptophan_mg: 0,
  })

  const pageRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion || !pageRef.current || loading) return
    const sections = pageRef.current.querySelectorAll('.analysis-section')
    if (!sections.length) return
    gsap.from(sections, {
      opacity: 0,
      y: 24,
      stagger: 0.1,
      duration: 0.55,
      ease: 'power3.out',
    })
  }, { scope: pageRef, dependencies: [loading, reducedMotion] })

  useEffect(() => {
    if (user) loadWeeklyData()
  }, [user])

  const loadWeeklyData = async () => {
    setLoading(true)
    const days = []
    let totalBiohacker = { choline_mg: 0, anthocyanins_mg: 0, copper_mg: 0, vitamin_e_iu: 0, vitamin_k1_mcg: 0, probiotics_cfu: 0, omega_3_mg: 0, omega_6_mg: 0 }
    let totalBComplex = { vitamin_b1_thiamin_mg: 0, vitamin_b2_riboflavin_mg: 0, vitamin_b3_niacin_mg: 0, vitamin_b5_pantothenic_mg: 0, vitamin_b6_mg: 0, vitamin_b7_biotin_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 0 }
    let totalStructuralMinerals = { calcium_mg: 0, phosphorus_mg: 0, manganese_mg: 0, iodine_mcg: 0, chromium_mcg: 0 }
    let totalAminoAcids = { leucine_mg: 0, isoleucine_mg: 0, valine_mg: 0, lysine_mg: 0, methionine_mg: 0, phenylalanine_mg: 0, threonine_mg: 0, histidine_mg: 0, tryptophan_mg: 0 }

    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('logged_at', startOfDay(day).toISOString())
        .lte('logged_at', endOfDay(day).toISOString())

      const totals = (data || []).reduce(
        (acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein_g: acc.protein_g + (log.protein_g || 0),
          carbs_g: acc.carbs_g + (log.carbs_g || 0),
          fat_g: acc.fat_g + (log.fat_g || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      )

      totalBiohacker = (data || []).reduce((acc, log) => {
        const matrix = log.nutritional_matrix || {}
        const inflammation = matrix.inflammation || {}
        const motor = matrix.motor || {}
        const hormonal = matrix.hormonal || {}
        return {
          choline_mg: acc.choline_mg + (log.choline_mg || 0),
          anthocyanins_mg: acc.anthocyanins_mg + (inflammation.bioactives?.anthocyanins_mg || 0),
          copper_mg: acc.copper_mg + (motor.structure_minerals?.copper_mg || 0),
          vitamin_e_iu: acc.vitamin_e_iu + (hormonal.liposolubles?.vit_e_iu || 0),
          vitamin_k1_mcg: acc.vitamin_k1_mcg + (hormonal.liposolubles?.vit_k1_mcg || 0),
          probiotics_cfu: acc.probiotics_cfu + (matrix.other?.probiotics_cfu || 0),
          omega_3_mg: acc.omega_3_mg + (inflammation.omega?.omega_3_total_mg || 0),
          omega_6_mg: acc.omega_6_mg + (inflammation.omega?.omega_6_mg || 0),
        }
      }, totalBiohacker)

      totalBComplex = (data || []).reduce((acc, log) => {
        const vitamins = (log.nutritional_matrix?.cognitive || {}).energy_vitamins || {}
        return {
          vitamin_b1_thiamin_mg: acc.vitamin_b1_thiamin_mg + (vitamins.vit_b1_thiamin_mg || 0),
          vitamin_b2_riboflavin_mg: acc.vitamin_b2_riboflavin_mg + (vitamins.vit_b2_riboflavin_mg || 0),
          vitamin_b3_niacin_mg: acc.vitamin_b3_niacin_mg + (vitamins.vit_b3_niacin_mg || 0),
          vitamin_b5_pantothenic_mg: acc.vitamin_b5_pantothenic_mg + (vitamins.vit_b5_pantothenic_mg || 0),
          vitamin_b6_mg: acc.vitamin_b6_mg + (vitamins.vit_b6_mg || 0),
          vitamin_b7_biotin_mcg: acc.vitamin_b7_biotin_mcg + (vitamins.vit_b7_biotin_mcg || 0),
          vitamin_b12_mcg: acc.vitamin_b12_mcg + (vitamins.vit_b12_mcg || 0),
          folate_mcg: acc.folate_mcg + (vitamins.folate_mcg || 0),
        }
      }, totalBComplex)

      totalStructuralMinerals = (data || []).reduce((acc, log) => {
        const matrix = log.nutritional_matrix || {}
        const structureMinerals = (matrix.motor || {}).structure_minerals || {}
        const traceMinerals = (matrix.cognitive || {}).trace_minerals || {}
        const thyroidMinerals = (matrix.hormonal || {}).thyroid_insulin || {}
        return {
          calcium_mg: acc.calcium_mg + (structureMinerals.calcium_mg || 0),
          phosphorus_mg: acc.phosphorus_mg + (structureMinerals.phosphorus_mg || 0),
          manganese_mg: acc.manganese_mg + (thyroidMinerals.manganese_mg || 0),
          iodine_mcg: acc.iodine_mcg + (thyroidMinerals.iodine_mcg || 0),
          chromium_mcg: acc.chromium_mcg + (traceMinerals.chromium_mcg || 0),
        }
      }, totalStructuralMinerals)

      totalAminoAcids = (data || []).reduce((acc, log) => {
        const aminosMuscle = (log.nutritional_matrix?.motor || {}).aminos_muscle || {}
        const aminosBrain = (log.nutritional_matrix?.cognitive || {}).aminos_brain || {}
        return {
          leucine_mg: acc.leucine_mg + (aminosMuscle.leucine_mg || 0),
          isoleucine_mg: acc.isoleucine_mg + (aminosMuscle.isoleucine_mg || 0),
          valine_mg: acc.valine_mg + (aminosMuscle.valine_mg || 0),
          lysine_mg: acc.lysine_mg + (aminosMuscle.lysine_mg || 0),
          methionine_mg: acc.methionine_mg + (aminosMuscle.methionine_mg || 0),
          phenylalanine_mg: acc.phenylalanine_mg + (aminosBrain.phenylalanine_mg || 0),
          threonine_mg: acc.threonine_mg + (aminosMuscle.threonine_mg || 0),
          histidine_mg: acc.histidine_mg + (aminosBrain.histidine_mg || 0),
          tryptophan_mg: acc.tryptophan_mg + (aminosBrain.tryptophan_mg || 0),
        }
      }, totalAminoAcids)

      days.push({ date: format(day, 'EEE', { locale: es }), ...totals })
    }

    setWeeklyData(days)

    const avg = days.reduce(
      (acc, day) => ({ calories: acc.calories + day.calories, protein_g: acc.protein_g + day.protein_g, carbs_g: acc.carbs_g + day.carbs_g, fat_g: acc.fat_g + day.fat_g }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    )
    setAverages({ calories: Math.round(avg.calories / 7), protein_g: Math.round(avg.protein_g / 7), carbs_g: Math.round(avg.carbs_g / 7), fat_g: Math.round(avg.fat_g / 7) })

    setBiohackerNutrients({
      choline_mg: Math.round(totalBiohacker.choline_mg / 7),
      anthocyanins_mg: Math.round(totalBiohacker.anthocyanins_mg / 7),
      copper_mg: parseFloat((totalBiohacker.copper_mg / 7).toFixed(2)),
      vitamin_e_iu: Math.round(totalBiohacker.vitamin_e_iu / 7),
      vitamin_k1_mcg: Math.round(totalBiohacker.vitamin_k1_mcg / 7),
      probiotics_cfu: Math.round(totalBiohacker.probiotics_cfu / 7),
      omega_3_mg: Math.round(totalBiohacker.omega_3_mg / 7),
      omega_6_mg: Math.round(totalBiohacker.omega_6_mg / 7),
    })
    setBComplexVitamins({
      vitamin_b1_thiamin_mg: parseFloat((totalBComplex.vitamin_b1_thiamin_mg / 7).toFixed(2)),
      vitamin_b2_riboflavin_mg: parseFloat((totalBComplex.vitamin_b2_riboflavin_mg / 7).toFixed(2)),
      vitamin_b3_niacin_mg: parseFloat((totalBComplex.vitamin_b3_niacin_mg / 7).toFixed(1)),
      vitamin_b5_pantothenic_mg: parseFloat((totalBComplex.vitamin_b5_pantothenic_mg / 7).toFixed(1)),
      vitamin_b6_mg: parseFloat((totalBComplex.vitamin_b6_mg / 7).toFixed(2)),
      vitamin_b7_biotin_mcg: parseFloat((totalBComplex.vitamin_b7_biotin_mcg / 7).toFixed(1)),
      vitamin_b12_mcg: parseFloat((totalBComplex.vitamin_b12_mcg / 7).toFixed(1)),
      folate_mcg: Math.round(totalBComplex.folate_mcg / 7),
    })
    setStructuralMinerals({
      calcium_mg: Math.round(totalStructuralMinerals.calcium_mg / 7),
      phosphorus_mg: Math.round(totalStructuralMinerals.phosphorus_mg / 7),
      manganese_mg: parseFloat((totalStructuralMinerals.manganese_mg / 7).toFixed(2)),
      iodine_mcg: Math.round(totalStructuralMinerals.iodine_mcg / 7),
      chromium_mcg: Math.round(totalStructuralMinerals.chromium_mcg / 7),
    })
    setEssentialAminoAcids({
      leucine_mg: Math.round(totalAminoAcids.leucine_mg / 7),
      isoleucine_mg: Math.round(totalAminoAcids.isoleucine_mg / 7),
      valine_mg: Math.round(totalAminoAcids.valine_mg / 7),
      lysine_mg: Math.round(totalAminoAcids.lysine_mg / 7),
      methionine_mg: Math.round(totalAminoAcids.methionine_mg / 7),
      phenylalanine_mg: Math.round(totalAminoAcids.phenylalanine_mg / 7),
      threonine_mg: Math.round(totalAminoAcids.threonine_mg / 7),
      histidine_mg: Math.round(totalAminoAcids.histidine_mg / 7),
      tryptophan_mg: Math.round(totalAminoAcids.tryptophan_mg / 7),
    })

    setLoading(false)
  }

  const handleSubmitToN8N = async () => {
    if (!userMessage.trim()) { setError('Por favor escribe un mensaje'); return }
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await submitHealthData(userMessage)
      if (result.success) { setAiResponse(result.data); setUserMessage('') }
      else setError(result.message || 'Error al procesar la solicitud')
    } catch (err) {
      setError('Error inesperado al enviar datos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const macroDistribution = [
    { name: 'Proteína', value: averages.protein_g * 4, color: '#3b82f6' },
    { name: 'Carbohidratos', value: averages.carbs_g * 4, color: '#10b981' },
    { name: 'Grasas', value: averages.fat_g * 9, color: '#f59e0b' },
  ]

  const chartTooltipStyle = {
    backgroundColor: 'rgba(17,17,17,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#fff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-700 animate-pulse shadow-lg shadow-primary/30" />
          <p className="text-dark-muted text-sm">Cargando análisis...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-dark-bg pb-24">

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden px-4 pt-6 pb-8 mb-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-4 right-1/4 w-56 h-48 bg-info/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg shadow-primary/30">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Análisis Nutricional</h1>
              <p className="text-sm text-dark-muted">Últimos 7 días</p>
            </div>
          </div>

          {/* Key metrics pills */}
          <div className="flex gap-2 flex-wrap mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-card/60 backdrop-blur-sm border border-dark-border/50 rounded-full text-xs font-bold text-white">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              {averages.calories} kcal/día
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-card/60 backdrop-blur-sm border border-dark-border/50 rounded-full text-xs font-bold text-white">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              {averages.protein_g}g proteína
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-card/60 backdrop-blur-sm border border-dark-border/50 rounded-full text-xs font-bold text-white">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              {averages.carbs_g}g carbos
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 max-w-7xl mx-auto">

        {/* ── AI Analysis ── */}
        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-md shadow-primary/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-black text-white">Análisis con IA</h2>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleSubmitToN8N()}
              placeholder="Pregunta sobre tu nutrición o pide un análisis..."
              className="flex-1 px-4 py-3 bg-dark-hover/60 border border-dark-border/50 rounded-xl text-white placeholder-dark-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmitToN8N}
              disabled={isSubmitting || !userMessage.trim()}
              className="px-5 py-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {aiResponse && (
            <div className="mt-3 p-4 bg-dark-hover/50 border border-dark-border/40 rounded-xl">
              <p className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-2">Respuesta IA</p>
              <pre className="text-sm text-dark-text whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(aiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* ── Average Metric Cards ── */}
        <div className="analysis-section grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Calorías', value: averages.calories, unit: 'kcal/día', icon: Zap, color: 'text-amber-400', bg: 'from-amber-500/15 to-orange-500/5', border: 'border-amber-500/20' },
            { label: 'Proteína', value: `${averages.protein_g}g`, unit: '/día', icon: Activity, color: 'text-blue-400', bg: 'from-blue-500/15 to-cyan-500/5', border: 'border-blue-500/20' },
            { label: 'Carbohidratos', value: `${averages.carbs_g}g`, unit: '/día', icon: Flame, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-green-500/5', border: 'border-emerald-500/20' },
            { label: 'Grasas', value: `${averages.fat_g}g`, unit: '/día', icon: Droplets, color: 'text-amber-400', bg: 'from-amber-500/15 to-orange-500/5', border: 'border-amber-500/20' },
          ].map(({ label, value, unit, icon: Icon, color, bg, border }) => (
            <div key={label} className={`relative overflow-hidden bg-gradient-to-br ${bg} backdrop-blur-sm border ${border} rounded-2xl p-4 shadow-lg shadow-black/20`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg bg-dark-bg/40`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <span className="text-dark-muted text-xs font-semibold">{label}</span>
              </div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-dark-muted mt-0.5">{unit}</div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="analysis-section grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-black text-white">Tendencia de Calorías</h2>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="#4a5568" tick={{ fontSize: 11, fill: '#7d8590' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#4a5568" tick={{ fontSize: 11, fill: '#7d8590' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: 'rgba(245,158,11,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2.5} fill="url(#calorieGradient)" dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#0d1117' }} activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#0d1117' }} name="Calorías" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-base font-black text-white">Distribución Macros</h2>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <defs>
                  <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
                  </filter>
                </defs>
                <Pie
                  data={macroDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={95}
                  innerRadius={45}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#0d1117"
                  style={{ filter: 'url(#pieShadow)' }}
                >
                  {macroDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bar Chart ── */}
        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-black text-white">Comparación Semanal de Macros</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} barCategoryGap="20%">
              <defs>
                <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="carbsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="#4a5568" tick={{ fontSize: 11, fill: '#7d8590' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#4a5568" tick={{ fontSize: 11, fill: '#7d8590' }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#7d8590' }} />
              <Bar dataKey="protein_g" fill="url(#proteinGrad)" name="Proteína (g)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="carbs_g" fill="url(#carbsGrad)" name="Carbos (g)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="fat_g" fill="url(#fatGrad)" name="Grasas (g)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Deep Nutrient Sections — Collapsible ── */}

        {/* Biohacker Nutrients — Purple */}
        <div className="analysis-section">
          <button
            onClick={() => toggleSection('biohacker')}
            className="relative w-full text-left rounded-2xl overflow-hidden border border-violet-500/15 bg-[#0a0614] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-violet-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            {/* Glow orbs */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-violet-500/10 blur-2xl" />
              <div className="absolute top-2 left-1/3 w-16 h-8 rounded-full bg-purple-400/8 blur-xl" />
              <div className="absolute bottom-0 right-1/4 w-20 h-12 rounded-full bg-violet-600/8 blur-2xl" />
            </div>
            <div className="relative z-10 flex items-center gap-4 p-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-violet-200 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]">Nutrientes Biohacker</h3>
                <p className="text-xs text-violet-100/40 truncate">Omega-3, colina, antioxidantes, probióticos</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-violet-300/70 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
                    Ω3 {biohackerNutrients.omega_3_mg}mg
                  </span>
                  <span className="text-[10px] font-bold text-purple-300/70 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg">
                    Col {biohackerNutrients.choline_mg}mg
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 text-violet-400/60 transition-transform duration-300 ${expandedSection === 'biohacker' ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </button>
          {expandedSection === 'biohacker' && (
            <div className="mt-2 bg-dark-card/40 backdrop-blur-sm border border-violet-500/10 rounded-2xl p-5">
              <BiohackerNutrients nutrients={biohackerNutrients} />
            </div>
          )}
        </div>

        {/* B Complex Vitamins — Yellow/Citrus */}
        <div className="analysis-section">
          <button
            onClick={() => toggleSection('bcomplex')}
            className="relative w-full text-left rounded-2xl overflow-hidden border border-yellow-500/15 bg-[#0f0e04] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(234,179,8,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-yellow-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -top-4 right-8 w-20 h-20 rounded-full bg-yellow-500/8 blur-2xl" />
              <div className="absolute bottom-0 left-1/4 w-24 h-10 rounded-full bg-amber-400/6 blur-xl" />
            </div>
            <div className="relative z-10 flex items-center gap-4 p-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                <Battery className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-yellow-200 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">Complejo B</h3>
                <p className="text-xs text-yellow-100/40 truncate">B1, B2, B3, B5, B6, B7, B12 y folato</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-yellow-300/70 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-lg">
                    B12 {bComplexVitamins.vitamin_b12_mcg}µg
                  </span>
                  <span className="text-[10px] font-bold text-amber-300/70 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                    B6 {bComplexVitamins.vitamin_b6_mg}mg
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 text-yellow-400/60 transition-transform duration-300 ${expandedSection === 'bcomplex' ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </button>
          {expandedSection === 'bcomplex' && (
            <div className="mt-2 bg-dark-card/40 backdrop-blur-sm border border-yellow-500/10 rounded-2xl overflow-hidden">
              <BComplexVitamins vitamins={bComplexVitamins} />
            </div>
          )}
        </div>

        {/* Structural Minerals — Slate/Stone */}
        <div className="analysis-section">
          <button
            onClick={() => toggleSection('minerals')}
            className="relative w-full text-left rounded-2xl overflow-hidden border border-slate-500/20 bg-[#07090f] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(148,163,184,0.15),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-slate-400/35 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-2 right-12 w-16 h-16 rounded-full bg-slate-400/6 blur-2xl" />
              <div className="absolute -bottom-2 left-1/3 w-20 h-10 rounded-full bg-slate-300/5 blur-xl" />
            </div>
            <div className="relative z-10 flex items-center gap-4 p-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(148,163,184,0.1)]">
                <Layers className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-200">Minerales Estructurales</h3>
                <p className="text-xs text-slate-100/40 truncate">Calcio, fósforo, manganeso, yodo, cromo</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-300/70 bg-slate-500/10 border border-slate-500/20 px-2 py-1 rounded-lg">
                    Ca {structuralMinerals.calcium_mg}mg
                  </span>
                  <span className="text-[10px] font-bold text-slate-300/60 bg-slate-500/10 border border-slate-500/20 px-2 py-1 rounded-lg">
                    P {structuralMinerals.phosphorus_mg}mg
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400/60 transition-transform duration-300 ${expandedSection === 'minerals' ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </button>
          {expandedSection === 'minerals' && (
            <div className="mt-2 bg-dark-card/40 backdrop-blur-sm border border-slate-500/10 rounded-2xl overflow-hidden">
              <StructuralMinerals minerals={structuralMinerals} />
            </div>
          )}
        </div>

        {/* Essential Amino Acids — Cyan/Teal */}
        <div className="analysis-section">
          <button
            onClick={() => toggleSection('aminoacids')}
            className="relative w-full text-left rounded-2xl overflow-hidden border border-cyan-500/15 bg-[#040f10] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-cyan-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -top-4 right-10 w-20 h-20 rounded-full bg-cyan-500/8 blur-2xl" />
              <div className="absolute bottom-0 left-1/4 w-24 h-10 rounded-full bg-teal-400/6 blur-xl" />
            </div>
            <div className="relative z-10 flex items-center gap-4 p-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-600/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <Dna className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-cyan-200 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">Aminoácidos Esenciales</h3>
                <p className="text-xs text-cyan-100/40 truncate">BCAAs + aminoácidos cerebrales y musculares</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cyan-300/70 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg">
                    Leu {essentialAminoAcids.leucine_mg}mg
                  </span>
                  <span className="text-[10px] font-bold text-teal-300/60 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-lg">
                    BCAA ×3
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 text-cyan-400/60 transition-transform duration-300 ${expandedSection === 'aminoacids' ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </button>
          {expandedSection === 'aminoacids' && (
            <div className="mt-2 bg-dark-card/40 backdrop-blur-sm border border-cyan-500/10 rounded-2xl overflow-hidden">
              <EssentialAminoAcids aminoAcids={essentialAminoAcids} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
