import React from 'react';

const StatCard = ({ icon, value, label, suffix = "" }) => (
  <div className="p-6 transition-all bg-white py-7 rounded-xl hover:shadow-md">
    <div className="flex justify-between gap-3 mb-2">
      <div className="w-12 h-12 rounded-full bg-[#F8F8F8] flex items-center justify-center ">
        {icon?.src ? (
          <img src={icon.src} alt={label} className="w-6 h-6" />
        ) : (
          icon
        )}
      </div>
      <div className="text-3xl font-semibold text-slate-900 leading-none text-[18px] lg:text-3xl">
        {value ?? '0'}{suffix}
      </div>
    </div>
    <div className="text-xs lg:text-xl text-[#00000099] capitalize font-medium">
      {label}
    </div>
  </div>
);

const StatGroup = ({ items = [] }) => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <StatCard
          key={index}
          icon={item.icon}
          label={item.label}
          value={item.value}
          suffix={item.suffix}
        />
      ))}
    </div>
  );
};

export default StatGroup;