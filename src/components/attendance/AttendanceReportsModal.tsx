import React from 'react';
import { ModernAttendanceReports } from './ModernAttendanceReports';

interface AttendanceReportsModalProps {
  onClose: () => void;
}

export const AttendanceReportsModal: React.FC<AttendanceReportsModalProps> = ({ onClose }) => {
  return <ModernAttendanceReports onClose={onClose} />;
};