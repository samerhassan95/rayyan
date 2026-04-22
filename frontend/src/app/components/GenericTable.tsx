'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// تعريف الأنواع المدعومة للأعمدة
export type ColumnType =
  | 'text' | 'description' | 'date' | 'badge' | 'user' | 'statusActive' | 'userEmail'
  | 'amount' | 'status' | 'progress' | 'plan' | 'lastActive' | 'action' | 'contact';

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
  rowsPerPage?: number; // عدد الصفوف في كل صفحة
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
  rowsPerPage = 5
}: DataTableProps) => {

  // --- منطق الباجينيشن (Pagination Logic) ---
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const pageNumber = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(pageNumber);
  };

  // دالة المحتوى الداخلي للخلية
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
        )
      case 'date':
        return (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {new Date(value).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        );
      case 'amount':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {row.currency || '$'}{parseFloat(value || 0).toLocaleString()}
            </span>
          </div>
        );
      case 'statusActive':
        const isActive = value?.toLowerCase() === 'active';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {value}
          </span>
        );
      case 'status':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700`}>
            {value}
          </span>
        );
      case 'progress':
        const statusColors: any = {
          complete: 'bg-blue-50 text-blue-700',
          pending: 'bg-yellow-50 text-yellow-700',
          cancelled: 'bg-gray-50 text-gray-700',
          failed: 'bg-red-50 text-red-700',
          successful: 'bg-green-50 text-green-700',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[value?.toLowerCase()] || 'bg-gray-50 text-gray-700'}`}>
            {value}
          </span>
        );
      case 'description':
        return <p className="max-w-full text-sm text-gray-500 truncate" title={value}>{value}</p>;
      case 'badge':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ color: row.badgeColor, backgroundColor: row.badgeBg }}>
            {value}
          </span>
        );
      case 'plan':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{value}</span>
            <span className="text-xs text-gray-500">{row.planPrice}</span>
          </div>
        );
      case 'lastActive':
        return <span className="text-sm text-gray-500">{value}</span>;
      case 'action':
        return <button className="p-1 text-xl text-gray-400 transition-colors hover:text-gray-600">⋯</button>;
      default:
        return <span className="text-sm text-gray-700">{value}</span>;
    }
  };

  const renderCell = (row: any, col: Column) => {
    const content = renderCellContent(row, col);
    const href = col.getHref ? col.getHref(row) : null;
    if (href) {
      return (
        <Link href={href} className="block cursor-pointer group">
          {content}
        </Link>
      );
    }
    return content;
  };

  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 p-6 border-b md:flex-row md:items-center border-gray-50">
        <div className="space-y-1">
          {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="shrink-0">{filterSection}</div>
      </div>

      {/* Table Container */}
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead className="bg-[#F9FAFB]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    p-4 text-xs font-semibold text-gray-500 uppercase px-6
                    ${isRTL ? 'text-right' : 'text-left'}
                    ${col.widthClass || ''} 
                    ${col.minWidthClass || 'min-w-[140px]'}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentData.length > 0 ? (
              <>
                {currentData.map((row, rowIndex) => (
                  <tr
                    key={row.id || rowIndex}
                    className={`transition-colors hover:bg-gray-50/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-4 align-middle px-6 min-h-[60px]">
                        {renderCell(row, col)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* الحفاظ على مظهر الجدول بملء الصفوف الفارغة بناءً على rowsPerPage */}
                {currentData.length < rowsPerPage && Array.from({ length: rowsPerPage - currentData.length }).map((_, i) => (
                  <tr key={`empty-row-${i}`} className="border-none">
                    {columns.map((col) => (
                      <td key={`empty-cell-${i}-${col.key}`} className="p-4 px-6">
                        <div className="h-6"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer مع التحكم في الصفحات */}
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
  )
}

export default DataTable;