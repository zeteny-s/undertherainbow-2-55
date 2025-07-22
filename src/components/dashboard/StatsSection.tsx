import React from 'react';
import { FileText, DollarSign, Building2, GraduationCap, CreditCard, Banknote, Calendar, Clock } from 'lucide-react';
import { StatCard } from '../common/StatCard';

interface StatsSectionProps {
  stats: {
    totalInvoices: number;
    totalAmount: number;
    alapitvanyCount: number;
    ovodaCount: number;
    bankTransferCount: number;
    cardCashCount: number;
    thisMonthCount: number;
    pendingCount: number;
  };
  formatCurrency: (amount: number) => string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <StatCard
        title="Összes számla"
        value={stats.totalInvoices}
        icon={FileText}
        iconColor="text-blue-600"
        bgColor="bg-blue-100"
      />
      
      <StatCard
        title="Teljes összeg"
        value={formatCurrency(stats.totalAmount)}
        icon={DollarSign}
        iconColor="text-green-600"
        bgColor="bg-green-100"
      />
      
      <StatCard
        title="Alapítvány"
        value={stats.alapitvanyCount}
        icon={Building2}
        iconColor="text-purple-600"
        bgColor="bg-purple-100"
      />
      
      <StatCard
        title="Óvoda"
        value={stats.ovodaCount}
        icon={GraduationCap}
        iconColor="text-orange-600"
        bgColor="bg-orange-100"
      />
      
      <StatCard
        title="Banki átutalás"
        value={stats.bankTransferCount}
        icon={Banknote}
        iconColor="text-indigo-600"
        bgColor="bg-indigo-100"
      />
      
      <StatCard
        title="Kártya/Készpénz"
        value={stats.cardCashCount}
        icon={CreditCard}
        iconColor="text-pink-600"
        bgColor="bg-pink-100"
      />
      
      <StatCard
        title="Ez a hónap"
        value={stats.thisMonthCount}
        icon={Calendar}
        iconColor="text-teal-600"
        bgColor="bg-teal-100"
      />
      
      <StatCard
        title="Feldolgozás alatt"
        value={stats.pendingCount}
        icon={Clock}
        iconColor="text-yellow-600"
        bgColor="bg-yellow-100"
      />
    </div>
  );
};