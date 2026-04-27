'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type ColumnType =
  | 'text' | 'description' | 'date' | 'badge' | 'user' | 'statusActive' | 'userEmail'
  | 'amount' | 'status' | 'progress' | 'plan' | 'lastActive' | 'action' | 'actions' | 'contact';

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
  widthClass?: string;
  minWidthClass?: string;
  getHref?: (row: any) => string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title?: string;
  description?: string;
  columns: Column[];
  data: any[];
  isRTL?: boolean;
  emptyMessage?: string;
  filterSection?: React.ReactNode;
  onRowClick?: (row: any) => void;
  rowsPerPage?: number;
  onEdit?: (row: any) => void;   // دالة التعديل
  onDelete?: (row: any) => void; // دالة الحذف
  onView?: (row: any) => void;   // دالة العرض
}

const DataTable = ({
  title,
  description,
  columns,
  data = [],
  isRTL,
  emptyMessage = 'No data found',
  filterSection,
  onRowClick,
  rowsPerPage = 5,
  onEdit,   // <--- لازم نستخرجهم هنا عشان الكود يشوفهم
  onDelete, // <---
  onView    // <---
}: DataTableProps) => {

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const pageNumber = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(pageNumber);
  };

  const renderCellContent = (row: any, col: Column) => {
    const value = row[col.key];
    if (col.render) return col.render(value, row);

    switch (col.type) {
      case 'userEmail':
        return (
          <div className="flex items-center gap-3">
            {row.image ? (
              <img src={row.image} alt={value} className="object-cover w-10 h-10 rounded-full shrink-0" />
            ) : (
              <div className="flex items-center justify-center w-10 h-10 font-bold transition-colors rounded-full bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20">
                {value?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-900 truncate transition-colors group-hover:text-primary">{value || 'Unknown'}</span>
              <span className="text-xs text-gray-500 truncate">{row.email}</span>
            </div>
          </div>
        );
      case 'user':
        return (
          <div className="flex items-center gap-3">
            {row.image ? (
              <img src={row.image} alt={value} className="object-cover w-10 h-10 rounded-full shrink-0" />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-gradient-to-br from-[#488981] to-[#51D1B8] shrink-0">
                {value?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-900 truncate transition-colors group-hover:text-primary">{value || 'Unknown'}</span>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-900 truncate transition-colors group-hover:text-primary">{value || 'Unknown'}</span>
              <span className="text-xs text-gray-500 truncate">{row.email}</span>
            </div>
          </div>
        );

      case 'actions':
        return (
          <div className="flex items-center gap-2">
            {onView && (
              <button 
                onClick={(e) => { e.stopPropagation(); onView(row); }}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            )}
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors bg-gray-50 rounded-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 rounded-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        );

      case 'date':
        return <span className="text-sm text-gray-600 whitespace-nowrap">{new Date(value).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>;
      case 'amount':
        return <span className="text-sm font-semibold text-gray-900">{row.currency || '$'}{parseFloat(value || 0).toLocaleString()}</span>;
      case 'statusActive':
        const isActive = value?.toLowerCase() === 'active';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {value}
          </span>
        );
      case 'badge':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ color: row.badgeColor, backgroundColor: row.badgeBg }}>{value}</span>;
      case 'action':
        return <button className="p-1 text-xl text-gray-400 hover:text-gray-600">⋯</button>;
      default:
        return <span className="text-sm text-gray-700">{value}</span>;
    }
  };

  const renderCell = (row: any, col: Column) => {
    const content = renderCellContent(row, col);
    const href = col.getHref ? col.getHref(row) : null;
    return href ? <Link href={href} className="block cursor-pointer group">{content}</Link> : content;
  };

  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="flex flex-col justify-between gap-4 p-6 border-b md:flex-row md:items-center border-gray-50">
        <div className="space-y-1">
          {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="shrink-0">{filterSection}</div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead className="bg-[#F9FAFB]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`p-4 text-xs font-semibold text-gray-500 uppercase px-6 ${isRTL ? 'text-right' : 'text-left'} ${col.widthClass || ''} ${col.minWidthClass || 'min-w-[140px]'}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className={`transition-colors hover:bg-gray-50/50 ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(row)}>
                  {columns.map((col) => (
                    <td key={col.key} className="p-4 align-middle px-6 min-h-[60px]">{renderCell(row, col)}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length} className="p-10 text-center text-gray-400">{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>

          <div className="flex items-center justify-between p-4 bg-white border-t border-gray-50">
        <div className="text-sm text-gray-700">
          {isRTL ? (
            <>عرض <span className="font-medium">{startIndex + 1}</span> إلى <span className="font-medium">{Math.min(endIndex, data.length)}</span> من <span className="font-medium">{data.length}</span> نتائج</>
          ) : (
            <>Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, data.length)}</span> of <span className="font-medium">{data.length}</span> results</>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRTL ? '>' : '<'}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              // إظهار أول صفحة، آخر صفحة، والصفحة الحالية وما حولها (يمكن تطويرها لاحقاً لجدول ضخم)
              return (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-8 h-8 text-sm font-medium rounded-md transition-colors ${currentPage === i + 1
                    ? 'bg-[#488981] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRTL ? '<' : '>'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;