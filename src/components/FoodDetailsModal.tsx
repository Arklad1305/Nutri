import { X, ChevronDown, ChevronUp, Activity, Brain, Zap, Flame } from 'lucide-react';
import { Database } from '../lib/database.types';
import { useState } from 'react';

type FoodLog = Database['public']['Tables']['food_logs']['Row'];

interface FoodDetailsModalProps {
  food: FoodLog;
  onClose: () => void;
}

export default function FoodDetailsModal({ food, onClose }: FoodDetailsModalProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const matrix = food.nutritional_matrix;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-border">
        <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{food.food_name}</h2>
            <p className="text-dark-text text-sm">{food.quantity_g ? `${food.quantity_g}g` : 'Cantidad no especificada'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-dark-text" />
          </button>
        </div>

        {food.reply_text && (
          <div className="p-6 border-b border-dark-border bg-dark-hover/30">
            <p className="text-dark-text text-sm leading-relaxed">{food.reply_text}</p>
          </div>
        )}

        <div className="p-6 space-y-4">
          <SectionCard
            title="Motor"
            icon={<Activity className="w-5 h-5" />}
            color="emerald"
            vipData={{
              'Calorías': food.calories ? `${Math.round(food.calories)} kcal` : null,
              'Proteína': food.protein_g ? `${Math.round(food.protein_g)}g` : null,
              'Carbohidratos': food.carbs_g ? `${Math.round(food.carbs_g)}g` : null,
              'Grasas': food.fat_g ? `${Math.round(food.fat_g)}g` : null,
              'Agua': food.water_ml ? `${Math.round(food.water_ml)}ml` : null,
              'Leucina': food.leucine_mg ? `${Math.round(food.leucine_mg)}mg` : null,
              'Sodio': food.sodium_mg ? `${Math.round(food.sodium_mg)}mg` : null,
            }}
            detailData={matrix?.motor}
            isExpanded={expandedSections.includes('motor')}
            onToggle={() => toggleSection('motor')}
          />

          <SectionCard
            title="Cognitivo"
            icon={<Brain className="w-5 h-5" />}
            color="purple"
            vipData={{
              'Colina': food.choline_mg ? `${Math.round(food.choline_mg)}mg` : null,
            }}
            detailData={matrix?.cognitive}
            isExpanded={expandedSections.includes('cognitive')}
            onToggle={() => toggleSection('cognitive')}
          />

          <SectionCard
            title="Hormonal"
            icon={<Zap className="w-5 h-5" />}
            color="amber"
            vipData={{
              'Zinc': food.zinc_mg ? `${Math.round(food.zinc_mg)}mg` : null,
              'Magnesio': food.magnesium_mg ? `${Math.round(food.magnesium_mg)}mg` : null,
              'Vitamina D3': food.vit_d3_iu ? `${Math.round(food.vit_d3_iu)} IU` : null,
            }}
            detailData={matrix?.hormonal}
            isExpanded={expandedSections.includes('hormonal')}
            onToggle={() => toggleSection('hormonal')}
          />

          <SectionCard
            title="Inflamación"
            icon={<Flame className="w-5 h-5" />}
            color="rose"
            vipData={{
              'Omega-3 Total': food.omega_3_total_g ? `${food.omega_3_total_g.toFixed(2)}g` : null,
              'Polifenoles': food.polyphenols_total_mg ? `${Math.round(food.polyphenols_total_mg)}mg` : null,
            }}
            detailData={matrix?.inflammation}
            isExpanded={expandedSections.includes('inflammation')}
            onToggle={() => toggleSection('inflammation')}
          />
        </div>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  color: 'emerald' | 'purple' | 'amber' | 'rose';
  vipData: Record<string, string | null>;
  detailData: any;
  isExpanded: boolean;
  onToggle: () => void;
}

function SectionCard({ title, icon, color, vipData, detailData, isExpanded, onToggle }: SectionCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
  };

  const iconBgClasses = {
    emerald: 'bg-emerald-500/20',
    purple: 'bg-purple-500/20',
    amber: 'bg-amber-500/20',
    rose: 'bg-rose-500/20',
  };

  const hasData = Object.values(vipData).some(v => v !== null) || (detailData && Object.keys(detailData).length > 0);

  if (!hasData) return null;

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {Object.entries(vipData).map(([key, value]) => {
            if (!value) return null;
            return (
              <div key={key} className="bg-dark-card/50 p-3 rounded-lg">
                <p className="text-dark-text text-xs mb-1">{key}</p>
                <p className="text-white font-semibold">{value}</p>
              </div>
            );
          })}
        </div>

        {detailData && Object.keys(detailData).length > 1 && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-dark-card/50 hover:bg-dark-card/70 rounded-lg transition-colors text-sm text-dark-text"
          >
            {isExpanded ? 'Ocultar detalle' : 'Ver detalle bioquímico'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isExpanded && detailData && (
        <div className="border-t border-white/10 bg-dark-card/30 p-4">
          <DetailSection data={detailData} />
        </div>
      )}
    </div>
  );
}

function DetailSection({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([category, values]) => {
        if (!values || typeof values !== 'object') {
          if (typeof values === 'number' && values > 0) {
            return (
              <div key={category} className="flex justify-between items-center py-1">
                <span className="text-dark-text text-sm capitalize">{category.replace(/_/g, ' ')}</span>
                <span className="text-white text-sm font-medium">{values}</span>
              </div>
            );
          }
          return null;
        }

        const hasValues = Object.values(values).some((v: any) => typeof v === 'number' && v > 0);
        if (!hasValues) return null;

        return (
          <div key={category} className="space-y-2">
            <h4 className="text-white font-medium text-sm capitalize border-b border-white/10 pb-1">
              {category.replace(/_/g, ' ')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(values).map(([key, value]) => {
                if (typeof value !== 'number' || value === 0) return null;
                return (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-dark-text capitalize">
                      {key.replace(/_/g, ' ').replace(/mg|mcg|g|iu/gi, '')}
                    </span>
                    <span className="text-white font-medium">
                      {Math.round(value * 10) / 10}
                      {key.includes('_g') ? 'g' : key.includes('_mg') ? 'mg' : key.includes('_mcg') ? 'mcg' : key.includes('_iu') ? 'IU' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
