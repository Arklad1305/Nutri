import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Activity, Send, Sparkles, Loader2, BarChart3, Flame, Beef, Wheat, Droplets } from 'lucide-react'
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
          <div className="absolute top-0 left-1/4 w-72 h-64 bg-orange-600/15 rounded-full blur-3xl" />
          <div className="absolute top-4 right-1/4 w-56 h-48 bg-blue-600/15 rounded-full blur-3xl" />
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
              <Beef className="w-3.5 h-3.5 text-blue-400" />
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
            { label: 'Calorías', value: averages.calories, unit: 'kcal/día', icon: Activity, color: 'text-orange-400', glow: 'shadow-orange-500/20' },
            { label: 'Proteína', value: `${averages.protein_g}g`, unit: '/día', icon: Beef, color: 'text-blue-400', glow: 'shadow-blue-500/20' },
            { label: 'Carbohidratos', value: `${averages.carbs_g}g`, unit: '/día', icon: Wheat, color: 'text-green-400', glow: 'shadow-green-500/20' },
            { label: 'Grasas', value: `${averages.fat_g}g`, unit: '/día', icon: Droplets, color: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
          ].map(({ label, value, unit, icon: Icon, color, glow }) => (
            <div key={label} className={`bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-4 shadow-lg ${glow}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-dark-muted text-xs font-semibold">{label}</span>
              </div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-dark-muted mt-0.5">{unit}</div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="analysis-section grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5">
            <h2 className="text-base font-black text-white mb-4">Tendencia de Calorías</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 12 }} />
                <YAxis stroke="#555" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} name="Calorías" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5">
            <h2 className="text-base font-black text-white mb-4">Distribución Macros</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={macroDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
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
        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5">
          <h2 className="text-base font-black text-white mb-4">Comparación Semanal de Macros</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 12 }} />
              <YAxis stroke="#555" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar dataKey="protein_g" fill="#3b82f6" name="Proteína (g)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="carbs_g" fill="#10b981" name="Carbos (g)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fat_g" fill="#f59e0b" name="Grasas (g)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Deep Nutrient Sections ── */}
        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5">
          <BiohackerNutrients nutrients={biohackerNutrients} />
        </div>

        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl overflow-hidden">
          <BComplexVitamins vitamins={bComplexVitamins} />
        </div>

        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl overflow-hidden">
          <StructuralMinerals minerals={structuralMinerals} />
        </div>

        <div className="analysis-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl overflow-hidden">
          <EssentialAminoAcids aminoAcids={essentialAminoAcids} />
        </div>
      </div>
    </div>
  )
}
