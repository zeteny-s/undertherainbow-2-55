                disabled={currentWeekIndex <= 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Következő hét"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Legutóbbi számlák
          </h3>

          {/* Mobile List View */}
          <div className="sm:hidden space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-gray-50 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {invoice.file_name}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {invoice.organization === 'alapitvany' ? (
                      <Building2 className="h-4 w-4 text-blue-800" />
                    ) : (
                      <GraduationCap className="h-4 w-4 text-orange-800" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Partner:</span>
                    <p className="font-medium text-gray-900 truncate">
                      {invoice.partner || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Összeg:</span>
                    <p className="font-medium text-gray-900">
                      {invoice.amount ? formatCurrency(invoice.amount) : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Feltöltve:</span>
                    <p className="text-gray-900">
                      {formatDate(invoice.uploaded_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};