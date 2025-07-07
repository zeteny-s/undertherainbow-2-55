import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';

interface WidgetLibraryProps {
  onAddWidget: (widgetType: string) => void;
  onClose: () => void;
  availableTypes: any;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onAddWidget, onClose, availableTypes }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWidgets = Object.entries(availableTypes).filter(([key, widget]: [string, any]) =>
    widget.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Widget könyvtár</h3>
            <p className="text-sm text-gray-600 mt-1">Válasszon widgeteket a dashboard-hoz</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Widget keresése..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Widget Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWidgets.map(([key, widget]: [string, any]) => (
              <div
                key={key}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => onAddWidget(key)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg bg-${widget.color}-100 group-hover:bg-${widget.color}-200 transition-colors`}>
                    <widget.icon className={`h-6 w-6 text-${widget.color}-600`} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">{widget.title}</h4>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Minimum méret: {widget.minW} × {widget.minH}</p>
                  <p>Alapértelmezett: {widget.defaultSize.w} × {widget.defaultSize.h}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${widget.color}-100 text-${widget.color}-800`}>
                    {widget.color}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddWidget(key);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Hozzáadás
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredWidgets.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nincs találat</h3>
              <p className="mt-1 text-sm text-gray-500">
                Próbáljon meg más keresési kifejezést.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {filteredWidgets.length} widget elérhető
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