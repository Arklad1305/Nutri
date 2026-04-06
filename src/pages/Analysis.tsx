import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Activity, Send, Sparkles, Loader2 } from 'lucide-react'
import { submitHealthData } from '../lib/n8n'
import { BiohackerNutrients } from '../components/BiohackerNutrients'
import { BComplexVitamins } from '../components/BComplexVitamins'
import { StructuralMinerals } from '../components/StructuralMinerals'
import { EssentialAminoAcids } from '../components/EssentialAminoAcids'

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
  const [averages, setAverages] = useState({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  })

  const [userMessage, setUserMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [biohackerNutrients, setBiohackerNutrients] = useState({
    choline_mg: 0,
    anthocyanins_mg: 0,
    copper_mg: 0,
    vitamin_e_iu: 0,
    vitamin_k1_mcg: 0,
    probiotics_cfu: 0,
    omega_3_mg: 0,
    omega_6_mg: 0,
  })

  const [bComplexVitamins, setBComplexVitamins] = useState({
    vitamin_b1_thiamin_mg: 0,
    vitamin_b2_riboflavin_mg: 0,
    vitamin_b3_niacin_mg: 0,
    vitamin_b5_pantothenic_mg: 0,
    vitamin_b6_mg: 0,
    vitamin_b7_biotin_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 0,
  })

  const [structuralMinerals, setStructuralMinerals] = useState({
    calcium_mg: 0,
    phosphorus_mg: 0,
    manganese_mg: 0,
    iodine_mcg: 0,
    chromium_mcg: 0,
  })

  const [essentialAminoAcids, setEssentialAminoAcids] = useState({
    leucine_mg: 0,
    isoleucine_mg: 0,
    valine_mg: 0,
    lysine_mg: 0,
    methionine_mg: 0,
    phenylalanine_mg: 0,
    threonine_mg: 0,
    histidine_mg: 0,
    tryptophan_mg: 0,
  })

  useEffect(() => {
    if (user) {
      loadWeeklyData()
    }
  }, [user])

  const loadWeeklyData = async () => {
    setLoading(true)
    const days = []
    let totalBiohacker = {
      choline_mg: 0,
      anthocyanins_mg: 0,
      copper_mg: 0,
      vitamin_e_iu: 0,
      vitamin_k1_mcg: 0,
      probiotics_cfu: 0,
      omega_3_mg: 0,
      omega_6_mg: 0,
    }
    let totalBComplex = {
      vitamin_b1_thiamin_mg: 0,
      vitamin_b2_riboflavin_mg: 0,
      vitamin_b3_niacin_mg: 0,
      vitamin_b5_pantothenic_mg: 0,
      vitamin_b6_mg: 0,
      vitamin_b7_biotin_mcg: 0,
      vitamin_b12_mcg: 0,
      folate_mcg: 0,
    }
    let totalStructuralMinerals = {
      calcium_mg: 0,
      phosphorus_mg: 0,
      manganese_mg: 0,
      iodine_mcg: 0,
      chromium_mcg: 0,
    }
    let totalAminoAcids = {
      leucine_mg: 0,
      isoleucine_mg: 0,
      valine_mg: 0,
      lysine_mg: 0,
      methionine_mg: 0,
      phenylalanine_mg: 0,
      threonine_mg: 0,
      histidine_mg: 0,
      tryptophan_mg: 0,
    }

    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const start = startOfDay(day).toISOString()
      const end = endOfDay(day).toISOString()

      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('logged_at', start)
        .lte('logged_at', end)

      const totals = (data || []).reduce(
        (acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein_g: acc.protein_g + (log.protein_g || 0),
          carbs_g: acc.carbs_g + (log.carbs_g || 0),
          fat_g: acc.fat_g + (log.fat_g || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      )

      // Extract from nutritional_matrix JSONB + VIP columns (REAL SCHEMA)
      totalBiohacker = (data || []).reduce(
        (acc, log) => {
          const matrix = log.nutritional_matrix || {}
          const motor = matrix.motor || {}
          const hormonal = matrix.hormonal || {}
          const inflammation = matrix.inflammation || {}

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
        },
        totalBiohacker
      )

      // Extract B Complex Vitamins from nutritional_matrix
      totalBComplex = (data || []).reduce(
        (acc, log) => {
          const matrix = log.nutritional_matrix || {}
          const cognitive = matrix.cognitive || {}
          const vitamins = cognitive.energy_vitamins || {}

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
        },
        totalBComplex
      )

      // Extract Structural Minerals from nutritional_matrix
      totalStructuralMinerals = (data || []).reduce(
        (acc, log) => {
          const matrix = log.nutritional_matrix || {}
          const motor = matrix.motor || {}
          const cognitive = matrix.cognitive || {}
          const hormonal = matrix.hormonal || {}
          const structureMinerals = motor.structure_minerals || {}
          const traceMinerals = cognitive.trace_minerals || {}
          const thyroidMinerals = hormonal.thyroid_insulin || {}

          return {
            calcium_mg: acc.calcium_mg + (structureMinerals.calcium_mg || 0),
            phosphorus_mg: acc.phosphorus_mg + (structureMinerals.phosphorus_mg || 0),
            manganese_mg: acc.manganese_mg + (thyroidMinerals.manganese_mg || 0),
            iodine_mcg: acc.iodine_mcg + (thyroidMinerals.iodine_mcg || 0),
            chromium_mcg: acc.chromium_mcg + (traceMinerals.chromium_mcg || 0),
          }
        },
        totalStructuralMinerals
      )

      // Extract Essential Amino Acids from nutritional_matrix
      totalAminoAcids = (data || []).reduce(
        (acc, log) => {
          const matrix = log.nutritional_matrix || {}
          const motor = matrix.motor || {}
          const cognitive = matrix.cognitive || {}
          const aminosMuscle = motor.aminos_muscle || {}
          const aminosBrain = cognitive.aminos_brain || {}

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
        },
        totalAminoAcids
      )

      days.push({
        date: format(day, 'EEE', { locale: es }),
        ...totals,
      })
    }

    setWeeklyData(days)

    const avg = days.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein_g: acc.protein_g + day.protein_g,
        carbs_g: acc.carbs_g + day.carbs_g,
        fat_g: acc.fat_g + day.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    )

    setAverages({
      calories: Math.round(avg.calories / 7),
      protein_g: Math.round(avg.protein_g / 7),
      carbs_g: Math.round(avg.carbs_g / 7),
      fat_g: Math.round(avg.fat_g / 7),
    })

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
    if (!userMessage.trim()) {
      setError('Por favor escribe un mensaje')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitHealthData(userMessage)

      if (result.success) {
        setAiResponse(result.data)
        setUserMessage('')
      } else {
        setError(result.message || 'Error al procesar la solicitud')
      }
    } catch (err) {
      setError('Error inesperado al enviar datos')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const macroDistribution = [
    { name: 'Proteína', value: averages.protein_g * 4, color: '#3b82f6' },
    { name: 'Carbohidratos', value: averages.carbs_g * 4, color: '#10b981' },
    { name: 'Grasas', value: averages.fat_g * 9, color: '#f59e0b' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">Cargando análisis...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Análisis Nutricional</h1>
          <p className="text-dark-muted">Últimos 7 días</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Análisis con IA</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleSubmitToN8N()}
                placeholder="Pregunta sobre tu nutrición o pide un análisis..."
                className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmitToN8N}
                disabled={isSubmitting || !userMessage.trim()}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-dark-border disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {aiResponse && (
              <div className="p-4 bg-dark-card border border-dark-border rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-2">Respuesta de IA:</h3>
                <pre className="text-sm text-dark-muted whitespace-pre-wrap">
                  {JSON.stringify(aiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="w-layout-grid mb-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="text-dark-muted text-sm">Promedio Calorías</span>
            </div>
            <div className="text-2xl font-bold text-white">{averages.calories}</div>
            <div className="text-xs text-dark-muted">kcal/día</div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-dark-muted text-sm">Promedio Proteína</span>
            </div>
            <div className="text-2xl font-bold text-white">{averages.protein_g}g</div>
            <div className="text-xs text-dark-muted">/día</div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-dark-muted text-sm">Promedio Carbos</span>
            </div>
            <div className="text-2xl font-bold text-white">{averages.carbs_g}g</div>
            <div className="text-xs text-dark-muted">/día</div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              <span className="text-dark-muted text-sm">Promedio Grasas</span>
            </div>
            <div className="text-2xl font-bold text-white">{averages.fat_g}g</div>
            <div className="text-xs text-dark-muted">/día</div>
          </div>
        </div>

        <div className="header1_content mb-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Tendencia Semanal de Calorías</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid #222',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Calorías"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Distribución de Macronutrientes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={macroDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {macroDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: '1px solid #222',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Comparación de Macronutrientes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="protein_g" fill="#3b82f6" name="Proteína (g)" />
              <Bar dataKey="carbs_g" fill="#10b981" name="Carbos (g)" />
              <Bar dataKey="fat_g" fill="#f59e0b" name="Grasas (g)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <BiohackerNutrients nutrients={biohackerNutrients} />
          </div>

          <BComplexVitamins vitamins={bComplexVitamins} />

          <StructuralMinerals minerals={structuralMinerals} />

          <EssentialAminoAcids aminoAcids={essentialAminoAcids} />
        </div>
      </div>
    </div>
  )
}
