import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Building2, GraduationCap, CreditCard, Clock, RefreshCw, Calendar, DollarSign, BarChart3, PieChart, Activity, ChevronLeft, ChevronRight, History, X, Hash } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Area, AreaChart, Pie } from 'recharts';
import { supabase } from '../integrations/supabase/client';
import { ChartEmptyState } from './common/ChartEmptyState';
import { NotificationContainer } from './common/NotificationContainer';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

interface Stats {
  totalInvoices: number;
  totalAmount: number;
  alapitvanyCount: number;
  ovodaCount: number;
  bankTransferCount: number;
  cardCashCount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
}

interface Invoice {
  id: string;
  file_name: string;
  organization: 'alapitvany' | 'ovoda';
  uploaded_at: string;
  processed_at: string;
  status: string;
  partner: string;
  amount: number;
  invoice_type: string;
}

interface ChartData {
  monthlyData: Array<{ month: string; alapitvany: number; ovoda: number; total: number; amount: number }>;
  organizationData: Array<{ name: string; value: number; amount: number; color: string }>;
  paymentTypeData: Array<{ name: string; value: number; amount: number; color: string }>;
  weeklyTrend: Array<{ day: string; date: string; invoices: number; amount: number }>;
  expenseData: Array<{ month: string; expenses: number; count: number }>;
  topPartnersData: Array<{ partner: string; amount: number; invoiceCount: number; color: string }>;
  weeklyExpenseTrend: Array<{ day: string; date: string; amount: number }>;
  munkaszamData: Array<{ munkaszam: string; count: number; amount: number; color: string }>;
  categoryData: Array<{ category: string; count: number; amount: number; color: string }>;
  payrollOverTimeData: Array<{ month: string; rental: number; nonRental: number; tax: number; total: number }>;
  payrollByProjectData: Array<{ munkaszam: string; amount: number; color: string }>;
  rentalVsNonRentalData: Array<{ name: string; value: number; color: string }>;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  data: Array<{ day: string; date: string; invoices: number; amount: number }>;
}

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalAmount: 0,
    alapitvanyCount: 0,
    ovodaCount: 0,
    bankTransferCount: 0,
    cardCashCount: 0,
    thisMonthCount: 0,
    thisMonthAmount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    monthlyData: [],
    organizationData: [],
    paymentTypeData: [],
    weeklyTrend: [],
    expenseData: [],
    topPartnersData: [],
    weeklyExpenseTrend: [],
    munkaszamData: [],
    categoryData: [],
    payrollOverTimeData: [],
    payrollByProjectData: [],
    rentalVsNonRentalData: []
  });
  const [loading, setLoading] = useState(true);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentExpenseWeekIndex, setCurrentExpenseWeekIndex] = useState(0);
  const [weekHistory, setWeekHistory] = useState<WeekData[]>([]);
  const [expenseWeekHistory, setExpenseWeekHistory] = useState<WeekData[]>([]);
  const [showWeekHistory, setShowWeekHistory] = useState(false);
  const [showExpenseWeekHistory, setShowExpenseWeekHistory] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [showAllMunkaszam, setShowAllMunkaszam] = useState(false);
  const [payrollFilter, setPayrollFilter] = useState<'all' | 'rental' | 'nonRental' | 'tax'>('all');
  const [payrollProjectFilter, setPayrollProjectFilter] = useState<'all' | string>('all');
  const [rentalFilter, setRentalFilter] = useState<'all' | string>('all');
  
  // Month navigation states
  const [currentMunkaszamMonthIndex, setCurrentMunkaszamMonthIndex] = useState(0);
  const [currentRentalMonthIndex, setCurrentRentalMonthIndex] = useState(0);
  const [monthHistory, setMonthHistory] = useState<Array<{month: string, value: string}>>([]);
  const [showMunkaszamMonthHistory, setShowMunkaszamMonthHistory] = useState(false);
  const [showRentalMonthHistory, setShowRentalMonthHistory] = useState(false);
  
  // View mode states (all time vs monthly)
  const [munkaszamViewMode, setMunkaszamViewMode] = useState<'all' | 'monthly'>('all');
  const [rentalViewMode, setRentalViewMode] = useState<'all' | 'monthly'>('all');

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Felhasználó';
    
    if (hour >= 4 && hour < 10) {
      return `Jó Reggelt, ${userName}!`;
    } else if (hour >= 10 && hour < 18) {
      return `Szia, ${userName}!`;
    } else if (hour >= 18 && hour < 21) {
      return `Jó estét, ${userName}!`;
    } else {
      return `Jó éjszakát, ${userName}!`;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update charts when filters or view modes change
  useEffect(() => {
    const updateChartData = async () => {
      try {
        const { data: payrollRecords } = await supabase
          .from('payroll_records')
          .select('*');

        if (payrollRecords) {
          // Also get payroll summaries for the updated data
          const { data: payrollSummaries } = await supabase
            .from('payroll_summaries')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false });

          const payrollByProjectData = generatePayrollByProjectData(payrollRecords);
          const rentalVsNonRentalData = generateRentalVsNonRentalData(payrollRecords, payrollSummaries || []);
          
          setChartData(prev => ({
            ...prev,
            payrollByProjectData,
            rentalVsNonRentalData
          }));
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    };

    updateChartData();
  }, [payrollFilter, payrollProjectFilter, rentalFilter, munkaszamViewMode, rentalViewMode]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Fetch payroll records
      const { data: payrollRecords, error: payrollError } = await supabase
        .from('payroll_records')
        .select('*');

      if (payrollError) throw payrollError;

      // Fetch payroll summaries for tax data
      const { data: payrollSummaries, error: summariesError } = await supabase
        .from('payroll_summaries')
        .select('*');

      if (summariesError) throw summariesError;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const thisMonthInvoices = invoices?.filter(inv => {
        if (!inv.invoice_date) return false;
        const invDate = new Date(inv.invoice_date);
        return invDate >= thisMonth && invDate < nextMonth;
      }) || [];


      // Calculate total payroll amount from summaries only (after "Adatok mentése")
      const totalPayrollAndTaxAmount = payrollSummaries?.reduce((sum, summary) => 
        sum + (summary.total_payroll || 0), 0) || 0;

      // Find this month's amounts from payroll summaries only (after saved)
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const thisMonthSummary = payrollSummaries?.find(summary => 
        summary.year === currentYear && summary.month === currentMonth
      ) as any;
      const thisMonthPayrollAmount = thisMonthSummary?.total_payroll || 0;

      const calculatedStats: Stats = {
        totalInvoices: invoices?.length || 0,
        totalAmount: (invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0) + totalPayrollAndTaxAmount,
        alapitvanyCount: invoices?.filter(inv => inv.organization === 'alapitvany').length || 0,
        ovodaCount: invoices?.filter(inv => inv.organization === 'ovoda').length || 0,
        bankTransferCount: invoices?.filter(inv => inv.invoice_type === 'bank_transfer').length || 0,
        cardCashCount: invoices?.filter(inv => inv.invoice_type === 'card_cash_afterpay').length || 0,
        thisMonthCount: thisMonthInvoices.length,
        thisMonthAmount: thisMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) + thisMonthPayrollAmount
      };

      const weekHistoryData = generateWeekHistory(invoices || []);
      setWeekHistory(weekHistoryData);
      setExpenseWeekHistory(weekHistoryData);

      const monthlyData = generateMonthlyData(invoices || [], payrollRecords || []);
      const organizationData = generateOrganizationData(invoices || []);
      const paymentTypeData = generatePaymentTypeData(invoices || []);
      const weeklyTrend = weekHistoryData[0]?.data || [];
      const expenseData = generateExpenseData(invoices || [], payrollRecords || []);
      const topPartnersData = generateTopPartnersData(invoices || []);
      const weeklyExpenseTrend = weekHistoryData[0]?.data || [];
      const munkaszamData = generateMunkaszamData(invoices || []);
      const categoryData = generateCategoryData(invoices || []);
      
      // Generate payroll charts data
      
      const payrollOverTimeData = generatePayrollOverTimeData(payrollRecords || [], payrollSummaries || []);
      const payrollByProjectData = generatePayrollByProjectData(payrollRecords || []);
      const rentalVsNonRentalData = generateRentalVsNonRentalData(payrollRecords || [], payrollSummaries || []);
      
      // Generate month history for navigation
      generateMonthHistory();

      setStats(calculatedStats);
      setRecentInvoices((invoices?.slice(0, 5) || []) as Invoice[]);
      setChartData({
        monthlyData,
        organizationData,
        paymentTypeData,
        weeklyTrend,
        expenseData,
        topPartnersData,
        weeklyExpenseTrend,
        munkaszamData,
        categoryData,
        payrollOverTimeData,
        payrollByProjectData,
        rentalVsNonRentalData
      });

      addNotification('success', 'Adatok sikeresen frissítve');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('error', 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const generateWeekHistory = (invoices: any[]): WeekData[] => {
    const weeks: WeekData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(now.getDate() - daysToMonday - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
      
      const weekData = generateWeeklyTrend(invoices, weekStart);
      
      weeks.push({
        weekStart,
        weekEnd,
        weekLabel,
        data: weekData
      });
    }
    
    return weeks;
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const generateMonthlyData = (invoices: any[], payrollRecords: any[]) => {
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthInvoices = invoices.filter(inv => {
        if (!inv.invoice_date) return false;
        const date = new Date(inv.invoice_date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });

      const monthPayroll = payrollRecords.filter(rec => {
        if (!rec.record_date) return false;
        const date = new Date(rec.record_date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const alapitvanyInvoices = monthInvoices.filter(inv => inv.organization === 'alapitvany');
      const ovodaInvoices = monthInvoices.filter(inv => inv.organization === 'ovoda');
      
      const invoiceAmount = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const payrollAmount = monthPayroll.reduce((sum, rec) => sum + (rec.amount || 0), 0);
      
      return {
        month,
        alapitvany: alapitvanyInvoices.length,
        ovoda: ovodaInvoices.length,
        total: monthInvoices.length,
        amount: invoiceAmount + payrollAmount
      };
    });
  };

  const generateOrganizationData = (invoices: any[]) => {
    const alapitvanyInvoices = invoices.filter(inv => inv.organization === 'alapitvany');
    const ovodaInvoices = invoices.filter(inv => inv.organization === 'ovoda');
    
    return [
      { 
        name: 'Feketerigó Alapítvány', 
        value: alapitvanyInvoices.length, 
        amount: alapitvanyInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#1e40af' 
      },
      { 
        name: 'Feketerigó Alapítványi Óvoda', 
        value: ovodaInvoices.length, 
        amount: ovodaInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#ea580c' 
      }
    ];
  };

  const generatePaymentTypeData = (invoices: any[]) => {
    const bankTransferInvoices = invoices.filter(inv => inv.invoice_type === 'bank_transfer');
    const cardCashInvoices = invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay');
    
    return [
      { 
        name: 'Banki átutalás', 
        value: bankTransferInvoices.length, 
        amount: bankTransferInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#059669' 
      },
      { 
        name: 'Kártya/Készpénz/Utánvét', 
        value: cardCashInvoices.length, 
        amount: cardCashInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#7c3aed' 
      }
    ];
  };

  const generateWeeklyTrend = (invoices: any[], weekStart: Date) => {
    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    
    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      
      const dayInvoices = invoices.filter(inv => {
        if (!inv.invoice_date) return false;
        const invDate = new Date(inv.invoice_date);
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);
        return invDate >= dayStart && invDate <= dayEnd;
      });
      
      return {
        day,
        date: formatDateShort(dayDate),
        invoices: dayInvoices.length,
        amount: dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      };
    });
  };

  const generateExpenseData = (invoices: any[], payrollRecords: any[]) => {
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthInvoices = invoices.filter(inv => {
        if (!inv.invoice_date) return false;
        const date = new Date(inv.invoice_date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });

      const monthPayroll = payrollRecords.filter(rec => {
        if (!rec.record_date) return false;
        const date = new Date(rec.record_date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const invoiceExpenses = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const payrollExpenses = monthPayroll.reduce((sum, rec) => sum + (rec.amount || 0), 0);
      
      return {
        month,
        expenses: invoiceExpenses + payrollExpenses,
        count: monthInvoices.length
      };
    });
  };

  const generateTopPartnersData = (invoices: any[]) => {
    // Group invoices by partner and calculate total spending
    const partnerSpending: { [key: string]: { amount: number; count: number } } = {};
    
    invoices.forEach(invoice => {
      if (invoice.partner && invoice.partner.trim() && invoice.amount && invoice.amount > 0) {
        const partner = invoice.partner.trim();
        if (!partnerSpending[partner]) {
          partnerSpending[partner] = { amount: 0, count: 0 };
        }
        partnerSpending[partner].amount += invoice.amount;
        partnerSpending[partner].count += 1;
      }
    });
    
    // Convert to array and sort by amount (descending)
    const partnersArray = Object.entries(partnerSpending)
      .filter(([, data]) => data.amount > 0) // Only include partners with positive spending
      .map(([partner, data], index) => ({
        partner: partner.length > 12 ? partner.substring(0, 12) + '...' : partner,
        amount: data.amount,
        invoiceCount: data.count,
        color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 partners
    
    return partnersArray;
  };
  
  const generateMunkaszamData = (invoices: any[]) => {
    // Define all possible munkaszám values
    const allMunkaszamValues = [
        "1",
        "11",
        "12",
        "13",
        "2",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "3",
        "4",
        "5",
        "21,22,23",
        "12,24,25",
        "13,26",
      ];
      
    // Group invoices by munkaszam and calculate total spending
    const munkaszamSpending: { [key: string]: { amount: number; count: number } } = {};
    
    // Initialize all possible munkaszám values with zero values
    allMunkaszamValues.forEach(munkaszam => {
      munkaszamSpending[munkaszam] = { amount: 0, count: 0 };
    });
    
    // Add "Nincs munkaszám" for invoices without a munkaszam
    munkaszamSpending["Nincs munkaszám"] = { amount: 0, count: 0 };
    
    // Process invoices
    invoices.forEach(invoice => {
      if (invoice.amount && invoice.amount > 0) {
        // Use 'Nincs munkaszám' for invoices without a munkaszam
        const munkaszam = (invoice.munkaszam && invoice.munkaszam.trim()) ? invoice.munkaszam.trim() : 'Nincs munkaszám';
        
        if (munkaszamSpending[munkaszam]) {
          munkaszamSpending[munkaszam].amount += invoice.amount;
          munkaszamSpending[munkaszam].count += 1;
        } else {
          // If the munkaszám is not in our predefined list, add it
          munkaszamSpending[munkaszam] = { 
            amount: invoice.amount, 
            count: 1 
          };
        }
      }
    });
    
    // Color palette for the chart
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];
    
    // Convert to array and include all munkaszám values
    const munkaszamArray = Object.entries(munkaszamSpending)
      .map(([munkaszam, data], index) => ({
        munkaszam: munkaszam.length > 15 ? munkaszam.substring(0, 15) + '...' : munkaszam,
        fullMunkaszam: munkaszam,
        count: data.count,
        amount: data.amount,
        color: colors[index % colors.length]
      }))
      .filter(item => item.amount > 0 || allMunkaszamValues.includes(item.fullMunkaszam))
      .sort((a, b) => b.amount - a.amount);
    
    return munkaszamArray;
  };
  
  const generateCategoryData = (invoices: any[]) => {
    // Group invoices by category and calculate total spending
    const categorySpending: { [key: string]: { amount: number; count: number } } = {};
    
    // Define valid categories
    const validCategories = [
      'Bérleti díjak',
      'Közüzemi díjak',
      'Szolgáltatások',
      'Étkeztetés költségei',
      'Személyi jellegű kifizetések',
      'Anyagköltség',
      'Tárgyi eszközök',
      'Felújítás, beruházások',
      'Egyéb'
    ];
    
    // Initialize categories with zero values
    validCategories.forEach(category => {
      categorySpending[category] = { amount: 0, count: 0 };
    });
    
    invoices.forEach(invoice => {
      if (invoice.amount && invoice.amount > 0) {
        // Use 'Egyéb' for invoices without a category or with invalid category
        let category = 'Egyéb';
        
        if (invoice.category && invoice.category.trim()) {
          // Remove any " (AI)" suffix if present
          const cleanCategory = invoice.category.trim().replace(/ \(AI\)$/, '');
          
          // Check if it's a valid category
          if (validCategories.includes(cleanCategory)) {
            category = cleanCategory;
          }
        }
        
        categorySpending[category].amount += invoice.amount;
        categorySpending[category].count += 1;
      }
    });
    
    // Color mapping for categories
    const categoryColors: { [key: string]: string } = {
      'Bérleti díjak': '#3b82f6',
      'Közüzemi díjak': '#10b981',
      'Szolgáltatások': '#f59e0b',
      'Étkeztetés költségei': '#8b5cf6',
      'Személyi jellegű kifizetések': '#ef4444',
      'Anyagköltség': '#06b6d4',
      'Tárgyi eszközök': '#84cc16',
      'Felújítás, beruházások': '#ec4899',
      'Egyéb': '#6366f1'
    };
    
    // Convert to array and sort by amount (descending)
    const categoryArray = Object.entries(categorySpending)
      .filter(([, data]) => data.amount > 0) // Only include categories with positive spending
      .map(([category, data]) => ({
        category,
        count: data.count,
        amount: data.amount,
        color: categoryColors[category] || '#6b7280'
      }))
      .sort((a, b) => b.amount - a.amount);
    
    return categoryArray;
  };

  // Generate payroll over time data
  const generatePayrollOverTimeData = (payrollRecords: any[], payrollSummaries: any[]) => {
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthPayroll = payrollRecords.filter(rec => {
        if (!rec.record_date) return false;
        const date = new Date(rec.record_date);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const rentalAmount = monthPayroll
        .filter(rec => rec.is_rental)
        .reduce((sum, rec) => sum + (rec.amount || 0), 0);
      
      const nonRentalAmount = monthPayroll
        .filter(rec => !rec.is_rental)
        .reduce((sum, rec) => sum + (rec.amount || 0), 0);
      
      // Find tax amount for this month from payroll summaries
      const monthSummary = payrollSummaries.find(summary => 
        summary.year === currentYear && 
        summary.month === (index + 1)
      );
      const taxAmount = monthSummary?.tax_amount || 0;
      
      return {
        month,
        rental: rentalAmount,
        nonRental: nonRentalAmount,
        tax: taxAmount,
        total: rentalAmount + nonRentalAmount + taxAmount
      };
    });
  };


  // Generate payroll by project data
  const generatePayrollByProjectData = (payrollRecords: any[]) => {
    let filteredRecords = payrollRecords;
    
    if (payrollProjectFilter !== 'all') {
      const [year, month] = payrollProjectFilter.split('-');
      filteredRecords = payrollRecords.filter(rec => {
        if (!rec.record_date) return false;
        const date = new Date(rec.record_date);
        return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month);
      });
    }
    
    const projectSpending: { [key: string]: number } = {};
    
    filteredRecords.forEach(record => {
      if (record.amount && record.amount > 0) {
        const project = record.project_code || 'Nincs munkaszám';
        if (!projectSpending[project]) {
          projectSpending[project] = 0;
        }
        projectSpending[project] += record.amount;
      }
    });
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#14b8a6'];
    
    return Object.entries(projectSpending)
      .filter(([, amount]) => amount > 0)
      .map(([projekt, amount], index) => ({
        munkaszam: projekt.length > 15 ? projekt.substring(0, 15) + '...' : projekt,
        amount,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Generate rental vs non-rental vs tax data
  const generateRentalVsNonRentalData = (payrollRecords: any[], payrollSummaries: any[]) => {
    let filteredRecords = payrollRecords;
    let taxAmount = 0;
    
    if (rentalFilter !== 'all') {
      const [year, month] = rentalFilter.split('-');
      filteredRecords = payrollRecords.filter(rec => {
        if (!rec.record_date) return false;
        const date = new Date(rec.record_date);
        return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month);
      });
      
      // Get tax amount for the filtered month
      const monthSummary = payrollSummaries.find(summary => 
        summary.year === parseInt(year) && summary.month === parseInt(month) + 1
      );
      taxAmount = (monthSummary as any)?.tax_amount || 0;
    } else {
      // Get total tax amount from all summaries
      taxAmount = payrollSummaries.reduce((sum, summary) => 
        sum + ((summary as any).tax_amount || 0), 0
      );
    }
    
    const rentalAmount = filteredRecords
      .filter(rec => rec.is_rental)
      .reduce((sum, rec) => sum + (rec.amount || 0), 0);
    
    const nonRentalAmount = filteredRecords
      .filter(rec => !rec.is_rental)
      .reduce((sum, rec) => sum + (rec.amount || 0), 0);
    
    return [
      { name: 'Bérleti díjak', value: rentalAmount, color: '#ef4444' },
      { name: 'Nem bérleti díjak', value: nonRentalAmount, color: '#10b981' },
      { name: 'Járulékok', value: taxAmount, color: '#f59e0b' }
    ].filter(item => item.value > 0);
  };

  // Generate month history for navigation
  const generateMonthHistory = () => {
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // Generate months from January current year to current month (in reverse order, most recent first)
    const history = [];
    for (let month = currentMonth; month >= 1; month--) {
      const monthIndex = month - 1; // 0-11 for month names
      history.push({
        month: `${months[monthIndex]} ${currentYear}`,
        value: `${currentYear}.${month.toString().padStart(2, '0')}`
      });
    }
    
    setMonthHistory(history);
  };

  // Month navigation functions
  const navigateMunkaszamMonth = (direction: 'prev' | 'next') => {
    // 'prev' = left arrow = go to past months (higher index)
    // 'next' = right arrow = go to future months (lower index)
    if (direction === 'prev' && currentMunkaszamMonthIndex < monthHistory.length - 1) {
      const newIndex = currentMunkaszamMonthIndex + 1;
      setCurrentMunkaszamMonthIndex(newIndex);
      setPayrollProjectFilter(monthHistory[newIndex]?.value || 'all');
    } else if (direction === 'next' && currentMunkaszamMonthIndex > 0) {
      const newIndex = currentMunkaszamMonthIndex - 1;
      setCurrentMunkaszamMonthIndex(newIndex);
      setPayrollProjectFilter(monthHistory[newIndex]?.value || 'all');
    }
  };

  const navigateRentalMonth = (direction: 'prev' | 'next') => {
    // 'prev' = left arrow = go to past months (higher index)
    // 'next' = right arrow = go to future months (lower index)
    if (direction === 'prev' && currentRentalMonthIndex < monthHistory.length - 1) {
      const newIndex = currentRentalMonthIndex + 1;
      setCurrentRentalMonthIndex(newIndex);
      setRentalFilter(monthHistory[newIndex]?.value || 'all');
    } else if (direction === 'next' && currentRentalMonthIndex > 0) {
      const newIndex = currentRentalMonthIndex - 1;
      setCurrentRentalMonthIndex(newIndex);
      setRentalFilter(monthHistory[newIndex]?.value || 'all');
    }
  };

  const selectMunkaszamMonth = (index: number) => {
    if (index === -1) {
      // "All time" option
      setCurrentMunkaszamMonthIndex(0);
      setPayrollProjectFilter('all');
    } else {
      setCurrentMunkaszamMonthIndex(index);
      setPayrollProjectFilter(monthHistory[index]?.value || 'all');
    }
    setShowMunkaszamMonthHistory(false);
  };

  const selectRentalMonth = (index: number) => {
    if (index === -1) {
      // "All time" option  
      setCurrentRentalMonthIndex(0);
      setRentalFilter('all');
    } else {
      setCurrentRentalMonthIndex(index);
      setRentalFilter(monthHistory[index]?.value || 'all');
    }
    setShowRentalMonthHistory(false);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeekIndex < weekHistory.length - 1) {
      const newIndex = currentWeekIndex + 1;
      setCurrentWeekIndex(newIndex);
      setChartData(prev => ({
        ...prev,
        weeklyTrend: weekHistory[newIndex]?.data || []
      }));
    } else if (direction === 'next' && currentWeekIndex > 0) {
      const newIndex = currentWeekIndex - 1;
      setCurrentWeekIndex(newIndex);
      setChartData(prev => ({
        ...prev,
        weeklyTrend: weekHistory[newIndex]?.data || []
      }));
    }
  };

  const navigateExpenseWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentExpenseWeekIndex < expenseWeekHistory.length - 1) {
      const newIndex = currentExpenseWeekIndex + 1;
      setCurrentExpenseWeekIndex(newIndex);
      setChartData(prev => ({
        ...prev,
        weeklyExpenseTrend: expenseWeekHistory[newIndex]?.data || []
      }));
    } else if (direction === 'next' && currentExpenseWeekIndex > 0) {
      const newIndex = currentExpenseWeekIndex - 1;
      setCurrentExpenseWeekIndex(newIndex);
      setChartData(prev => ({
        ...prev,
        weeklyExpenseTrend: expenseWeekHistory[newIndex]?.data || []
      }));
    }
  };

  const selectExpenseWeek = (index: number) => {
    setCurrentExpenseWeekIndex(index);
    setChartData(prev => ({
      ...prev,
      weeklyExpenseTrend: expenseWeekHistory[index]?.data || []
    }));
    setShowExpenseWeekHistory(false);
  };

  const selectWeek = (index: number) => {
    setCurrentWeekIndex(index);
    setChartData(prev => ({
      ...prev,
      weeklyTrend: weekHistory[index]?.data || []
    }));
    setShowWeekHistory(false);
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.payload.amount && (
                <span className="text-gray-500 ml-2">
                  ({formatCurrency(entry.payload.amount)})
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const TopPartnersTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl max-w-xs">
          <p className="font-semibold text-gray-900 mb-2">{data.fullPartner || label}</p>
          <div className="space-y-1">
            <p className="text-sm text-green-600 font-medium">
              💰 Összeg: {formatCurrency(data.amount)}
            </p>
            <p className="text-sm text-gray-600">
              📄 Számlák: {data.invoiceCount} db
            </p>
            <p className="text-xs text-gray-500">
              📊 Átlag/számla: {formatCurrency(data.amount / data.invoiceCount)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const WeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{data.date}</p>
          <p className="text-sm text-green-600">
            Számlák: {data.invoices}
          </p>
          {data.amount > 0 && (
            <p className="text-sm text-gray-500">
              Összeg: {formatCurrency(data.amount)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };


  const WeeklyExpenseTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{data.date}</p>
          <p className="text-sm text-red-600">
            Kiadás: {formatCurrency(data.amount)}
          </p>
          <p className="text-sm text-gray-500">
            Számlák: {data.invoices} db
          </p>
        </div>
      );
    }
    return null;
  };
  
  const MunkaszamTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
            <p className="font-semibold text-gray-900">{data.fullMunkaszam || data.munkaszam}</p>
          </div>
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Összeg:</span>
              <span className="text-sm font-medium text-blue-700">{formatCurrency(data.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Számlák száma:</span>
              <span className="text-sm font-medium text-gray-900">{data.count} db</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Átlag/számla:</span>
              <span className="text-sm font-medium text-green-600">{formatCurrency(data.amount / data.count)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const CategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
            <p className="font-semibold text-gray-900">{data.category}</p>
          </div>
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Összeg:</span>
              <span className="text-sm font-medium text-purple-700">{formatCurrency(data.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Számlák száma:</span>
              <span className="text-sm font-medium text-gray-900">{data.count} db</span>
            </div>
            {data.count > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Átlag/számla:</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(data.amount / data.count)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Adatok betöltése..." />
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{getTimeBasedGreeting()}</h2>
            <p className="text-gray-600 text-sm sm:text-base">Számla feldolgozási statisztikák és üzleti elemzések</p>
          </div>
          {/* Hide refresh button on mobile */}
          <button
            onClick={fetchDashboardData}
            className="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Frissítés
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Összes számla</p>
              <p className={`${stats.totalInvoices > 999 ? 'text-base sm:text-xl lg:text-2xl' : 'text-lg sm:text-2xl lg:text-3xl'} font-bold text-gray-900 break-words`}>{stats.totalInvoices}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.thisMonthCount} e hónapban</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Teljes összeg</p>
              <p className={`${stats.totalAmount > 9999999 ? 'text-xs sm:text-sm lg:text-xl' : stats.totalAmount > 999999 ? 'text-xs sm:text-base lg:text-2xl' : 'text-sm sm:text-xl lg:text-3xl'} font-bold text-gray-900 break-words`}>{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">Összes feldolgozott</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">E havi számlák</p>
              <p className={`${stats.thisMonthCount > 999 ? 'text-base sm:text-xl lg:text-2xl' : 'text-lg sm:text-2xl lg:text-3xl'} font-bold text-gray-900 break-words`}>{stats.thisMonthCount}</p>
              <p className="text-xs text-blue-600 mt-1">Aktív hónap</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">E havi kiadás</p>
              <p className={`${stats.thisMonthAmount > 9999999 ? 'text-xs sm:text-sm lg:text-xl' : stats.thisMonthAmount > 999999 ? 'text-xs sm:text-base lg:text-2xl' : 'text-sm sm:text-xl lg:text-3xl'} font-bold text-gray-900 break-words`}>{formatCurrency(stats.thisMonthAmount)}</p>
              <p className="text-xs text-red-600 mt-1">Aktuális hónap</p>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 mb-4 sm:mb-6 lg:mb-8">
        {/* First Row: Monthly Trend and Top Partners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Havi számla trend
              </h3>
            </div>
            <div className="h-48 sm:h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="alapitvany" fill="#1e40af" name="Alapítvány" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ovoda" fill="#ea580c" name="Óvoda" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Partners Spending Chart - Completely Redesigned */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                Legmagasabb partneri kiadások
              </h3>
            </div>
            
            {chartData.topPartnersData.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek partner adatok</h3>
                <p className="mt-1 text-sm text-gray-500">
                  A számlák feldolgozása után itt jelennek meg a legnagyobb kiadású partnerek.
                </p>
              </div>
            )}
            
            {chartData.topPartnersData.length > 0 && (
              <div className="h-64 sm:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData.topPartnersData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis 
                      dataKey="partner" 
                      stroke="#374151" 
                      fontSize={9}
                      fontWeight={500}
                      angle={0}
                      textAnchor="middle"
                      height={40}
                      interval={0}
                      tick={{ fill: '#374151' }}
                    />
                    <YAxis 
                      stroke="#374151" 
                      fontSize={11}
                      fontWeight={500}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K Ft`}
                      tick={{ fill: '#374151' }}
                    />
                    <Tooltip content={<TopPartnersTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      radius={[6, 6, 0, 0]}
                      fill="url(#partnerGradient)"
                    >
                      {chartData.topPartnersData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][index]} 
                        />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="partnerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Munkaszám Distribution and Category Spending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
          {/* Munkaszám Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <Hash className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Munkaszám megoszlás
              </h3>
              {chartData.munkaszamData.length > 5 && (
                <button
                  onClick={() => setShowAllMunkaszam(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Összes megtekintése
                </button>
              )}
            </div>
            
            {chartData.munkaszamData.length === 0 && (
              <div className="text-center py-12">
                <Hash className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek munkaszám adatok</h3>
                <p className="mt-1 text-sm text-gray-500">
                  A számlák feldolgozása után itt jelennek meg a munkaszámok szerinti kiadások.
                </p>
              </div>
            )}
            
            {chartData.munkaszamData.length > 0 && (
              <div className="h-64 sm:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData.munkaszamData.slice(0, 5)} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} horizontal={false} />
                    <XAxis 
                      type="number"
                      stroke="#374151" 
                      fontSize={11}
                      fontWeight={500}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K Ft`}
                      tick={{ fill: '#374151' }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="munkaszam" 
                      stroke="#374151" 
                      fontSize={10}
                      fontWeight={500}
                      width={100}
                      tick={{ fill: '#374151' }}
                    />
                    <Tooltip content={<MunkaszamTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                      animationDuration={1000}
                    >
                      {chartData.munkaszamData.slice(0, 5).map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#munkaszamGradient-${index})`} 
                        />
                      ))}
                    </Bar>
                    <defs>
                      {chartData.munkaszamData.slice(0, 5).map((entry, index) => (
                        <linearGradient 
                          key={`gradient-${index}`} 
                          id={`munkaszamGradient-${index}`} 
                          x1="0" 
                          y1="0" 
                          x2="1" 
                          y2="0"
                        >
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                          <stop offset="100%" stopColor={entry.color} stopOpacity={1}/>
                        </linearGradient>
                      ))}
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {chartData.munkaszamData.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Összes:</div>
                    <div className="text-sm font-medium text-blue-700">
                      {formatCurrency(chartData.munkaszamData.reduce((sum, item) => sum + item.amount, 0))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Számlák:</div>
                    <div className="text-sm font-medium text-gray-700">
                      {chartData.munkaszamData.reduce((sum, item) => sum + item.count, 0)} db
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Spending Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                Kategória szerinti kiadások
              </h3>
            </div>
            
            {chartData.categoryData.length === 0 && (
              <div className="text-center py-12">
                <PieChart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek kategória adatok</h3>
                <p className="mt-1 text-sm text-gray-500">
                  A számlák feldolgozása után itt jelennek meg a kategóriák szerinti kiadások.
                </p>
              </div>
            )}
            
            {chartData.categoryData.length > 0 && (
              <div className="h-64 sm:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="amount"
                            animationDuration={1000}
                            animationBegin={200}
                          >
                            {chartData.categoryData.map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#categoryGradient-${index})`}
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CategoryTooltip />} />
                          <defs>
                            {chartData.categoryData.map((entry, index) => (
                              <radialGradient 
                                key={`gradient-${index}`} 
                                id={`categoryGradient-${index}`} 
                                cx="50%" 
                                cy="50%" 
                                r="50%" 
                                fx="50%" 
                                fy="50%"
                              >
                                <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                              </radialGradient>
                            ))}
                          </defs>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {chartData.categoryData.slice(0, 6).map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-default"
                          title={`${item.category}: ${formatCurrency(item.amount)} (${item.count} számla)`}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-gray-700 truncate block">{item.category}</span>
                            <span className="text-[10px] text-gray-500 truncate block">{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Összes kiadás:</div>
                          <div className="text-sm font-medium text-purple-700">
                            {formatCurrency(chartData.categoryData.reduce((sum, item) => sum + item.amount, 0))}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Összes számla:</div>
                          <div className="text-sm font-medium text-gray-700">
                            {chartData.categoryData.reduce((sum, item) => sum + item.count, 0)} db
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Expense Trend - MOVED TO 5TH POSITION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
              Heti kiadás trend
            </h3>
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              {expenseWeekHistory[currentExpenseWeekIndex] && (
                <span className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left">
                  {expenseWeekHistory[currentExpenseWeekIndex].weekLabel}
                </span>
              )}
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => navigateExpenseWeek('prev')}
                  disabled={currentExpenseWeekIndex >= expenseWeekHistory.length - 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Előző hét"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowExpenseWeekHistory(!showExpenseWeekHistory)}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>Előzmények</span>
                </button>
                <button
                  onClick={() => navigateExpenseWeek('next')}
                  disabled={currentExpenseWeekIndex <= 0}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Következő hét"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expense Week History Dropdown */}
          {showExpenseWeekHistory && (
            <div className="mb-4 sm:mb-6 bg-gray-50 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Kiadás heti előzmények</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {expenseWeekHistory.map((week, index) => (
                  <button
                    key={index}
                    onClick={() => selectExpenseWeek(index)}
                    className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                      index === currentExpenseWeekIndex
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium truncate">{week.weekLabel}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(week.data.reduce((sum, day) => sum + day.amount, 0))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-48 sm:h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.weeklyExpenseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K Ft`}
                  domain={[0, 'dataMax']}
                />
                <Tooltip content={<WeeklyExpenseTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#dc2626" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                  name="Kiadás összege"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Organization Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Szervezetek szerinti megoszlás
            </h3>
            <div className="h-40 sm:h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.organizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.organizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value} számla (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col space-y-2 mt-3 sm:mt-4">
              {chartData.organizationData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
              Fizetési módok megoszlása
            </h3>
            <div className="h-40 sm:h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.paymentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.paymentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value} számla (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col space-y-2 mt-3 sm:mt-4">
              {chartData.paymentTypeData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heti Számla Iktatási Aktivitás Chart - 5TH POSITION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Heti Számla Iktatási Aktivitás
          </h3>
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
            {weekHistory[currentWeekIndex] && (
              <span className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left">
                {weekHistory[currentWeekIndex].weekLabel}
              </span>
            )}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                disabled={currentWeekIndex >= weekHistory.length - 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Előző hét"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowWeekHistory(!showWeekHistory)}
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>Előzmények</span>
              </button>
              <button
                onClick={() => navigateWeek('next')}
                disabled={currentWeekIndex <= 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Következő hét"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Week History Dropdown */}
        {showWeekHistory && (
          <div className="mb-4 sm:mb-6 bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Heti előzmények</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {weekHistory.map((week, index) => (
                <button
                  key={index}
                  onClick={() => selectWeek(index)}
                  className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                    index === currentWeekIndex
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{week.weekLabel}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {week.data.reduce((sum, day) => sum + day.invoices, 0)} számla
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-48 sm:h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<WeeklyTooltip />} />
              <Area 
                type="monotone" 
                dataKey="invoices" 
                stroke="#059669" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="Számlák száma"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* All Munkaszám Modal */}
      {showAllMunkaszam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <Hash className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                Összes munkaszám megoszlás
              </h3>
              <button 
                onClick={() => setShowAllMunkaszam(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData.munkaszamData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} horizontal={false} />
                    <XAxis 
                      type="number"
                      stroke="#374151" 
                      fontSize={11}
                      fontWeight={500}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K Ft`}
                      tick={{ fill: '#374151' }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="munkaszam" 
                      stroke="#374151" 
                      fontSize={10}
                      fontWeight={500}
                      width={120}
                      tick={{ fill: '#374151' }}
                    />
                    <Tooltip content={<MunkaszamTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                      animationDuration={1000}
                    >
                      {chartData.munkaszamData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#allMunkaszamGradient-${index})`} 
                        />
                      ))}
                    </Bar>
                    <defs>
                      {chartData.munkaszamData.map((entry, index) => (
                        <linearGradient 
                          key={`gradient-${index}`} 
                          id={`allMunkaszamGradient-${index}`} 
                          x1="0" 
                          y1="0" 
                          x2="1" 
                          y2="0"
                        >
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                          <stop offset="100%" stopColor={entry.color} stopOpacity={1}/>
                        </linearGradient>
                      ))}
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {chartData.munkaszamData.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <p className="font-medium text-gray-900">{item.munkaszam}</p>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Összeg: <span className="text-blue-700 font-medium">{formatCurrency(item.amount)}</span></p>
                      <p>Számlák: <span className="text-gray-700">{item.count} db</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 p-4 sm:p-6">
              <button
                onClick={() => setShowAllMunkaszam(false)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Charts Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-6">
        {/* Total Payroll Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Bérköltségek időbeli alakulása
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={payrollFilter}
                onChange={(e) => setPayrollFilter(e.target.value as 'all' | 'rental' | 'nonRental' | 'tax')}
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">Mind</option>
                <option value="rental">Bérleti</option>
                <option value="nonRental">Nem bérleti</option>
                <option value="tax">Járulékok</option>
              </select>
            </div>
          </div>
          <div className="h-48 sm:h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.payrollOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === "Bérleti díjak") {
                      return [formatCurrency(value), "Bérleti"];
                    } else if (name === "Nem bérleti díjak") {
                      return [formatCurrency(value), "Alkalmazotti"];
                    } else if (name === "Járulékok") {
                      return [formatCurrency(value), "Járulékok"];
                    }
                    return [formatCurrency(value), ""];
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                {(payrollFilter === 'all' || payrollFilter === 'rental') && (
                  <Area 
                    type="monotone" 
                    dataKey="rental" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                    name="Bérleti díjak"
                  />
                )}
                {(payrollFilter === 'all' || payrollFilter === 'nonRental') && (
                  <Area 
                    type="monotone" 
                    dataKey="nonRental" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="Nem bérleti díjak"
                  />
                )}
                {(payrollFilter === 'all' || payrollFilter === 'tax') && (
                  <Area 
                    type="monotone" 
                    dataKey="tax" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                    name="Járulékok"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Donut Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Payroll by Project Code */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                Munkaszámok szerinti bérköltségek
              </h3>
              
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3 lg:space-x-4">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`text-xs font-medium transition-colors ${munkaszamViewMode === 'all' ? 'text-purple-600' : 'text-gray-500'}`}>
                    Minden idő
                  </span>
                  <button
                    onClick={() => {
                      const newMode = munkaszamViewMode === 'all' ? 'monthly' : 'all';
                      setMunkaszamViewMode(newMode);
                      if (newMode === 'monthly') {
                        // Find current month index (index 0 is most recent month in monthHistory)
                        const now = new Date();
                        const currentMonth = now.getMonth() + 1;
                        const currentYear = now.getFullYear();
                        const currentMonthStr = `${currentYear}.${currentMonth.toString().padStart(2, '0')}`;
                        
                        const currentMonthIndex = monthHistory.findIndex(month => month.value === currentMonthStr);
                        const indexToUse = currentMonthIndex >= 0 ? currentMonthIndex : 0;
                        
                        setCurrentMunkaszamMonthIndex(indexToUse);
                        if (monthHistory[indexToUse]) {
                          setPayrollProjectFilter(monthHistory[indexToUse].value);
                        }
                      } else {
                        setPayrollProjectFilter('all');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      munkaszamViewMode === 'monthly' ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        munkaszamViewMode === 'monthly' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium transition-colors ${munkaszamViewMode === 'monthly' ? 'text-purple-600' : 'text-gray-500'}`}>
                    Havi
                  </span>
                </div>

                {/* Month Navigation Controls - only show in monthly mode */}
                {munkaszamViewMode === 'monthly' && (
                  <div className="flex items-center space-x-2 flex-wrap">
                    {monthHistory[currentMunkaszamMonthIndex] && (
                      <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                        {monthHistory[currentMunkaszamMonthIndex].month}
                      </span>
                    )}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigateMunkaszamMonth('prev')}
                        disabled={currentMunkaszamMonthIndex >= monthHistory.length - 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Előző hónap"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowMunkaszamMonthHistory(!showMunkaszamMonthHistory)}
                        className="px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                      >
                        <History className="h-3 w-3" />
                        <span className="hidden sm:inline">Hónapok</span>
                      </button>
                      <button
                        onClick={() => navigateMunkaszamMonth('next')}
                        disabled={currentMunkaszamMonthIndex <= 0}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Következő hónap"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Month History Dropdown - only show in monthly mode */}
            {munkaszamViewMode === 'monthly' && showMunkaszamMonthHistory && (
              <div className="mb-4 sm:mb-6 bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Havi előzmények</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {monthHistory.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => selectMunkaszamMonth(index)}
                      className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                        index === currentMunkaszamMonthIndex
                          ? 'bg-purple-100 border-purple-300 text-purple-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium truncate">{month.month}</div>
                      <div className="text-xs text-gray-500 mt-1">2025</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="h-48 sm:h-64 lg:h-80">
              {(() => {
                // Get filtered data based on view mode
                const filteredData = munkaszamViewMode === 'all' 
                  ? chartData.payrollByProjectData 
                  : chartData.payrollByProjectData;
                
                return filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="amount"
                        label={(entry) => `${entry.munkaszam}`}
                      >
                        {filteredData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Összeg"]}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState 
                    title="Nincs munkaszám adat"
                    description={`Nem találhatók munkaszám szerinti bérköltség adatok ${munkaszamViewMode === 'monthly' ? 'a kiválasztott hónapra' : 'a kiválasztott időszakra'}. Töltsön fel fizetési listákat az adatok megjelenítéséhez.`}
                    type="pie"
                  />
                );
              })()}
            </div>
          </div>

          {/* Rental vs Non-Rental vs Tax Split */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
                Bérleti vs Nem bérleti vs Járulékok megoszlása
              </h3>
              
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3 lg:space-x-4">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`text-xs font-medium transition-colors ${rentalViewMode === 'all' ? 'text-orange-600' : 'text-gray-500'}`}>
                    Minden idő
                  </span>
                  <button
                    onClick={() => {
                      const newMode = rentalViewMode === 'all' ? 'monthly' : 'all';
                      setRentalViewMode(newMode);
                      if (newMode === 'monthly') {
                        // Find current month index (index 0 is most recent month in monthHistory)
                        const now = new Date();
                        const currentMonth = now.getMonth() + 1;
                        const currentYear = now.getFullYear();
                        const currentMonthStr = `${currentYear}.${currentMonth.toString().padStart(2, '0')}`;
                        
                        const currentMonthIndex = monthHistory.findIndex(month => month.value === currentMonthStr);
                        const indexToUse = currentMonthIndex >= 0 ? currentMonthIndex : 0;
                        
                        setCurrentRentalMonthIndex(indexToUse);
                        if (monthHistory[indexToUse]) {
                          setRentalFilter(monthHistory[indexToUse].value);
                        }
                      } else {
                        setRentalFilter('all');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      rentalViewMode === 'monthly' ? 'bg-orange-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rentalViewMode === 'monthly' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium transition-colors ${rentalViewMode === 'monthly' ? 'text-orange-600' : 'text-gray-500'}`}>
                    Havi
                  </span>
                </div>

                {/* Month Navigation Controls - only show in monthly mode */}
                {rentalViewMode === 'monthly' && (
                  <div className="flex items-center space-x-2 flex-wrap">
                    {monthHistory[currentRentalMonthIndex] && (
                      <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                        {monthHistory[currentRentalMonthIndex].month}
                      </span>
                    )}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigateRentalMonth('prev')}
                        disabled={currentRentalMonthIndex >= monthHistory.length - 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Előző hónap"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowRentalMonthHistory(!showRentalMonthHistory)}
                        className="px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                      >
                        <History className="h-3 w-3" />
                        <span className="hidden sm:inline">Hónapok</span>
                      </button>
                      <button
                        onClick={() => navigateRentalMonth('next')}
                        disabled={currentRentalMonthIndex <= 0}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Következő hónap"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Month History Dropdown - only show in monthly mode */}
            {rentalViewMode === 'monthly' && showRentalMonthHistory && (
              <div className="mb-4 sm:mb-6 bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Havi előzmények</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {monthHistory.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => selectRentalMonth(index)}
                      className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                        index === currentRentalMonthIndex
                          ? 'bg-orange-100 border-orange-300 text-orange-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium truncate">{month.month}</div>
                      <div className="text-xs text-gray-500 mt-1">2025</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="h-48 sm:h-64 lg:h-80">
              {(() => {
                // Get filtered data based on view mode
                const filteredData = rentalViewMode === 'all' 
                  ? chartData.rentalVsNonRentalData 
                  : chartData.rentalVsNonRentalData;
                
                return filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={(entry) => `${entry.name}`}
                      >
                        {filteredData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Összeg"]}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState 
                    title="Nincs bér megoszlási adat"
                    description={`Nem találhatók bérleti és járulék megoszlási adatok ${rentalViewMode === 'monthly' ? 'a kiválasztott hónapra' : 'a kiválasztott időszakra'}. Töltsön fel fizetési listákat az adatok megjelenítéséhez.`}
                    type="pie"
                  />
                );
              })()}
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
            Legutóbbi számlák
          </h3>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {invoice.file_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
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

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fájl név
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Szervezet
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feltöltve
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Összeg
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {invoice.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {invoice.organization === 'alapitvany' ? (
                          <>
                            <Building2 className="h-4 w-4 text-blue-800 mr-2" />
                            <span className="text-sm text-gray-900">Alapítvány</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-4 w-4 text-orange-800 mr-2" />
                            <span className="text-sm text-gray-900">Óvoda</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.uploaded_at)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.partner || '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.amount ? formatCurrency(invoice.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {recentInvoices.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek számlák</h3>
              <p className="mt-1 text-sm text-gray-500">
                Kezdje el a számlák feltöltésével a "Feltöltés" menüpontban.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
