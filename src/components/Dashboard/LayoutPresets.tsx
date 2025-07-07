import React from 'react';
import { X, Layout, Monitor, Tablet, Smartphone, BarChart3, PieChart, TrendingUp, Calendar, DollarSign, FileText } from 'lucide-react';

interface LayoutPresetsProps {
  onApplyPreset: (preset: any) => void;
  onClose: () => void;
}

export const LayoutPresets: React.FC<LayoutPresetsProps> = ({ onApplyPreset, onClose }) => {
  const presets = [
    {
      id: 'executive',
      name: 'Vezetői áttekintés',
      description: 'Kulcs mutatók és trendek vezetői döntésekhez',
      icon: BarChart3,
      color: 'blue',
      widgets: [
        {
          id: 'key-metrics',
          type: 'key-metrics',
          title: 'Kulcs mutatók',
          icon: FileText,
          color: 'indigo'
        },
        {
          id: 'monthly-trend',
          type: 'monthly-trend',
          title: 'Havi trend',
          icon: BarChart3,
          color: 'blue'
        },
        {
          id: 'expense-trend',
          type: 'expense-trend',
          title: 'Kiadás trend',
          icon: DollarSign,
          color: 'red'
        },
        {
          id: 'organization-pie',
          type: 'organization-pie',
          title: 'Szervezetek megoszlása',
          icon: PieChart,
          color: 'purple'
        }
      ],
      layouts: {
        lg: [
          { i: 'key-metrics', x: 0, y: 0, w: 12, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 8, h: 5 },
          { i: 'organization-pie', x: 8, y: 2, w: 4, h: 5 },
          { i: 'expense-trend', x: 0, y: 7, w: 12, h: 4 }
        ],
        md: [
          { i: 'key-metrics', x: 0, y: 0, w: 10, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 10, h: 5 },
          { i: 'organization-pie', x: 0, y: 7, w: 5, h: 4 },
          { i: 'expense-trend', x: 5, y: 7, w: 5, h: 4 }
        ],
        sm: [
          { i: 'key-metrics', x: 0, y: 0, w: 6, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 6, h: 4 },
          { i: 'organization-pie', x: 0, y: 6, w: 6, h: 4 },
          { i: 'expense-trend', x: 0, y: 10, w: 6, h: 4 }
        ],
        xs: [
          { i: 'key-metrics', x: 0, y: 0, w: 4, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 4, h: 4 },
          { i: 'organization-pie', x: 0, y: 6, w: 4, h: 4 },
          { i: 'expense-trend', x: 0, y: 10, w: 4, h: 4 }
        ]
      }
    },
    {
      id: 'analytical',
      name: 'Analitikai nézet',
      description: 'Részletes elemzések és diagramok',
      icon: PieChart,
      color: 'purple',
      widgets: [
        {
          id: 'key-metrics',
          type: 'key-metrics',
          title: 'Kulcs mutatók',
          icon: FileText,
          color: 'indigo'
        },
        {
          id: 'organization-pie',
          type: 'organization-pie',
          title: 'Szervezetek megoszlása',
          icon: PieChart,
          color: 'purple'
        },
        {
          id: 'payment-pie',
          type: 'payment-pie',
          title: 'Fizetési módok',
          icon: PieChart,
          color: 'green'
        },
        {
          id: 'weekly-activity',
          type: 'weekly-activity',
          title: 'Heti aktivitás',
          icon: TrendingUp,
          color: 'orange'
        },
        {
          id: 'monthly-trend',
          type: 'monthly-trend',
          title: 'Havi trend',
          icon: BarChart3,
          color: 'blue'
        }
      ],
      layouts: {
        lg: [
          { i: 'key-metrics', x: 0, y: 0, w: 12, h: 2 },
          { i: 'organization-pie', x: 0, y: 2, w: 4, h: 4 },
          { i: 'payment-pie', x: 4, y: 2, w: 4, h: 4 },
          { i: 'weekly-activity', x: 8, y: 2, w: 4, h: 4 },
          { i: 'monthly-trend', x: 0, y: 6, w: 12, h: 4 }
        ],
        md: [
          { i: 'key-metrics', x: 0, y: 0, w: 10, h: 2 },
          { i: 'organization-pie', x: 0, y: 2, w: 5, h: 4 },
          { i: 'payment-pie', x: 5, y: 2, w: 5, h: 4 },
          { i: 'weekly-activity', x: 0, y: 6, w: 10, h: 4 },
          { i: 'monthly-trend', x: 0, y: 10, w: 10, h: 4 }
        ],
        sm: [
          { i: 'key-metrics', x: 0, y: 0, w: 6, h: 2 },
          { i: 'organization-pie', x: 0, y: 2, w: 6, h: 4 },
          { i: 'payment-pie', x: 0, y: 6, w: 6, h: 4 },
          { i: 'weekly-activity', x: 0, y: 10, w: 6, h: 4 },
          { i: 'monthly-trend', x: 0, y: 14, w: 6, h: 4 }
        ],
        xs: [
          { i: 'key-metrics', x: 0, y: 0, w: 4, h: 2 },
          { i: 'organization-pie', x: 0, y: 2, w: 4, h: 4 },
          { i: 'payment-pie', x: 0, y: 6, w: 4, h: 4 },
          { i: 'weekly-activity', x: 0, y: 10, w: 4, h: 4 },
          { i: 'monthly-trend', x: 0, y: 14, w: 4, h: 4 }
        ]
      }
    },
    {
      id: 'operational',
      name: 'Operatív nézet',
      description: 'Napi működéshez szükséges információk',
      icon: Calendar,
      color: 'green',
      widgets: [
        {
          id: 'key-metrics',
          type: 'key-metrics',
          title: 'Kulcs mutatók',
          icon: FileText,
          color: 'indigo'
        },
        {
          id: 'recent-invoices',
          type: 'recent-invoices',
          title: 'Legutóbbi számlák',
          icon: Calendar,
          color: 'gray'
        },
        {
          id: 'weekly-activity',
          type: 'weekly-activity',
          title: 'Heti aktivitás',
          icon: TrendingUp,
          color: 'orange'
        }
      ],
      layouts: {
        lg: [
          { i: 'key-metrics', x: 0, y: 0, w: 12, h: 2 },
          { i: 'recent-invoices', x: 0, y: 2, w: 8, h: 6 },
          { i: 'weekly-activity', x: 8, y: 2, w: 4, h: 6 }
        ],
        md: [
          { i: 'key-metrics', x: 0, y: 0, w: 10, h: 2 },
          { i: 'recent-invoices', x: 0, y: 2, w: 10, h: 5 },
          { i: 'weekly-activity', x: 0, y: 7, w: 10, h: 4 }
        ],
        sm: [
          { i: 'key-metrics', x: 0, y: 0, w: 6, h: 2 },
          { i: 'recent-invoices', x: 0, y: 2, w: 6, h: 5 },
          { i: 'weekly-activity', x: 0, y: 7, w: 6, h: 4 }
        ],
        xs: [
          { i: 'key-metrics', x: 0, y: 0, w: 4, h: 2 },
          { i: 'recent-invoices', x: 0, y: 2, w: 4, h: 5 },
          { i: 'weekly-activity', x: 0, y: 7, w: 4, h: 4 }
        ]
      }
    },
    {
      id: 'minimal',
      name: 'Minimális nézet',
      description: 'Csak a legfontosabb információk',
      icon: Monitor,
      color: 'gray',
      widgets: [
        {
          id: 'key-metrics',
          type: 'key-metrics',
          title: 'Kulcs mutatók',
          icon: FileText,
          color: 'indigo'
        },
        {
          id: 'monthly-trend',
          type: 'monthly-trend',
          title: 'Havi trend',
          icon: BarChart3,
          color: 'blue'
        }
      ],
      layouts: {
        lg: [
          { i: 'key-metrics', x: 0, y: 0, w: 12, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 12, h: 5 }
        ],
        md: [
          { i: 'key-metrics', x: 0, y: 0, w: 10, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 10, h: 5 }
        ],
        sm: [
          { i: 'key-metrics', x: 0, y: 0, w: 6, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 6, h: 5 }
        ],
        xs: [
          { i: 'key-metrics', x: 0, y: 0, w: 4, h: 2 },
          { i: 'monthly-trend', x: 0, y: 2, w: 4, h: 5 }
        ]
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Elrendezés sablonok</h3>
            <p className="text-sm text-gray-600 mt-1">Válasszon előre definiált elrendezést</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => onApplyPreset(preset)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg bg-${preset.color}-100 group-hover:bg-${preset.color}-200 transition-colors`}>
                      <preset.icon className={`h-6 w-6 text-${preset.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                    </div>
                  </div>
                  <Layout className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Widget Preview */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Widgetek ({preset.widgets.length}):</h5>
                  <div className="flex flex-wrap gap-2">
                    {preset.widgets.map((widget) => (
                      <span
                        key={widget.id}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${widget.color}-100 text-${widget.color}-800`}
                      >
                        <widget.icon className="h-3 w-3 mr-1" />
                        {widget.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Layout Preview */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Elrendezés előnézet:</h5>
                  <div className="grid grid-cols-12 gap-1 h-16 bg-gray-50 rounded p-2">
                    {preset.layouts.lg.map((item) => (
                      <div
                        key={item.i}
                        className={`bg-${preset.color}-200 rounded opacity-60`}
                        style={{
                          gridColumn: `span ${item.w}`,
                          gridRow: `span ${Math.min(item.h, 4)}`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Responsive Indicators */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Monitor className="h-3 w-3" />
                    <Tablet className="h-3 w-3" />
                    <Smartphone className="h-3 w-3" />
                    <span>Reszponzív</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyPreset(preset);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Alkalmazás
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {presets.length} sablon elérhető
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};