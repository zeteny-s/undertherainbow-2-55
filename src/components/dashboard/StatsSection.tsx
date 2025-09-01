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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fade-in">
      <StatCard
        title="Összes számla"
        value={stats.totalInvoices}
        icon={FileText}
        change={{
          value: "+5.2%",
          isPositive: true
        }}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Teljes Kiadás"
        value={formatCurrency(stats.totalAmount)}
        icon={DollarSign}
        change={{
          value: "+12.1%",
          isPositive: true
        }}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Alapítvány"
        value={stats.alapitvanyCount}
        icon={Building2}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Óvoda"
        value={stats.ovodaCount}
        icon={GraduationCap}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Banki átutalás"
        value={stats.bankTransferCount}
        icon={Banknote}
        change={{
          value: "+3.1%",
          isPositive: true
        }}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Kártya/Készpénz"
        value={stats.cardCashCount}
        icon={CreditCard}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Ez a hónap"
        value={stats.thisMonthCount}
        icon={Calendar}
        change={{
          value: "+8.3%",
          isPositive: true
        }}
        className="hover-glow animate-float"
      />
      
      <StatCard
        title="Feldolgozás alatt"
        value={stats.pendingCount}
        icon={Clock}
        change={{
          value: "-2.1%",
          isPositive: false
        }}
        className="hover-glow animate-float"
      />
    </div>
  );
};